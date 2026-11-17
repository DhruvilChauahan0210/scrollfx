import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/**
 * Reading a component's own files for its docs page, at build time: the code
 * of each example (as a reader would write it in their project) and the props
 * the component takes. Parsed with the TypeScript compiler, so JSX text and
 * comments never confuse it.
 */

const ROOT = process.cwd();
const parse = (path: string) => ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
/** Imports as they read once installed: components land in components/scrollfx/. */
const installed = (text: string) => text.replaceAll('@/registry/ui/', '@/components/scrollfx/');

/**
 * Each example's code by its name: the imports it uses and its function. An
 * example is an entry `{ name: '...', Component: Fn }` in the file's
 * `examples` array, and Fn a function declared in the same file.
 */
export function exampleSources(slug: string): Record<string, string> {
  const path = join(ROOT, 'registry/examples', `${slug}.tsx`);
  if (!existsSync(path)) return {};
  const sf = parse(path);
  const functions = new Map<string, string>();
  const imports: ts.ImportDeclaration[] = [];
  const entries: [string, string][] = [];
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name) functions.set(st.name.text, st.getText(sf).replace(/^export\s+/, ''));
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.initializer && ts.isArrowFunction(d.initializer)) functions.set(d.name.text, st.getText(sf).replace(/^export\s+/, ''));
        if (ts.isIdentifier(d.name) && d.name.text === 'examples' && d.initializer && ts.isArrayLiteralExpression(d.initializer)) {
          for (const el of d.initializer.elements) {
            if (!ts.isObjectLiteralExpression(el)) continue;
            let name = '', fn = '';
            for (const p of el.properties) {
              if (!ts.isPropertyAssignment(p) && !ts.isShorthandPropertyAssignment(p)) continue;
              const key = p.name.getText(sf);
              if (key === 'name' && ts.isPropertyAssignment(p) && ts.isStringLiteralLike(p.initializer)) name = p.initializer.text;
              if (key === 'Component') fn = ts.isPropertyAssignment(p) ? p.initializer.getText(sf) : 'Component';
            }
            if (name && fn) entries.push([name, fn]);
          }
        }
      }
    }
    if (ts.isImportDeclaration(st)) imports.push(st);
  }
  const out: Record<string, string> = {};
  for (const [name, fn] of entries) {
    const body = functions.get(fn);
    if (!body) continue;
    const used = (id: string) => new RegExp(`\\b${id}\\b`).test(body);
    const lines = imports.flatMap((imp) => {
      const from = imp.moduleSpecifier.getText(sf);
      const clause = imp.importClause;
      if (!clause) return [];
      if (/^['"]react['"]$/.test(from) && clause.isTypeOnly) return [];
      const names: string[] = [];
      if (clause.name && used(clause.name.text)) names.push(clause.name.text);
      const named = clause.namedBindings && ts.isNamedImports(clause.namedBindings) ? clause.namedBindings.elements.filter((e) => used(e.name.text)).map((e) => e.getText(sf)) : [];
      if (!names.length && !named.length) return [];
      const parts = [...names, ...(named.length ? [`{ ${named.join(', ')} }`] : [])];
      return [`import ${clause.isTypeOnly ? 'type ' : ''}${parts.join(', ')} from ${from};`];
    });
    out[name] = installed(`${lines.join('\n')}\n\nexport ${body}\n`).replace(/^\n+/, '');
  }
  return out;
}

export interface Prop {
  name: string;
  type: string;
  optional: boolean;
  description: string;
  default?: string;
}

/**
 * The component's export name and its props: the members of `<Name>Props`
 * (and any interface it extends, from the same file or a lib it imports),
 * with their doc comments and the defaults the function gives them.
 */
export function componentApi(slug: string): { exportName: string | null; props: Prop[] } {
  const path = join(ROOT, 'registry/ui', `${slug}.tsx`);
  if (!existsSync(path)) return { exportName: null, props: [] };
  const sf = parse(path);
  const fn = sf.statements.find((s): s is ts.FunctionDeclaration => ts.isFunctionDeclaration(s) && !!s.name && /^[A-Z]/.test(s.name.text) && !!s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
  if (!fn?.name) return { exportName: null, props: [] };
  const exportName = fn.name.text;

  // Interfaces in this file and in the libs it imports (@/lib/x).
  const files = [sf, ...sf.statements.filter(ts.isImportDeclaration).map((i) => (i.moduleSpecifier as ts.StringLiteral).text).filter((m) => m.startsWith('@/lib/')).map((m) => join(ROOT, 'lib', `${m.slice(6)}.ts`)).filter(existsSync).map(parse)];
  const findInterface = (name: string) => {
    for (const f of files) {
      const found = f.statements.find((s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s) && s.name.text === name);
      if (found) return { node: found, sf: f };
    }
    return null;
  };
  const defaults = new Map<string, string>();
  const param = fn.parameters[0];
  if (param && ts.isObjectBindingPattern(param.name)) {
    for (const el of param.name.elements) if (el.initializer) defaults.set(el.name.getText(sf), el.initializer.getText(sf));
  }
  const props: Prop[] = [];
  const seen = new Set<string>();
  const collect = (name: string) => {
    const found = findInterface(name);
    if (!found) return;
    for (const m of found.node.members) {
      if (!ts.isPropertySignature(m) || !m.type) continue;
      const key = m.name.getText(found.sf);
      if (seen.has(key)) continue;
      seen.add(key);
      const doc = (m as unknown as { jsDoc?: ts.JSDoc[] }).jsDoc?.map((d) => (typeof d.comment === 'string' ? d.comment : '')).join(' ') ?? '';
      props.push({ name: key, type: m.type.getText(found.sf).replace(/\s+/g, ' '), optional: !!m.questionToken, description: doc.replace(/\s+/g, ' ').trim(), default: defaults.get(key) });
    }
    for (const h of found.node.heritageClauses ?? []) for (const t of h.types) collect(t.expression.getText(found.sf));
  };
  collect(`${exportName}Props`);
  return { exportName, props };
}

/** The component's own source, as installed. */
export const componentSource = (slug: string) => installed(readFileSync(join(ROOT, 'registry/ui', `${slug}.tsx`), 'utf8'));
