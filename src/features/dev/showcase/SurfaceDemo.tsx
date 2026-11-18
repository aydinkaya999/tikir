import { Card } from '../../../components/Card/Card';
import { Chip } from '../../../components/Chip/Chip';
import { PageCard } from '../../../components/PageCard/PageCard';
import { SpeechBubble } from '../../../components/SpeechBubble/SpeechBubble';
import { Row, Section } from './Section';
import { samplePageCount, samplePageText } from './seedSamples';
import styles from './Showcase.module.css';

// Sample copy comes from the design files named next to each row.
export function ChipDemo() {
  return (
    <Section name="Chip">
      <Row label="tone: saffron G1 · saffronLight G4 · white G4 · turquoiseLight G4 · white V1">
        <Chip tone="saffron" icon="flame">
          4 gün üst üste
        </Chip>
        <Chip tone="saffronLight">2. okuma / 3</Chip>
        <Chip>Süre 0:19</Chip>
        <Chip tone="turquoiseLight">Doğru 13</Chip>
        <Chip icon="user">Deniz, 3. sınıf</Chip>
      </Row>
    </Section>
  );
}

export function CardDemo() {
  return (
    <Section name="Card">
      <div className={styles.grid}>
        <Card>
          <p className={styles.sample}>white · K4</p>
        </Card>
        <Card lifted>
          <p className={styles.sample}>white lifted · U1</p>
        </Card>
        <Card tone="cobaltLight">
          <p className={styles.sample}>
            cobaltLight · K1: Kayıtlar yalnızca okumayı değerlendirmek için kullanılır.
          </p>
        </Card>
        <Card tone="turquoiseLight">
          <p className={styles.sample}>turquoiseLight · U4</p>
        </Card>
      </div>
    </Section>
  );
}

export function PageCardDemo() {
  return (
    <Section name="PageCard">
      <Row label="title + counter · G4 (text: seed, chapter 4 page 1)">
        <PageCard
          className={styles.wide}
          title="Kayıp Fenerin İzinde, 4. bölüm"
          counter={`1 / ${String(samplePageCount)}`}
        >
          <p className={styles.sample}>{samplePageText}</p>
        </PageCard>
      </Row>
    </Section>
  );
}

export function SpeechBubbleDemo() {
  return (
    <Section name="SpeechBubble">
      <Row label="arrow=left · G1">
        <SpeechBubble>Bugün dar bir patikaya tırmanıyoruz. Hazırsan başlayalım.</SpeechBubble>
      </Row>
      <Row label="arrow=top · K1">
        <SpeechBubble arrow="top">Merhaba! Çocuğunuz okurken ben dinlerim.</SpeechBubble>
      </Row>
      <Row label="live (aria-live=polite) · G4">
        <SpeechBubble live>Takıldın mı? Hecele: a-ğaç-la-rı-nın</SpeechBubble>
      </Row>
    </Section>
  );
}
