import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Button } from '../../components/Button/Button';
import { FocusLayout } from './FocusLayout';

describe('FocusLayout', () => {
  it('draws the title, the way back, the content, the side column and the action', () => {
    render(
      <MemoryRouter>
        <FocusLayout
          title="Kitabını kur"
          subtitle="Her sıradan bir kart seç."
          backTo="/kitaplik"
          aside={<p>Tıkır’ın sözü</p>}
          action={<Button>Kitabımı yap</Button>}
        >
          <p>Kartlar</p>
        </FocusLayout>
      </MemoryRouter>,
    );

    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { level: 1, name: 'Kitabını kur' })).toBeVisible();
    expect(within(main).getByText('Her sıradan bir kart seç.')).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: 'Geri dön' })).toHaveAttribute(
      'href',
      '/kitaplik',
    );
    expect(main).toContainElement(screen.getByText('Kartlar'));
    expect(main).toContainElement(screen.getByText('Tıkır’ın sözü'));
    expect(main).toContainElement(screen.getByRole('button', { name: 'Kitabımı yap' }));
    // The web's top bar: the wordmark and a way to the library.
    expect(screen.getByRole('link', { name: 'Kitaplık' })).toHaveAttribute('href', '/kitaplik');
  });

  it('leaves out the side column and the action it is not given', () => {
    const { container } = render(
      <MemoryRouter>
        <FocusLayout title="Kitabın hazır" backTo="/kitaplik">
          <p>Kitap</p>
        </FocusLayout>
      </MemoryRouter>,
    );

    expect(container.querySelector('[data-focus="aside"]')).toBeNull();
    expect(container.querySelector('[data-focus="action"]')).toBeNull();
  });
});
