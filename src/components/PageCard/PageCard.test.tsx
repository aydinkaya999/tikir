import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageCard } from './PageCard';

describe('PageCard', () => {
  it('heads the page with the book title and the page counter', () => {
    render(
      <PageCard title="Kayıp Fenerin İzinde, 4. bölüm" counter="1 / 2">
        <p>Deniz sırt çantasını omzuna aldı.</p>
      </PageCard>,
    );

    expect(screen.getByText('Kayıp Fenerin İzinde, 4. bölüm')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('Deniz sırt çantasını omzuna aldı.')).toBeInTheDocument();
  });

  it('leaves the counter out when there is none', () => {
    render(<PageCard title="Kayıp Fenerin İzinde, 4. bölüm">metin</PageCard>);

    expect(screen.queryByText('1 / 2')).not.toBeInTheDocument();
  });
});
