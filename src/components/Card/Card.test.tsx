import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('renders its content inside a div by default', () => {
    render(<Card>Seans günleri</Card>);

    expect(screen.getByText('Seans günleri').tagName).toBe('DIV');
  });

  it('can be a section landmark', () => {
    render(
      <Card as="section" aria-label="Seans günleri">
        5 / 7
      </Card>,
    );

    expect(screen.getByRole('region', { name: 'Seans günleri' })).toHaveTextContent('5 / 7');
  });
});
