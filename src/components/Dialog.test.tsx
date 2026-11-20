import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button/Button';
import { Dialog } from './Dialog/Dialog';

function WithDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Aç
      </Button>
      <Dialog
        open={open}
        title="Ses verisi nasıl kullanılır?"
        onClose={() => {
          setOpen(false);
        }}
        actions={
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Kapat
          </Button>
        }
      >
        <p>Kayıtlar bu cihazda kalır.</p>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('opens as a modal named by its title and closes from its action', async () => {
    const user = userEvent.setup();
    render(<WithDialog />);

    await user.click(screen.getByRole('button', { name: 'Aç' }));

    const dialog = screen.getByRole('dialog', { name: 'Ses verisi nasıl kullanılır?' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveTextContent('Kayıtlar bu cihazda kalır.');
    await user.click(screen.getByRole('button', { name: 'Kapat' }));
    expect(dialog).not.toHaveAttribute('open');
  });

  // Escape and the focus going back are the browser's (e2e/showcase.spec.ts); jsdom has no modal
  // dialog, so here only the wiring of the close event the browser fires.
  it('tells its owner when the browser closes it', async () => {
    const user = userEvent.setup();
    render(<WithDialog />);
    await user.click(screen.getByRole('button', { name: 'Aç' }));
    const dialog = screen.getByRole('dialog', { name: 'Ses verisi nasıl kullanılır?' });

    act(() => {
      dialog.removeAttribute('open');
      dialog.dispatchEvent(new Event('close'));
    });
    await user.click(screen.getByRole('button', { name: 'Aç' }));

    expect(dialog).toHaveAttribute('open');
  });
});
