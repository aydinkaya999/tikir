import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MicrophoneProblem } from './MicrophoneProblem';

describe('MicrophoneProblem', () => {
  it('says what happened and offers only a retry', async () => {
    const onRetry = vi.fn();
    render(<MicrophoneProblem kind="unavailable" onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Yeniden dene' }));

    expect(
      screen.getByText(
        'Mikrofonu bulamadım. Velinden bir mikrofon bağlamasını iste, sonra Yeniden dene’ye dokun.',
      ),
    ).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('offers the way out its caller gives once a retry did not help (P14)', async () => {
    const onChoose = vi.fn();
    render(
      <MicrophoneProblem
        kind="denied"
        onRetry={vi.fn()}
        afterRetry={{ label: 'Seviye tespitini atla', onChoose }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Seviye tespitini atla' }));

    expect(onChoose).toHaveBeenCalledTimes(1);
  });
});
