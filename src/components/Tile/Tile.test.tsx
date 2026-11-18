import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { companionImages, lockedTileImage, tilePatternImages } from '../illustrations';
import { Tile } from './Tile';

function imageSources(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('img'), (image) => image.getAttribute('src') ?? '');
}

describe('Tile', () => {
  it('shows a finished chapter as its tile pattern', () => {
    const { container } = render(<Tile state="done" pattern={3} />);

    expect(imageSources(container)).toEqual([tilePatternImages[3]]);
  });

  it('shows today with Tıkır on saffron', () => {
    const { container } = render(<Tile state="today" />);

    expect(imageSources(container)).toEqual([companionImages.normal]);
  });

  it('shows a locked chapter as the dashed tile with a lock', () => {
    const { container } = render(<Tile state="locked" />);

    expect(imageSources(container)).toEqual([lockedTileImage]);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('is decorative; the surrounding list says which chapter it is', () => {
    const { container } = render(<Tile state="done" pattern={1} size={62} />);
    const tile = container.firstElementChild;

    expect(tile).toHaveAttribute('aria-hidden', 'true');
    expect(tile).toHaveStyle({ width: '62px', height: '62px' });
  });
});
