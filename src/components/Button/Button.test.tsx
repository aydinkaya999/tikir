import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('is a native button named by its label that does not submit forms', () => {
    render(<Button icon="play">Başla</Button>);
    const button = screen.getByRole('button', { name: 'Başla' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('becomes a link when given a destination', () => {
    render(
      <MemoryRouter>
        <Button to="/seans/isinma">Başla</Button>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Başla' })).toHaveAttribute('href', '/seans/isinma');
  });

  it('ignores presses while disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Kitabımı yap
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Kitabımı yap' });

    await userEvent.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
