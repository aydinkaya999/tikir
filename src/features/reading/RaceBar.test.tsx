import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RaceBar } from './RaceBar';

describe('RaceBar', () => {
  it('shows the child and yesterday’s ghost at their places (G4)', () => {
    const { container } = render(
      <RaceBar progress={0.4} ghost={0.33} youLabel="sen" ghostLabel="dün" />,
    );

    expect(screen.getByText('sen').parentElement).toHaveStyle({ left: '40%' });
    expect(screen.getByText('dün').parentElement).toHaveStyle({ left: '33%' });
    expect(container.querySelector('[data-part="fill"]')).toHaveStyle({ width: '40%' });
  });

  it('shows only the child on the first day, when there is no ghost', () => {
    render(<RaceBar progress={0.1} ghost={null} youLabel="sen" ghostLabel="dün" />);

    expect(screen.getByText('sen')).toBeInTheDocument();
    expect(screen.queryByText('dün')).toBeNull();
  });
});
