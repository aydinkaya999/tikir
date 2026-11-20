import { useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { Checkbox } from '../../../components/Checkbox/Checkbox';
import { ChoicePills } from '../../../components/ChoicePills/ChoicePills';
import { Dialog } from '../../../components/Dialog/Dialog';
import { Companion } from '../../../components/Companion/Companion';
import { OptionCard } from '../../../components/OptionCard/OptionCard';
import { SegmentedControl } from '../../../components/SegmentedControl/SegmentedControl';
import { Switch } from '../../../components/Switch/Switch';
import { TextArea } from '../../../components/TextArea/TextArea';
import { TextField } from '../../../components/TextField/TextField';
import { tokenize } from '../../../domain/text';
import sampleBooks from '../../../../seed/ornek-kitaplar.json';
import { Row, Section } from './Section';
import styles from './Showcase.module.css';

// Copy comes from the design files named in each row; the long text from seed/.
const parentBook = sampleBooks.books.find((book) => book.source === 'parentText');
const parentText = (parentBook?.chapters[0]?.pages[0] ?? [])
  .map((sentence) => sentence.replaceAll(' | ', ' '))
  .join(' ');

export function CheckboxDemo() {
  const [weekly, setWeekly] = useState(false);
  const [consent, setConsent] = useState(true);
  return (
    <Section name="Checkbox">
      <Row label="unchecked · checked · disabled (not drawn) — K1">
        <Checkbox
          label="Haftalık özet e-postası almak istiyorum."
          checked={weekly}
          onChange={setWeekly}
        />
        <Checkbox
          label="Çocuğumun ses kaydının okuma geri bildirimi için işlenmesine izin veriyorum."
          checked={consent}
          onChange={setConsent}
        />
        <Checkbox label="disabled" checked={false} onChange={setWeekly} disabled />
      </Row>
    </Section>
  );
}

export function TextFieldDemo() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <Section name="TextField">
      <div className={styles.grid}>
        <TextField
          label="E-posta"
          type="email"
          placeholder="ad@ornek.com"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <TextField
          label="Parola"
          type="password"
          placeholder="En az 8 karakter"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={
            password.length > 0 && password.length < 8
              ? 'Parola en az 8 karakter olmalı.'
              : undefined
          }
        />
        <TextField
          label="Cevap"
          inputMode="numeric"
          value=""
          onChange={() => undefined}
          hint="İpucu satırı"
          error="Hata satırı"
        />
      </div>
    </Section>
  );
}

const demoGrades = ['1. sınıf', '2. sınıf', '3. sınıf', '4. sınıf'].map((label) => ({
  value: label,
  label,
}));

const demoInterests = [
  'Uzay',
  'Hayvanlar',
  'Futbol',
  'Deniz',
  'Dinozorlar',
  'Robotlar',
  'Doğa',
  'Bilmece',
].map((label) => ({ value: label, label }));

export function ChoicePillsDemo() {
  const [grade, setGrade] = useState<string[]>(['3. sınıf']);
  const [interests, setInterests] = useState<string[]>(['Uzay', 'Futbol', 'Dinozorlar']);
  return (
    <Section name="ChoicePills">
      <div className={styles.grid}>
        <ChoicePills
          label="Sınıfı"
          options={demoGrades}
          mode="single"
          value={grade}
          onChange={setGrade}
        />
        <ChoicePills
          label="Nelerden hoşlanır?"
          options={demoInterests}
          mode="multiple"
          max={3}
          counter={`${String(interests.length)} / 3 seçildi`}
          value={interests}
          onChange={setInterests}
        />
      </div>
    </Section>
  );
}

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };
  return (
    <Section name="Dialog">
      <Button
        variant="secondary"
        onClick={() => {
          setOpen(true);
        }}
      >
        Pencereyi aç
      </Button>
      <Dialog
        open={open}
        title="Pencere başlığı"
        onClose={close}
        actions={<Button onClick={close}>Kapat</Button>}
      >
        <p>Pencerenin gövde metni.</p>
      </Dialog>
    </Section>
  );
}

