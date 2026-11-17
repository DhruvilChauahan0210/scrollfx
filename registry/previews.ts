import type { ComponentType } from 'react';
import { HeroFlowField } from './blocks/hero-flow-field';
import { HatchHighlight } from './blocks/hatch-highlight';
import { PlottedChart } from './blocks/plotted-chart';
import { FeaturePlates } from './blocks/feature-plates';
import { ChangelogPlotted } from './blocks/changelog-plotted';
import { PricingPlotted } from './blocks/pricing-plotted';
import { StepsRoute } from './blocks/steps-route';
import { CtaHarmonograph } from './blocks/cta-harmonograph';
import { TestimonialsPlotted } from './blocks/testimonials-plotted';
import { FaqPlotted } from './blocks/faq-plotted';
import { FooterPlotted } from './blocks/footer-plotted';
import { TeamPlotted } from './blocks/team-plotted';
import { NewsletterPlotted } from './blocks/newsletter-plotted';
import { LogosPlotted } from './blocks/logos-plotted';
import { BentoPlotted } from './blocks/bento-plotted';
import { StatsPlotted } from './blocks/stats-plotted';

/** Each block with its default props, as the previews render it. */
export const PREVIEWS: Record<string, ComponentType> = {
  'hero-flow-field': HeroFlowField,
  'hatch-highlight': HatchHighlight,
  'plotted-chart': PlottedChart,
  'feature-plates': FeaturePlates,
  'changelog-plotted': ChangelogPlotted,
  'pricing-plotted': PricingPlotted,
  'steps-route': StepsRoute,
  'cta-harmonograph': CtaHarmonograph,
  'testimonials-plotted': TestimonialsPlotted,
  'faq-plotted': FaqPlotted,
  'team-plotted': TeamPlotted,
  'newsletter-plotted': NewsletterPlotted,
  'footer-plotted': FooterPlotted,
  'logos-plotted': LogosPlotted,
  'bento-plotted': BentoPlotted,
  'stats-plotted': StatsPlotted,
};
