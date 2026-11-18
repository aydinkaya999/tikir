import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { tilePatternImages } from '../illustrations';
import { BookCover } from './BookCover';

describe('BookCover', () => {
  it('is a single pattern tile in the library list', () => {
    const { container } = render(<BookCover patterns={[1]} />);

    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.textContent).toBe('');
  });

  it('is a card with two patterns and the title on the ready page', () => {
    const { container } = render(
      <BookCover variant="card" patterns={[2, 3]} title="Uzay İstasyonunda Gizemli Ses" />,
    );

    expect(screen.getByText('Uzay İstasyonunda Gizemli Ses')).toBeInTheDocument();
    expect(
      Array.from(container.querySelectorAll('img'), (image) => image.getAttribute('src')),
    ).toEqual([tilePatternImages[2], tilePatternImages[3]]);
  });
});
