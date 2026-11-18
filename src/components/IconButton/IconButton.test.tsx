import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('takes its accessible name from the label and keeps the icon decorative', async () => {
    const onClick = vi.fn();
    render(<IconButton icon="pause" label="Duraklat" onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Duraklat' });

    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('becomes a named link when given a destination', () => {
    render(
      <MemoryRouter>
        <IconButton icon="x" label="Seanstan çık" to="/" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Seanstan çık' })).toHaveAttribute('href', '/');
  });
});
