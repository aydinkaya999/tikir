// The fake microphone's input in Chromium (--use-file-for-fake-audio-capture): one second of a
// 440 Hz tone at 48 kHz, which Chromium loops. Written by the global setup before browsers start.
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { toInt16 } from '../../src/services/audio/pcm';
import { encodeWav } from '../../src/services/audio/wav';
import { sine } from '../../src/test/signal';

export const toneHz = 440;
export const toneFile = path.join(os.tmpdir(), 'tikir-e2e', 'tone-440hz-48k.wav');

export async function writeToneFile(): Promise<void> {
  await mkdir(path.dirname(toneFile), { recursive: true });
  const samples = toInt16(sine({ hz: toneHz, sampleRate: 48_000, seconds: 1, amplitude: 0.5 }));
  await writeFile(toneFile, Buffer.from(encodeWav(samples, 48_000)));
}