export function TextAreaDemo() {
  const [text, setText] = useState(parentText);
  return (
    <Section name="TextArea">
      <TextArea
        label="Metin"
        hint={`${String(tokenize(text).length)} kelime`}
        value={text}
        onChange={setText}
      />
    </Section>
  );
}

export function SwitchDemo() {
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);
  return (
    <Section name="Switch">
      <Row label="checked · unchecked — V4, V4@kucuk-kapali">
        <Switch label="Ölçümlerde iki ayarı dene" checked={on} onChange={setOn} />
        <Switch label="Ölçümlerde iki ayarı dene" checked={off} onChange={setOff} />
      </Row>
    </Section>
  );
}

const sizeOptions = [
  { value: 'small', label: 'Küçük' },
  { value: 'medium', label: 'Orta' },
  { value: 'large', label: 'Büyük' },
  { value: 'largest', label: 'En büyük' },
] as const;
const spacingOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'open', label: 'Açık' },
  { value: 'wide', label: 'Daha açık' },
] as const;
const sourceOptions = [
  { value: 'text', label: 'Metin yapıştır', icon: 'paste' },
  { value: 'photo', label: 'Sayfa fotoğrafı', icon: 'camera' },
  { value: 'topic', label: 'Konu yaz', icon: 'pencil' },
] as const;

export function SegmentedControlDemo() {
  const [size, setSize] = useState<(typeof sizeOptions)[number]['value']>('medium');
  const [spacing, setSpacing] = useState<(typeof spacingOptions)[number]['value']>('normal');
  const [source, setSource] = useState<(typeof sourceOptions)[number]['value']>('text');
  return (
    <Section name="SegmentedControl">
      <div className={styles.grid}>
        <SegmentedControl
          label="Harf boyutu"
          name="showcase-size"
          options={sizeOptions}
          value={size}
          onChange={setSize}
        />
        <SegmentedControl
          label="Harf aralığı"
          name="showcase-spacing"
          options={spacingOptions}
          value={spacing}
          onChange={setSpacing}
        />
        <SegmentedControl
          label="icon (U2)"
          name="showcase-source"
          options={sourceOptions}
          value={source}
          onChange={setSource}
        />
      </div>
    </Section>
  );
}

const placeCards = [
  { value: 'forest', label: 'Orman', icon: 'tree' },
  { value: 'sea', label: 'Deniz altı', icon: 'wave' },
  { value: 'space', label: 'Uzay istasyonu', icon: 'planet' },
] as const;

export function OptionCardDemo() {
  const [place, setPlace] = useState<string>('space');
  const [hero, setHero] = useState(true);
  const [font, setFont] = useState<'clear' | 'school'>('clear');
  return (
    <Section name="OptionCard">
      <Row label="layout=tile, media and icons — U3">
        <div className={styles.optionRow}>
          <OptionCard
            label="Deniz ve Tıkır"
            media={<Companion size={60} />}
            selected={hero}
            onSelect={() => {
              setHero(!hero);
            }}
          />
          {placeCards.map((card) => (
            <OptionCard
              key={card.value}
              label={card.label}
              icon={card.icon}
              selected={place === card.value}
              onSelect={() => {
                setPlace(card.value);
              }}
            />
          ))}
        </div>
      </Row>
      <Row label="layout=detail — V4">
        <div className={styles.optionRow}>
          <OptionCard
            layout="detail"
            label="Net harfler"
            media="I l ı i"
            description="I, l, ı ve i kolay ayrılır"
            selected={font === 'clear'}
            onSelect={() => {
              setFont('clear');
            }}
          />
          <OptionCard
            layout="detail"
            label="Okul harfleri"
            media={<span className={styles.schoolSample}>a g</span>}
            description="a ve g defterdeki gibi"
            selected={font === 'school'}
            onSelect={() => {
              setFont('school');
            }}
          />
        </div>
      </Row>
    </Section>
  );
}
