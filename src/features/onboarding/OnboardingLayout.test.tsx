import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '../../components/Button/Button';
import { OnboardingLayout } from './OnboardingLayout';

describe('OnboardingLayout', () => {
  it('draws the step’s progress, Tıkır’s words, the content and the action', () => {
    render(
      <OnboardingLayout
        step={2}
        companion={{ bubble: 'Sevdiği konuları seçin, hikâyeleri ona göre kurarım.' }}
        title="Okuyucuyu tanıyalım"
        lead="Metinleri seviyesine ve ilgisine göre seçmek için."
        action={<Button>Devam et</Button>}
      >
        <p>Alanlar</p>
      </OnboardingLayout>,
    );

    const progress = screen.getByRole('list', { name: 'Kurulum adımı 2 / 4' });
    expect(within(progress).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
    expect(
      screen.getByText('Sevdiği konuları seçin, hikâyeleri ona göre kurarım.'),
    ).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(main).toContainElement(
      screen.getByRole('heading', { level: 1, name: 'Okuyucuyu tanıyalım' }),
    );
    expect(main).toContainElement(
      screen.getByText('Metinleri seviyesine ve ilgisine göre seçmek için.'),
    );
    expect(main).toContainElement(screen.getByText('Alanlar'));
    expect(screen.getByRole('button', { name: 'Devam et' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Tıkır' })).toBeInTheDocument();
  });
});
