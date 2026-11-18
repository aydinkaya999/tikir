import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox/Checkbox';
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

  it('shows a description in the detailed layout', () => {
    render(
      <OptionCard
        layout="detail"
        label="Net harfler"
        description="I, l, ı ve i kolay ayrılır"
        selected
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Net harfler/ })).toHaveTextContent(
      'I, l, ı ve i kolay ayrılır',
    );
  });
});
