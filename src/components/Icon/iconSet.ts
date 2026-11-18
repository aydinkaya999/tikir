import iconSet from './icons.json';

export type IconName = keyof typeof iconSet.icons;

export interface IconShape {
  tag: 'path' | 'rect' | 'circle';
  attributes: Record<string, string>;
}

export const iconNames = Object.keys(iconSet.icons) as IconName[];

export const iconGeometry = {
  viewBox: iconSet.viewBox,
  fill: iconSet.fill,
  strokeWidth: iconSet['stroke-width'],
} as const;

const SHAPE = /<(path|rect|circle)\b([^>]*)><\/\1>/g;
const ATTRIBUTE = /([a-z]+)="([^"]*)"/g;

// The icon set stores each drawing as SVG markup made only of empty path, rect and circle
// elements. They are turned into element descriptions once, so no markup is ever injected.
function parseShapes(markup: string): IconShape[] {
  return Array.from(markup.matchAll(SHAPE), (match) => ({
    tag: match[1] as IconShape['tag'],
    attributes: Object.fromEntries(
      Array.from((match[2] ?? '').matchAll(ATTRIBUTE), (attribute) => [
        attribute[1] ?? '',
        attribute[2] ?? '',
      ]),
    ),
  }));
}

export const iconShapes = Object.fromEntries(
  iconNames.map((name) => [name, parseShapes(iconSet.icons[name])]),
) as Record<IconName, IconShape[]>;
