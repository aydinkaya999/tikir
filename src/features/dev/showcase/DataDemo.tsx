import { Chip } from '../../../components/Chip/Chip';
import { LineChart } from '../../../components/LineChart/LineChart';
import { ProgressBar } from '../../../components/ProgressBar/ProgressBar';
import { StatCard } from '../../../components/StatCard/StatCard';
import { Row, Section } from './Section';
import styles from './Showcase.module.css';

// Sample values and copy are the V1 and U1 design moments.
const weeks = ['1. hafta', '2. hafta', '3. hafta', '4. hafta', '5. hafta', '6. hafta'];

export function StatCardDemo() {
  return (
    <Section name="StatCard">
      <Row label="tone=hero (V1) · tone=plain (V1)">
        <StatCard
          tone="hero"
          value="71"
          label={
            <>
              doğru kelime
              <br />
              bir dakikada
            </>
          }
          extra={<Chip icon="chart">Geçen haftadan 4 fazla</Chip>}
        />
        <StatCard value="%94" label="doğruluk" />
        <StatCard value="3 / 4" label="tonlama puanı" />
        <StatCard value="5 / 7" label="gün seans" />
      </Row>
    </Section>
  );
}

export function LineChartDemo() {
  return (
    <Section name="LineChart">
      <Row label="target + average (3. sınıf, V1)">
        <LineChart
          className={styles.wide}
          label="Altı haftada doğru kelime sayısı 58’den 71’e çıktı; hedef 70, 3. sınıf ortalaması 90"
          points={[58, 60, 63, 65, 67, 71]}
          labels={weeks}
          yTicks={[50, 60, 70, 80, 90]}
          target={{ value: 70, label: 'Hedef 70' }}
          average={{ value: 90, label: '3. sınıf ortalaması 90' }}
        />
      </Row>
      <Row label="no average (1.–2. sınıf: the class-average line is not drawn)">
        <LineChart
          className={styles.wide}
          label="sample without average"
          points={[58, 60, 63, 65, 67, 71]}
          labels={weeks}
          yTicks={[50, 60, 70, 80, 90]}
          target={{ value: 70, label: 'Hedef 70' }}
        />
      </Row>
    </Section>
  );
}

export function ProgressBarDemo() {
  return (
    <Section name="ProgressBar">
      <Row label="value / max: 0 · 3 / 12 (U1) · 12 / 12">
        <div className={styles.wide}>
          <ProgressBar label="Hikâyedeki ilerleme" value={0} max={12} />
        </div>
        <div className={styles.wide}>
          <ProgressBar label="Hikâyedeki ilerleme" value={3} max={12} />
        </div>
        <div className={styles.wide}>
          <ProgressBar label="Hikâyedeki ilerleme" value={12} max={12} />
        </div>
      </Row>
    </Section>
  );
}
