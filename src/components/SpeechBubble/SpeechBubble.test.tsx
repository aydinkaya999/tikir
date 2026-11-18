import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SpeechBubble } from './SpeechBubble';

describe('SpeechBubble', () => {
  it('announces its text politely when live (Tıkır’s help, docs/tasarim-sistemi.md)', () => {
    render(<SpeechBubble live>Takıldın mı? Hecele: a-ğaç-la-rı-nın</SpeechBubble>);

    expect(
      screen.getByText('Takıldın mı? Hecele: a-ğaç-la-rı-nın').closest('[aria-live]'),
    ).toHaveAttribute('aria-live', 'polite');
  });

  it('is a plain bubble otherwise, with a decorative arrow', () => {
    const { container } = render(<SpeechBubble arrow="top">Merhaba!</SpeechBubble>);

    expect(container.querySelector('[aria-live]')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
