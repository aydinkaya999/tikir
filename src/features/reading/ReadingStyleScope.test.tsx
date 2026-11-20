import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReadingStyleScope } from './ReadingStyleScope';

describe('ReadingStyleScope', () => {
  it('writes the child’s reading style on the text’s container', () => {
    render(
      <ReadingStyleScope
        style={{ font: 'school', sizeStep: 3, spacingStep: 2, trialEnabled: true }}
      >
        <p>Deniz sırt çantasını omzuna aldı.</p>
      </ReadingStyleScope>,
    );

    const scope = screen.getByText('Deniz sırt çantasını omzuna aldı.').parentElement;
    expect(scope).toHaveAttribute('data-reading-font', 'school');
    expect(scope).toHaveAttribute('data-reading-size', '3');
    expect(scope).toHaveAttribute('data-reading-spacing', '2');
  });
});
