import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox/Checkbox';
import { ChoicePills } from './ChoicePills/ChoicePills';
import { OptionCard } from './OptionCard/OptionCard';
import { SegmentedControl } from './SegmentedControl/SegmentedControl';
import { Switch } from './Switch/Switch';
import { TextArea } from './TextArea/TextArea';
import { TextField } from './TextField/TextField';

describe('Checkbox', () => {
  it('is a native checkbox that its label text toggles', async () => {
    const onChange = vi.fn();
    render(
      <Checkbox
        label="Haftalık özet e-postası almak istiyorum."
        checked={false}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByText('Haftalık özet e-postası almak istiyorum.'));

    expect(
      screen.getByRole('checkbox', { name: 'Haftalık özet e-postası almak istiyorum.' }),
    ).not.toBeChecked();
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('TextField', () => {
  it('is found by its label and reports typing', async () => {
    const onChange = vi.fn();
    render(<TextField label="E-posta" type="email" value="" onChange={onChange} />);
    const input = screen.getByLabelText('E-posta');

    await userEvent.type(input, 'a');

    expect(input).toHaveAttribute('type', 'email');
    expect(onChange).toHaveBeenCalledWith('a');
  });
});

describe('TextArea', () => {
  it('is found by its label and shows a hint beside it', () => {
    render(<TextArea label="Metin" hint="24 kelime" value="" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Metin').tagName).toBe('TEXTAREA');
    expect(screen.getByText('24 kelime')).toBeInTheDocument();
  });
});

function SwitchHarness() {
  const [checked, setChecked] = useState(false);
  return <Switch label="Ölçümlerde iki ayarı dene" checked={checked} onChange={setChecked} />;
}

describe('Switch', () => {
  it('turns on and off with a click and with the space key', async () => {
    render(<SwitchHarness />);
    const control = screen.getByRole('switch', { name: 'Ölçümlerde iki ayarı dene' });
    expect(control).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(control);
    expect(control).toHaveAttribute('aria-checked', 'true');

    await userEvent.keyboard(' ');
    expect(control).toHaveAttribute('aria-checked', 'false');
  });
});

const sizes = [
  { value: 'small', label: 'Küçük' },
  { value: 'medium', label: 'Orta' },
  { value: 'large', label: 'Büyük' },
  { value: 'largest', label: 'En büyük' },
] as const;
type Size = (typeof sizes)[number]['value'];

function SegmentedHarness({ onChange }: { onChange: (value: Size) => void }) {
  const [value, setValue] = useState<Size>('medium');
  return (
    <SegmentedControl
      label="Harf boyutu"
      name="harf-boyutu"
      options={sizes}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('SegmentedControl', () => {
  it('is a named radio group with the current value checked', () => {
    render(<SegmentedHarness onChange={vi.fn()} />);

    expect(screen.getByRole('radiogroup', { name: 'Harf boyutu' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByRole('radio', { name: 'Orta' })).toBeChecked();
  });

  it('changes by click and by arrow keys', async () => {
    const onChange = vi.fn();
    render(<SegmentedHarness onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: 'Büyük' }));
    expect(onChange).toHaveBeenLastCalledWith('large');

    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('largest');
    expect(screen.getByRole('radio', { name: 'En büyük' })).toBeChecked();
  });
});

describe('OptionCard', () => {
  it('reports its selection through aria-pressed', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <OptionCard label="Uzay istasyonu" icon="planet" selected={false} onSelect={onSelect} />,
    );
    const card = screen.getByRole('button', { name: 'Uzay istasyonu' });
    expect(card).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(card);
    expect(onSelect).toHaveBeenCalledOnce();

    rerender(<OptionCard label="Uzay istasyonu" icon="planet" selected onSelect={onSelect} />);
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('names the card by its label and describes it by its description (V4)', () => {
    render(
      <OptionCard
        layout="detail"
        label="Net harfler"
        description="I, l, ı ve i kolay ayrılır"
        media="I l ı i"
        selected
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', {
        name: 'Net harfler',
        description: 'I, l, ı ve i kolay ayrılır',
      }),
    ).toHaveTextContent('I, l, ı ve i kolay ayrılır');
  });
});

describe('TextField errors and hints', () => {
  it('ties its hint and its error to the field and marks it invalid', () => {
    render(
      <TextField
        label="Parola"
        type="password"
        value="kisa"
        onChange={() => undefined}
        hint="En az 8 karakter"
        error="Parola en az 8 karakter olmalı."
      />,
    );

    const field = screen.getByLabelText('Parola');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('En az 8 karakter Parola en az 8 karakter olmalı.');
  });

  it('is valid and undescribed without them, and takes a numeric keyboard', () => {
    render(<TextField label="Cevap" value="" onChange={() => undefined} inputMode="numeric" />);

    const field = screen.getByLabelText('Cevap');
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(field).not.toHaveAttribute('aria-describedby');
    expect(field).toHaveAttribute('inputmode', 'numeric');
  });
});

const grades = [
  { value: '1', label: '1. sınıf' },
  { value: '2', label: '2. sınıf' },
  { value: '3', label: '3. sınıf' },
  { value: '4', label: '4. sınıf' },
] as const;

const interests = ['Uzay', 'Hayvanlar', 'Futbol', 'Deniz'].map((label) => ({
  value: label,
  label,
}));

function SingleChoice() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <ChoicePills label="Sınıfı" options={grades} mode="single" value={value} onChange={setValue} />
  );
}

function ManyChoices() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <ChoicePills
      label="Nelerden hoşlanır?"
      options={interests}
      mode="multiple"
      max={3}
      value={value}
      onChange={setValue}
    />
  );
}

describe('ChoicePills', () => {
  it('is a radio group in the single mode, with one choice moved by the arrow keys', async () => {
    const user = userEvent.setup();
    render(<SingleChoice />);

    expect(screen.getByRole('radiogroup', { name: 'Sınıfı' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '2. sınıf' }));
    expect(screen.getByRole('radio', { name: '2. sınıf' })).toBeChecked();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: '3. sınıf' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '2. sınıf' })).not.toBeChecked();
  });

  it('presses up to three toggles in the multiple mode and lets one go again', async () => {
    const user = userEvent.setup();
    render(<ManyChoices />);

    expect(screen.getByRole('group', { name: 'Nelerden hoşlanır?' })).toBeInTheDocument();
    for (const name of ['Uzay', 'Hayvanlar', 'Futbol']) {
      await user.click(screen.getByRole('button', { name }));
    }
    const fourth = screen.getByRole('button', { name: 'Deniz' });
    expect(fourth).toHaveAttribute('aria-disabled', 'true');
    await user.click(fourth);
    expect(fourth).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Uzay' }));

    expect(screen.getByRole('button', { name: 'Uzay' })).toHaveAttribute('aria-pressed', 'false');
    expect(fourth).not.toHaveAttribute('aria-disabled');
  });
});
