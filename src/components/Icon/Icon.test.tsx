import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';
import { iconNames } from './iconSet';
import iconSet from './icons.json';

describe('Icon', () => {
  it('draws a decorative 24-unit line icon in the current colour', () => {
    const { container } = render(<Icon name="mic" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '2.2');
    expect(svg).toHaveAttribute('stroke-linecap', 'round');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg?.querySelector('rect')).not.toBeNull();
  });

  it.each(iconNames)('draws every shape of "%s" from the icon set', (name) => {
    const { container } = render(<Icon name={name} />);
    const svg = container.querySelector('svg');
    const shapesInSet = iconSet.icons[name].match(/<(path|rect|circle)\b/g) ?? [];

    expect(svg?.children).toHaveLength(shapesInSet.length);
    expect(svg?.innerHTML).toBe(iconSet.icons[name]);
  });

  it('takes a heavier stroke for tiny badges (U3 check: 12 px, stroke 3.4)', () => {
    const { container } = render(<Icon name="check" size={12} strokeWidth={3.4} />);

    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '3.4');
  });

  it('takes a size', () => {
    const { container } = render(<Icon name="play" size={18} />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '18');
    expect(svg).toHaveAttribute('height', '18');
  });
});
