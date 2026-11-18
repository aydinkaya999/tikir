import { createElement } from 'react';
import { iconGeometry, iconShapes, type IconName } from './iconSet';

export type { IconName } from './iconSet';

interface IconProps {
  name: IconName;
  /** Pixel size of the square icon; the drawings use a 24-unit grid. */
  size?: number;
  className?: string;
}

/**
 * Line icons from design/svg/ikonlar.json (copied verbatim to icons.json): 24 × 24, stroke 2.2,
 * round caps, drawn in currentColor. Always decorative; the control that holds an icon carries
 * the accessible name.
 */
export function Icon({ name, size = 24, className }: IconProps) {
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
      strokeWidth={iconGeometry.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconShapes[name].map(({ tag, attributes }, index) =>
        createElement(tag, { key: index, ...attributes }),
      )}
    </svg>
  );
}
