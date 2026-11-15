/**
 * Floating panel geometry from src/app/page.module.css (keep in sync): from 1280px the panels cover the
 * map's sides, so the map fits its content into the visible strip between them.
 */
const GAP = 16; // var(--space-4)

export function mapInsets(viewportWidth: number): { left: number; right: number } {
  if (viewportWidth >= 1280) return { left: GAP + 360 + GAP, right: GAP + 460 + GAP };
  return { left: 0, right: 0 };
}
