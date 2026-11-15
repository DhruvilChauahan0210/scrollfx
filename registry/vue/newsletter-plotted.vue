<script setup lang="ts">
/**
 * newsletter-plotted — a sign-up beside a starburst a pen draws ray by ray,
 * clockwise from the top, as the section arrives: ink rays rising and falling
 * round the circle, every twelfth one long and in the accent colour.
 *
 * Built on svg-scroll-draw (MIT): https://github.com/DhruvilChauahan0210/scrollfx
 * Needs: vue 3, svg-scroll-draw, and lib/plotter (installed with it).
 * Styling: Tailwind CSS with shadcn-vue tokens. The heading takes one emphasised
 * word between asterisks, set in `font-serif`. The print is a `bg-card` sheet.
 *
 * The form is a plain HTML form: it posts `email` to `action`, or emits
 * `subscribe` with the address if you listen for it. Sending the email is up
 * to your provider. The copy and the form are in the server HTML; the starburst
 * is drawn in the browser, finishing as it reaches the middle of the screen.
 * Reduced motion shows it drawn.
 */
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { ScrollDraw } from 'svg-scroll-draw/vue';
import { scrollWindow, staggerFor, starburst, type Stroke } from '@/lib/plotter';

export interface NewsletterPlottedProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  /** Where the form posts. Ignored when you listen for `subscribe`. */
  action?: string;
  button?: string;
  /** A line under the form, such as how often you write. */
  note?: string;
  caption?: string;
  seed?: number;
  accent?: string;
  className?: string;
}

const props = withDefaults(defineProps<NewsletterPlottedProps>(), {
  eyebrow: 'Letters',
  heading: 'One email, *once* a month.',
  description: 'What we shipped, what we learned, and one chart worth reading. Nothing else.',
  action: '#',
  button: 'Subscribe',
  note: 'Unsubscribe from any letter, in one click.',
  caption: 'Pl. — Starburst',
  seed: 23,
  accent: '#e0482a',
  className: '',
});
const emit = defineEmits<{ subscribe: [email: string] }>();

// The rays draw one after another over this many trigger ranges (see scrollWindow).
const SPREAD = 1;

const parts = computed(() => props.heading.split(/(\*[^*]+\*)/).map((p) => ({ em: p.startsWith('*'), text: p.startsWith('*') ? p.slice(1, -1) : p })));
// Handled in the page only when the parent listens for `subscribe`.
const listening = !!getCurrentInstance()?.vnode.props?.onSubscribe;
const rays = ref<Stroke[] | null>(null);
onMounted(() => {
  rays.value = starburst(props.seed);
});

function submit(e: Event) {
  if (!listening) return;
  e.preventDefault();
  emit('subscribe', String(new FormData(e.currentTarget as HTMLFormElement).get('email') ?? ''));
}
</script>

<template>
  <section :class="['mx-auto grid max-w-7xl items-center gap-14 px-6 py-28 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-24', className]">
    <figure class="mx-auto w-full max-w-md lg:max-w-none">
      <div class="aspect-square w-full rounded-[3px] bg-card p-[7%] shadow-[0_1px_0_rgba(0,0,0,.04),0_18px_40px_-18px_rgba(40,30,10,.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,.05),0_24px_60px_-20px_rgba(0,0,0,.8)]">
        <ScrollDraw v-if="rays" :stagger="staggerFor(rays.length, SPREAD)" easing="linear" :trigger="scrollWindow(SPREAD)" class="size-full" aria-hidden="true">
          <svg viewBox="0 0 400 400" class="size-full" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
            <template v-for="(r, i) in rays" :key="i">
              <path v-if="r.pen" :d="r.d" :stroke="accent" stroke-width="1.4" />
              <path v-else :d="r.d" />
            </template>
          </svg>
        </ScrollDraw>
      </div>
      <figcaption class="mt-4 flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>{{ caption }}</span>
        <span>{{ rays ? rays.length : 0 }} rays · seed {{ seed }}</span>
      </figcaption>
    </figure>

    <div class="max-w-lg">
      <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{{ eyebrow }}</p>
      <h2 class="mt-6 font-serif text-[clamp(2.6rem,5vw,4.4rem)] leading-[0.98] tracking-[-0.03em]">
        <template v-for="(p, i) in parts" :key="i"><em v-if="p.em" class="italic">{{ p.text }}</em><span v-else>{{ p.text }}</span></template>
      </h2>
      <p class="mt-6 text-pretty text-[17px] leading-relaxed text-muted-foreground">{{ description }}</p>
      <form :action="listening ? undefined : action" method="post" class="mt-10 flex flex-col gap-3 sm:flex-row" @submit="submit">
        <label class="sr-only" for="newsletter-email">Email address</label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@company.com"
          class="h-12 min-w-0 flex-1 rounded-full border bg-background px-5 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button type="submit" class="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-7 text-[15px] font-medium text-background transition-transform hover:-translate-y-px">
          {{ button }}
        </button>
      </form>
      <p v-if="note" class="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{{ note }}</p>
    </div>
  </section>
</template>
