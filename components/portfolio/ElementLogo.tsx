import {
  Cpu, Droplet, Eclipse, Flame, HeartPulse, Hourglass, Moon,
  Mountain, Orbit, Snowflake, Sun, TreePine, Wind, Zap,
} from 'lucide-react';
import type { ElementType } from '../../types';

const ELEMENT_LOGOS = {
  fire: Flame,
  water: Droplet,
  lightning: Zap,
  ice: Snowflake,
  wind: Wind,
  soil: Mountain,
  trees: TreePine,
  dark: Moon,
  light: Sun,
  space: Orbit,
  time: Hourglass,
  robot: Cpu,
  healing: HeartPulse,
  void: Eclipse,
} satisfies Record<ElementType, typeof Flame>;

/** The element itself, without the surrounding magic-seal geometry. */
export function ElementLogo({
  realm,
  className,
  size = 24,
  color = 'currentColor',
}: {
  realm: ElementType;
  className?: string;
  size?: number;
  color?: string;
}) {
  const Icon = ELEMENT_LOGOS[realm];
  return <Icon data-element={realm} aria-hidden="true" className={className} size={size} strokeWidth={1.6} color={color} />;
}
