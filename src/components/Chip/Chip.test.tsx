import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Chip } from './Chip';

describe('Chip', () => {
  it('shows its text with a decorative icon', () => {
    render(<Chip icon="flame">4 gün üst üste</Chip>);
    const chip = screen.getByText('4 gün üst üste').parentElement;

    expect(chip?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
