import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { FRAMEWORKS, type Framework } from './frameworks';

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

/** The site's pen plumbing taken out of an example: what a reader writes has none. */
const unpen = (code: string) =>
  code
    .replace(/\(pen(?::\s*Pen)?\)/g, '()')
    .replace(/\s*\{\.\.\.pen\}/g, '')
    .replace(/\s+\w+=\{pen\.\w+\}/g, '');

const pascal = (words: string) => words.replace(/[^A-Za-z0-9 -]/g, '').split(/[\s-]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

/**
 * Each example's code by its name: the imports it uses, the helpers and
 * constants from its file it uses, and its function. An example is an entry
 * `{ name: '...', Component: Fn }` in the file's `examples` array, Fn a
 * function declared in the same file or written inline.
 */
export function exampleSources(slug: string): Record<string, string> {
  const path = join(ROOT, 'registry/examples', `${slug}.tsx`);
  if (!existsSync(path)) return {};
  const sf = parse(path);
  const functions = new Map<string, string>();
  const constants = new Map<string, string>();
  const imports: ts.ImportDeclaration[] = [];
  const entries: [string, string][] = [];
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name) functions.set(st.name.text, st.getText(sf).replace(/^export\s+/, ''));
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || !d.initializer) continue;
        if (ts.isArrowFunction(d.initializer)) functions.set(d.name.text, st.getText(sf).replace(/^export\s+/, ''));
        else if (d.name.text !== 'examples') constants.set(d.name.text, st.getText(sf).replace(/^export\s+/, ''));
        if (d.name.text === 'examples' && ts.isArrayLiteralExpression(d.initializer)) {
          for (const el of d.initializer.elements) {
            if (!ts.isObjectLiteralExpression(el)) continue;
            let name = '', title = '', fn = '';
            for (const p of el.properties) {
              if (!ts.isPropertyAssignment(p) && !ts.isShorthandPropertyAssignment(p)) continue;
              const key = p.name.getText(sf);
              if (key === 'name' && ts.isPropertyAssignment(p) && ts.isStringLiteralLike(p.initializer)) name = p.initializer.text;
              if (key === 'title' && ts.isPropertyAssignment(p) && ts.isStringLiteralLike(p.initializer)) title = p.initializer.text;
              if (key !== 'Component') continue;
              if (ts.isPropertyAssignment(p) && ts.isArrowFunction(p.initializer)) {
                // Written inline: as the function a reader would declare.
                const body = p.initializer.body;
                const jsx = ts.isParenthesizedExpression(body) ? body.expression.getText(sf) : body.getText(sf);
                const fnName = `${pascal(title || name)}Example`;
                const indented = jsx.split('\n').map((l, i) => (i ? l.replace(/^ {4}/, '') : l)).join('\n');
                functions.set(`inline:${name}`, `function ${fnName}() {\n  return (\n    ${indented.replace(/\n/g, '\n  ')}\n  );\n}`);
                fn = `inline:${name}`;
              } else fn = ts.isPropertyAssignment(p) ? p.initializer.getText(sf) : 'Component';
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
    const main = functions.get(fn);
    if (!main) continue;
    const mentions = (code: string, id: string) => new RegExp(`\\b${id}\\b`).test(code);
    // The file's own helpers and constants it uses, those they use in turn, in file order.
    const local = [...functions.entries(), ...constants.entries()].filter(([id]) => id !== fn && !id.startsWith('inline:'));
    const needed = new Set<string>();
    let grew = true;
    while (grew) {
      grew = false;
      const text = [main, ...[...needed].map((id) => local.find(([l]) => l === id)![1])].join('\n');
      for (const [id] of local) if (!needed.has(id) && mentions(text, id)) { needed.add(id); grew = true; }
    }
    const helpers = local.filter(([id]) => needed.has(id)).map(([, code]) => code);
    const body = unpen([...helpers, `export ${main}`].join('\n\n'));
    const lines = imports.flatMap((imp) => {
      const from = imp.moduleSpecifier.getText(sf);
      const clause = imp.importClause;
      if (!clause) return [];
      if (/^['"]\.\/types['"]$/.test(from)) return [];
      if (/^['"]react['"]$/.test(from) && clause.isTypeOnly) return [];
      const names: string[] = [];
      if (clause.name && mentions(body, clause.name.text)) names.push(clause.name.text);
      const named = clause.namedBindings && ts.isNamedImports(clause.namedBindings) ? clause.namedBindings.elements.filter((e) => mentions(body, e.name.text)).map((e) => e.getText(sf)) : [];
      if (!names.length && !named.length) return [];
      const parts = [...names, ...(named.length ? [`{ ${named.join(', ')} }`] : [])];
      return [`import ${clause.isTypeOnly ? 'type ' : ''}${parts.join(', ')} from ${from};`];
    });
    out[name] = installed(`${lines.join('\n')}\n\n${body}\n`).replace(/^\n+/, '');
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

const pascalName = (slug: string) => slug.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());
const frameworkFile = (slug: string, fw: Exclude<Framework, 'react'>) => join(ROOT, 'registry', fw, `${slug}.${fw}`);

/** The frameworks a component ships in: React, then Vue and Svelte where their files exist. */
export const frameworksOf = (slug: string): Framework[] => FRAMEWORKS.filter((fw) => fw === 'react' || existsSync(frameworkFile(slug, fw)));

/** The component's own source, as installed. */
export const componentSource = (slug: string, fw: Framework = 'react') =>
  fw === 'react' ? installed(readFileSync(join(ROOT, 'registry/ui', `${slug}.tsx`), 'utf8')) : readFileSync(frameworkFile(slug, fw), 'utf8');

/** Where the CLI puts the component in a project. */
export const sourcePath = (slug: string, fw: Framework = 'react') =>
  fw === 'react' ? `components/scrollfx/${slug}.tsx` : fw === 'vue' ? `components/scrollfx/${pascalName(slug)}.vue` : `$lib/components/scrollfx/${pascalName(slug)}.svelte`;

/** A value as a reader would write it in code: single-quoted strings, bare keys, one line when it fits. */
function literal(v: unknown, indent: string): string {
  const inner = indent + '  ';
  if (typeof v === 'string') return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (Array.isArray(v)) {
    const items = v.map((x) => literal(x, inner));
    const flat = `[${items.join(', ')}]`;
    return flat.length <= 72 && !flat.includes('\n') ? flat : `[\n${items.map((x) => inner + x).join(',\n')},\n${indent}]`;
  }
  if (v && typeof v === 'object') {
    const items = Object.entries(v).map(([k, x]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${literal(x, inner)}`);
    const flat = `{ ${items.join(', ')} }`;
    return flat.length <= 72 && !flat.includes('\n') ? flat : `{\n${items.map((x) => inner + x).join(',\n')},\n${indent}}`;
  }
  return String(v);
}

/**
 * Each variant's usage in Vue or Svelte, by example name, from the props the
 * framework check mounts it with (registry/framework-examples/<name>.json).
 */
export function frameworkUsage(slug: string, fw: Exclude<Framework, 'react'>): Record<string, string> {
  const path = join(ROOT, 'registry/framework-examples', `${slug}.json`);
  if (!existsSync(path) || !existsSync(frameworkFile(slug, fw))) return {};
  const name = pascalName(slug);
  const variants = JSON.parse(readFileSync(path, 'utf8')).variants as { name: string; props?: Record<string, unknown>; text?: string }[];
  const out: Record<string, string> = {};
  for (const v of variants) {
    const pad = fw === 'vue' ? '    ' : '  ';
    const attrs = Object.entries(v.props ?? {}).map(([k, x]) => {
      if (x === true) return k;
      if (typeof x === 'string') return `${k}="${x.replace(/"/g, '&quot;')}"`;
      const code = literal(x, pad);
      return fw === 'vue' ? `:${k}="${code.replace(/"/g, '&quot;')}"` : `${k}={${code}}`;
    });
    const at = fw === 'vue' ? '  ' : '';
    const open = attrs.length ? `${at}<${name}\n${attrs.map((a) => pad + a).join('\n')}` : `${at}<${name}`;
    const tag = v.text ? `${open}${attrs.length ? `\n${at}` : ''}>${v.text}</${name}>` : `${open}${attrs.length ? `\n${at}` : ' '}/>`;
    out[v.name] = fw === 'vue'
      ? `<script setup lang="ts">\nimport ${name} from '@/components/scrollfx/${name}.vue';\n</script>\n\n<template>\n${tag}\n</template>\n`
      : `<script lang="ts">\n  import ${name} from '$lib/components/scrollfx/${name}.svelte';\n</script>\n\n${tag}\n`;
  }
  return out;
}
