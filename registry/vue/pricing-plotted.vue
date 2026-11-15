<script setup lang="ts">
/**
 * pricing-plotted — plans in columns, each headed by a mark that grows denser
 * with the plan, plotted as the section arrives. The recommended plan is
 * framed by a pen that goes round it twice, and the prices count up.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`.
 *
 * The prices are in the server HTML (the counter renders its final number).
 * Reduced motion shows the final prices, the marks and the frame drawn.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ScrollCounter, ScrollDraw } from 'svg-scroll-draw/vue';
import { scrollWindow, sketchRect, staggerFor, type Stroke } from '@/lib/plotter';

export interface Plan {
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
}

export interface PricingPlottedProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  plans?: Plan[];
  currency?: string;
  accent?: string;
  className?: string;
}

const props = withDefaults(defineProps<PricingPlottedProps>(), {
  eyebrow: 'Pricing',
  heading: 'Simple, *honest* pricing.',
  description: 'Start free. Upgrade when your team needs more history, more people or more control.',
  plans: () => [
    { name: 'Starter', description: 'For trying it on a side project.', monthly: 0, yearly: 0, features: ['3 dashboards', '7 days of history', 'Email reports', 'Community support'], cta: { label: 'Start free', href: '#' } },
    { name: 'Pro', description: 'For teams that run on their numbers.', monthly: 24, yearly: 19, features: ['Unlimited dashboards', '2 years of history', 'Realtime updates', 'Scheduled reports', 'Slack alerts', 'Priority support'], cta: { label: 'Start a 14-day trial', href: '#' }, featured: true },
    { name: 'Business', description: 'For companies with security reviews.', monthly: 64, yearly: 52, features: ['Everything in Pro', 'Unlimited history', 'SSO and SCIM', 'Audit log', 'Custom retention', 'A named engineer'], cta: { label: 'Talk to sales', href: '#' } },
  ],
  currency: '$',
  accent: '#e0482a',
  className: '',
});

const yearly = ref(true);
const parts = computed(() => props.heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
const rings = (i: number) => 2 + i * 3;
const radius = (i: number, k: number) => 26 - k * (22 / rings(i));

// The pen's frame round the recommended plan, measured to fit it.
const featured = ref<HTMLElement | null>(null);
const frame = ref<{ w: number; h: number; strokes: Stroke[] } | null>(null);
const setFeatured = (el: unknown) => { if (el) featured.value = el as HTMLElement; };
let ro: ResizeObserver | undefined;
const measure = () => {
  const el = featured.value;
  if (!el) return;
  const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
  if (frame.value && frame.value.w === w && frame.value.h === h) return;
  frame.value = { w, h, strokes: sketchRect({ w, h, seed: 3 }) };
};
onMounted(() => {
  measure();
  if (featured.value) { ro = new ResizeObserver(measure); ro.observe(featured.value); }
});
onBeforeUnmount(() => ro?.disconnect());
</script>

<template>
  <section :class="['mx-auto max-w-7xl px-6 py-28 sm:px-10', className]">
    <div class="flex flex-wrap items-end justify-between gap-8">
      <div class="max-w-2xl">
        <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
        <h2 class="mt-6 font-serif text-[clamp(2.6rem,5vw,4.2rem)] leading-[0.98] tracking-[-0.03em]">
          <template v-for="(p, i) in parts" :key="i"><em v-if="p.em" class="italic">{{ p.text }}</em><span v-else>{{ p.text }}</span></template>
        </h2>
        <p class="mt-6 max-w-lg text-pretty text-[17px] leading-relaxed text-muted-foreground">{{ description }}</p>
      </div>
      <div role="radiogroup" aria-label="Billing period" class="inline-flex rounded-full border p-1 font-mono text-[12px] uppercase tracking-[0.14em]">
        <button v-for="o in [{ label: 'Monthly', value: false }, { label: 'Yearly', value: true }]" :key="o.label" type="button" role="radio" :aria-checked="yearly === o.value" :class="['rounded-full px-4 py-2 transition-colors', yearly === o.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground']" @click="yearly = o.value">
          {{ o.label }}
        </button>
      </div>
    </div>

    <div class="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-0">
      <article
        v-for="(plan, i) in plans"
        :key="plan.name"
        :ref="plan.featured ? setFeatured : undefined"
        :class="['relative flex flex-col p-8 sm:p-10', plan.featured ? 'rounded-[20px] bg-card' : i > 0 ? 'border-t lg:border-l lg:border-t-0' : '']"
      >
        <div v-if="plan.featured" class="pointer-events-none absolute inset-0">
          <!-- The second pass follows the first, both round as the card reaches the middle of the screen. -->
          <ScrollDraw v-if="frame" :key="`${frame.w}x${frame.h}`" :stagger="0.5" easing="linear" :trigger="scrollWindow(0.5)" class="size-full" aria-hidden="true">
            <svg :width="frame.w" :height="frame.h" :viewBox="`0 0 ${frame.w} ${frame.h}`" class="block overflow-visible" fill="none" stroke-width="1.3" stroke-linecap="round">
              <path v-for="(s, k) in frame.strokes" :key="k" :d="s.d" :stroke="s.pen ? accent : 'currentColor'" />
            </svg>
          </ScrollDraw>
        </div>
        <!-- A mark of concentric rings: more rings for a bigger plan. -->
        <ScrollDraw :stagger="staggerFor(rings(i), 0.6)" easing="linear" :trigger="scrollWindow(0.6)" class="size-14" aria-hidden="true">
          <svg viewBox="0 0 56 56" class="size-full" fill="none" :stroke="plan.featured ? accent : 'currentColor'" stroke-width="0.9">
            <circle v-for="k in rings(i)" :key="k" cx="28" cy="28" :r="radius(i, k - 1)" />
          </svg>
        </ScrollDraw>
        <h3 class="mt-8 font-serif text-3xl tracking-[-0.02em]">{{ plan.name }}</h3>
        <p class="mt-2 text-muted-foreground">{{ plan.description }}</p>

        <p class="mt-10 flex items-baseline gap-2">
          <span class="font-serif text-6xl tracking-[-0.03em] tabular-nums">
            <!-- A new key per period: the counter starts again from the new number. -->
            {{ currency }}<ScrollCounter :key="`${plan.name}-${yearly}`" :to="yearly ? plan.yearly : plan.monthly" :trigger="scrollWindow()" />
          </span>
          <span class="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">/ month</span>
        </p>
        <p class="mt-2 h-5 text-sm text-muted-foreground">{{ (yearly ? plan.yearly : plan.monthly) > 0 ? (yearly ? 'Billed yearly' : 'Billed monthly') : 'Free, for as long as you like' }}</p>

        <a :href="plan.cta.href" :class="['mt-8 inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-medium transition-transform hover:-translate-y-px', plan.featured ? 'bg-foreground text-background' : 'border hover:bg-accent']">
          {{ plan.cta.label }}
        </a>

        <ul class="mt-10 space-y-3.5">
          <li v-for="ft in plan.features" :key="ft" class="flex items-baseline gap-3.5">
            <span aria-hidden="true" class="mt-[0.55em] h-px w-4 shrink-0 bg-foreground/50" />
            <span>{{ ft }}</span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
