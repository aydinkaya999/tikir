import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MicButton } from './MicButton';

const labels = {
  listening: 'Dinliyor. Duraklatmak için dokun',
  paused: 'Duraklatıldı. Sürdürmek için dokun',
  denied: 'Mikrofon izni yok',
};

describe('MicButton', () => {
  it('says its state in its name (docs/tasarim-sistemi.md, "Erişilebilirlik")', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<MicButton state="listening" labels={labels} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Dinliyor. Duraklatmak için dokun' }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(<MicButton state="paused" labels={labels} onClick={onClick} />);
    expect(
      screen.getByRole('button', { name: 'Duraklatıldı. Sürdürmek için dokun' }),
    ).toBeInTheDocument();

    rerender(<MicButton state="denied" labels={labels} onClick={onClick} />);
    expect(screen.getByRole('button', { name: 'Mikrofon izni yok' })).toBeInTheDocument();
  });

  it('keeps the microphone drawing decorative', () => {
    render(<MicButton state="listening" labels={labels} />);

    expect(screen.getByRole('button').querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
