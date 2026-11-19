import { describe, expect, it } from 'vitest';
import { seededRandom } from '../../test/signal';
import { Framer } from './framer';

describe('Framer', () => {
  it('cuts input of any chunking into whole 320-sample frames, in order', () => {
    const input = Int16Array.from({ length: 10_000 }, (_, index) => index);
    const random = seededRandom(11);
    const framer = new Framer(320);
    const frames: Int16Array[] = [];

    for (let offset = 0; offset < input.length;) {
      const size = Math.floor(random() * 1001); // 0–1000, empty chunks included
      frames.push(...framer.push(input.subarray(offset, offset + size)));
      offset += size;
    }

    expect(frames).toHaveLength(31);
    expect(frames.every((frame) => frame.length === 320)).toBe(true);
    expect(frames.flatMap((frame) => Array.from(frame))).toEqual(
      Array.from(input.subarray(0, 31 * 320)),
    );
    expect(framer.pending).toBe(80);
  });

  it('copies what it keeps, so the caller may reuse or transfer its buffer', () => {
    const framer = new Framer(320);
    const first = Int16Array.from({ length: 400 }, (_, index) => index + 1);

    const [frame] = framer.push(first);
    first.fill(-1);
    const [next] = framer.push(new Int16Array(240).fill(7));

    expect(frame?.[0]).toBe(1);
    expect(frame?.[319]).toBe(320);
    // The 80 samples left over from the first chunk were kept before it was overwritten.
    expect(Array.from(next?.subarray(0, 80) ?? [])).toEqual(
      Array.from({ length: 80 }, (_, index) => 321 + index),
    );
    expect(next?.[80]).toBe(7);
  });
});
