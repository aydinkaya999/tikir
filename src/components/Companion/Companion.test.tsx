import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { companionImages } from '../illustrations';
import { Companion } from './Companion';

describe('Companion', () => {
  it('is an image named by its label, in the normal face by default', () => {
    render(<Companion size={80} label="Tıkır" />);
    const image = screen.getByRole('img', { name: 'Tıkır' });

    expect(image).toHaveAttribute('src', companionImages.normal);
    expect(image).toHaveAttribute('width', '80');
  });

  it.each(['listen', 'talk', 'happy', 'sleep', 'think'] as const)(
    'shows the %s face',
    (expression) => {
      render(<Companion expression={expression} size={72} label="Tıkır" />);

      expect(screen.getByRole('img', { name: 'Tıkır' })).toHaveAttribute(
        'src',
        companionImages[expression],
      );
    },
  );

  it('is decorative without a label', () => {
    const { container } = render(<Companion size={45} />);

    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img')).toBeNull();
  });
});
