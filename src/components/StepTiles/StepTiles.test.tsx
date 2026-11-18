import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StepTiles } from './StepTiles';

const steps = [
  { key: 'warmup', label: 'Isınma' },
  { key: 'listen', label: 'Dinle' },
  { key: 'read', label: 'Oku' },
  { key: 'record', label: 'Kayıt' },
  { key: 'wrapUp', label: 'Kapanış' },
];

describe('StepTiles', () => {
  it('lists the five steps and marks the current one', () => {
    render(<StepTiles steps={steps} current={2} label="Seans adımları" />);
    const list = screen.getByRole('list', { name: 'Seans adımları' });
    const items = within(list).getAllByRole('listitem');

    expect(items).toHaveLength(5);
    expect(items[2]).toHaveAttribute('aria-current', 'step');
    expect(items[2]).toHaveTextContent('Oku');
    expect(items.filter((item) => item.hasAttribute('aria-current'))).toHaveLength(1);
  });

  it('ticks the finished steps only', () => {
    render(<StepTiles steps={steps} current={2} label="Seans adımları" />);
    const ticks = screen.getAllByRole('listitem').map((item) => item.querySelector('svg') !== null);

    expect(ticks).toEqual([true, true, false, false, false]);
  });

  it('ticks every step when the session is over', () => {
    render(<StepTiles steps={steps} current={null} label="Seans adımları" />);
    const items = screen.getAllByRole('listitem');

    expect(items.every((item) => item.querySelector('svg') !== null)).toBe(true);
    expect(items.some((item) => item.hasAttribute('aria-current'))).toBe(false);
  });
});
