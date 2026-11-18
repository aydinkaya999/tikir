import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Chip } from './Chip/Chip';
import { LineChart } from './LineChart/LineChart';
import { ProgressBar } from './ProgressBar/ProgressBar';
import { StatCard } from './StatCard/StatCard';

describe('StatCard', () => {
  it('shows a number with its meaning', () => {
    render(<StatCard value="%94" label="doğruluk" />);

    expect(screen.getByText('%94')).toBeInTheDocument();
    expect(screen.getByText('doğruluk')).toBeInTheDocument();
  });

  it('carries extra content in the hero tone', () => {
    render(
      <StatCard
        tone="hero"
        value="71"
        label="doğru kelime / dk"
        extra={<Chip icon="chart">Geçen haftadan 4 fazla</Chip>}
      />,
    );

    expect(screen.getByText('Geçen haftadan 4 fazla')).toBeInTheDocument();
  });
});

const chartLabel =
  'Altı haftada doğru kelime sayısı 58’den 71’e çıktı; hedef 70, 3. sınıf ortalaması 90';
const weeks = ['1. hafta', '2. hafta', '3. hafta', '4. hafta', '5. hafta', '6. hafta'];

describe('LineChart', () => {
  it('is an image named by its text equivalent, drawn for phones and for wide screens', () => {
    render(
      <LineChart
        label={chartLabel}
        points={[58, 60, 63, 65, 67, 71]}
        labels={weeks}
        yTicks={[50, 60, 70, 80, 90]}
        target={{ value: 70, label: 'Hedef 70' }}
        average={{ value: 90, label: '3. sınıf ortalaması 90' }}
      />,
    );
    const charts = screen.getAllByRole('img', { name: chartLabel });

    expect(charts).toHaveLength(2);
    for (const chart of charts) {
      expect(chart.querySelectorAll('[data-point]')).toHaveLength(6);
      expect(chart.querySelector('[data-point="last"]')).not.toBeNull();
      expect(chart.querySelector('[data-line="average"]')).not.toBeNull();
      expect(chart.querySelector('[data-line="target"]')).not.toBeNull();
      expect(chart).toHaveTextContent('6. hafta');
    }
  });

  it('draws no class-average line for grades 1 and 2', () => {
    render(
      <LineChart
        label="Doğru kelime"
        points={[30, 34]}
        labels={['1. hafta', '2. hafta']}
        yTicks={[20, 30, 40]}
        target={{ value: 36, label: 'Hedef 36' }}
      />,
    );

    expect(document.querySelector('[data-line="average"]')).toBeNull();
  });

  it('places points on the design grid (V1: 58 sits at y 242.4 on the wide chart)', () => {
    render(
      <LineChart
        label={chartLabel}
        points={[58, 60, 63, 65, 67, 71]}
        labels={weeks}
        yTicks={[50, 60, 70, 80, 90]}
      />,
    );
    const wide = screen.getAllByRole('img', { name: chartLabel })[1];
    const first = wide?.querySelector('[data-point]');

    expect(Number(first?.getAttribute('cx'))).toBeCloseTo(38, 1);
    expect(Number(first?.getAttribute('cy'))).toBeCloseTo(242.4, 1);
  });
});

describe('ProgressBar', () => {
  it('reports the chapters done out of the total', () => {
    render(<ProgressBar label="Hikâyedeki ilerleme" value={3} max={12} />);
    const bar = screen.getByRole('progressbar', { name: 'Hikâyedeki ilerleme' });

    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '12');
    expect(bar.firstElementChild).toHaveStyle({ width: '25%' });
  });
});
