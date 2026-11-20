import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { FocusShell } from './FocusShell';

describe('FocusShell', () => {
  it('is only the frame: the page draws its own title and way back', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/kitaplik/kur']}>
        <Routes>
          <Route element={<FocusShell />}>
            <Route path="/kitaplik/kur" element={<p>Sayfa</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(container.querySelector('[data-shell="focus"]')).toContainElement(
      screen.getByText('Sayfa'),
    );
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
