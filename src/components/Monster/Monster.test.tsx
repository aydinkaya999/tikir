import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { monsterImages } from '../illustrations';
import { Monster } from './Monster';

describe('Monster', () => {
  it.each([
    [1, 'wild'],
    [1, 'tamed'],
    [2, 'wild'],
    [2, 'tamed'],
  ] as const)('draws kind %i %s', (kind, state) => {
    const { container } = render(<Monster kind={kind} state={state} size={92} />);

    expect(container.querySelector('img')).toHaveAttribute('src', monsterImages[kind][state]);
  });

  it('is decorative unless labelled', () => {
    const { rerender } = render(<Monster kind={1} state="wild" size={92} />);
    expect(screen.queryByRole('img')).toBeNull();

    rerender(<Monster kind={1} state="tamed" size={64} label="kıvrılıyordu" />);
    expect(screen.getByRole('img', { name: 'kıvrılıyordu' })).toBeInTheDocument();
  });
});
