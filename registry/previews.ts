import type { ComponentType } from 'react';
import { HeroFlowField } from './blocks/hero-flow-field';
import { HatchHighlight } from './blocks/hatch-highlight';
import { PlottedChart } from './blocks/plotted-chart';
import { FeaturePlates } from './blocks/feature-plates';
import { ChangelogPlotted } from './blocks/changelog-plotted';
import { PricingPlotted } from './blocks/pricing-plotted';

/** Each block with its default props, as the previews render it. */
export const PREVIEWS: Record<string, ComponentType> = {
  'hero-flow-field': HeroFlowField,
  'hatch-highlight': HatchHighlight,
  'plotted-chart': PlottedChart,
  'feature-plates': FeaturePlates,
  'changelog-plotted': ChangelogPlotted,
  'pricing-plotted': PricingPlotted,
};
