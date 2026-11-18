import { createElement } from 'react';
import { iconGeometry, iconShapes, type IconName } from './iconSet';

export type { IconName } from './iconSet';

interface IconProps {
  name: IconName;
  /** Pixel size of the square icon; the drawings use a 24-unit grid. */
  size?: number;
  /** The set's 2.2 by default; the design thickens tiny badge icons (U3 check: 3.4). */
  strokeWidth?: number;
  className?: string;
}

/**
 * Line icons from design/svg/ikonlar.json (copied verbatim to icons.json): 24 × 24, stroke 2.2,
 * round caps, drawn in currentColor. Always decorative; the control that holds an icon carries
 * the accessible name.
 */
export function Icon({
  name,
  size = 24,
  strokeWidth = iconGeometry.strokeWidth,
  className,
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      width={size}
      height={size}
      viewBox={iconGeometry.viewBox}
      fill={iconGeometry.fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconShapes[name].map(({ tag, attributes }, index) =>
        createElement(tag, { key: index, ...attributes }),
      )}
    </svg>
  );
}
