import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { IndexedDbRepository } from '../../../services/repository/IndexedDbRepository';
import { RepositoryUnavailableError } from '../../../services/repository/Repository';
import { DemoProfileSection } from './DemoProfileSection';

const today = () => '2026-11-19';

describe('DemoProfileSection', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it('shows what the repository holds and loads a mode', async () => {
    const user = userEvent.setup();
    render(<DemoProfileSection repository={() => IndexedDbRepository.open()} today={today} />);

    expect(await screen.findByText('Depo boş.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Çocuk sabahı (G1–G7)' }));

    expect(await screen.findByText('Kuruldu: Çocuk sabahı (G1–G7).')).toBeInTheDocument();
    expect(screen.getByText('Depoda 4 seans, 4 kelime kartı, 6 ölçüm var.')).toBeInTheDocument();
  });

  it('says it is loading while it loads', async () => {
    const user = userEvent.setup();
    let open: (value: IndexedDbRepository) => void = () => undefined;
    const pending = new Promise<IndexedDbRepository>((resolve) => {
      open = resolve;
    });
    let calls = 0;
    const repository = () => {
      calls += 1;
      return calls === 1 ? IndexedDbRepository.open() : pending;
    };
    render(<DemoProfileSection repository={repository} today={today} />);
    await screen.findByText('Depo boş.');

    await user.click(screen.getByRole('button', { name: 'Veli hafta sonu (V1–V4)' }));

    expect(screen.getByRole('status')).toHaveTextContent('Kuruluyor…');
    expect(screen.getByRole('button', { name: 'Çocuk sabahı (G1–G7)' })).toBeDisabled();
    open(await IndexedDbRepository.open());
    expect(
      await screen.findByText('Depoda 5 seans, 4 kelime kartı, 8 ölçüm var.'),
    ).toBeInTheDocument();
  });

  it('explains a repository that cannot open', async () => {
    const user = userEvent.setup();
    const repository = () =>
      Promise.reject(new RepositoryUnavailableError('IndexedDB is not available in this browser.'));
    const expected =
      'Kurulamadı (RepositoryUnavailableError: IndexedDB is not available in this browser.). Sayfayı yenileyip yeniden dene.';
    render(<DemoProfileSection repository={repository} today={today} />);

    expect(await screen.findByText(expected)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Çocuk sabahı (G1–G7)' }));
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });
});
