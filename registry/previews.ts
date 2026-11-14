import type { ComponentType } from 'react';
import { HeroTilt } from './blocks/hero-tilt';
import { ChangelogTimeline } from './blocks/changelog-timeline';
import { PricingCount } from './blocks/pricing-count';

/** Each block with its default props, as the previews render it. */
export const PREVIEWS: Record<string, ComponentType> = {
  'hero-tilt': HeroTilt,
  'changelog-timeline': ChangelogTimeline,
  'pricing-count': PricingCount,
};
