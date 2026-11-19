import { describe, expect, it } from 'vitest';
import { encodeWav, parseWav } from './wav';

function ascii(view: DataView, offset: number): string {
  return String.fromCharCode(...[0, 1, 2, 3].map((step) => view.getUint8(offset + step)));
}

const samples = Int16Array.from({ length: 160 }, (_, index) => index * 100 - 8000);

describe('encodeWav', () => {
  it('writes a 44-byte PCM header for mono 16-bit audio, then the samples', () => {
    const buffer = encodeWav(samples, 16000);
    const view = new DataView(buffer);

    expect(buffer.byteLength).toBe(44 + 320);
    expect(ascii(view, 0)).toBe('RIFF');
    expect(view.getUint32(4, true)).toBe(36 + 320);
    expect(ascii(view, 8)).toBe('WAVE');
    expect(ascii(view, 12)).toBe('fmt ');
    expect(view.getUint32(16, true)).toBe(16);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint32(28, true)).toBe(32000);
    expect(view.getUint16(32, true)).toBe(2);
    expect(view.getUint16(34, true)).toBe(16);
    expect(ascii(view, 36)).toBe('data');
    expect(view.getUint32(40, true)).toBe(320);
  });

  it('stores samples little-endian', () => {
    const buffer = encodeWav(samples, 16000);

    // -8000 is 0xE0C0 in two's complement.
    expect(Array.from(new Uint8Array(buffer, 44, 2))).toEqual([0xc0, 0xe0]);
    expect(new DataView(buffer).getInt16(44 + 2 * 159, true)).toBe(159 * 100 - 8000);
  });
});

describe('parseWav', () => {
  it('reads back what encodeWav wrote', () => {
    const wav = parseWav(encodeWav(samples, 16000));

    expect(wav.sampleRate).toBe(16000);
    expect(wav.channels).toBe(1);
    expect(wav.bitsPerSample).toBe(16);
    expect(Array.from(wav.samples)).toEqual(Array.from(samples));
  });

  it('skips chunks it does not need', () => {
    const plain = new Uint8Array(encodeWav(samples, 16000));
    const list = new Uint8Array([0x4c, 0x49, 0x53, 0x54, 4, 0, 0, 0, 1, 2, 3, 4]); // "LIST", 4 bytes
    const withList = new Uint8Array(plain.length + list.length);
    withList.set(plain.subarray(0, 36));
    withList.set(list, 36);
    withList.set(plain.subarray(36), 36 + list.length);

    expect(Array.from(parseWav(withList.buffer).samples)).toEqual(Array.from(samples));
  });

  it('rejects a buffer that is not RIFF/WAVE', () => {
    expect(() =>
      parseWav(new TextEncoder().encode('not a wave file at all, sorry').buffer),
    ).toThrow(/RIFF\/WAVE/);
  });

  it('rejects audio that is not 16-bit PCM', () => {
    const float = encodeWav(samples, 16000);
    new DataView(float).setUint16(20, 3, true);
    const eightBit = encodeWav(samples, 16000);
    new DataView(eightBit).setUint16(34, 8, true);

    expect(() => parseWav(float)).toThrow(/16-bit PCM/);
    expect(() => parseWav(eightBit)).toThrow(/16-bit PCM/);
  });
});
