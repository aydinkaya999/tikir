// A stand-in third-reading recording for &adim=record and later steps (docs/planlar/faz-2b.md,
// karar 21): 52 seconds of a pulsing tone, the length the G5 design shows. Test data, not a voice.
import type { Id } from '../../../domain/types';
import { captureFormat } from '../../../services/audio/captureChain';
import { encodeWav } from '../../../services/audio/wav';
import { createId } from '../../../services/id';
import { recordingLimits, waveformLevels } from '../../../services/recorder/PcmRecorder';
import type { RecordingStore } from '../../../services/recorder/RecordingStore';

export const syntheticRecordingSeconds = 52;

const toneHz = 220;
const full = 32767;

function syntheticSamples(): Int16Array {
  const rate = captureFormat.sampleRate;
  const samples = new Int16Array(syntheticRecordingSeconds * rate);
  for (let index = 0; index < samples.length; index += 1) {
    const time = index / rate;
    // Syllable-like pulses, slowly swelling and fading, so the bars differ like a voice's.
    const pulse = Math.abs(Math.sin((Math.PI * time) / 0.45));
    const swell = 0.6 + 0.4 * Math.sin((2 * Math.PI * time) / 7.3);
    const envelope = 0.1 + 0.5 * pulse * swell;
    samples[index] = Math.round(envelope * 0.5 * full * Math.sin(2 * Math.PI * toneHz * time));
  }
  return samples;
}

export async function storeSyntheticRecording(
  recordings: RecordingStore,
  createdAt: string,
): Promise<Id> {
  const samples = syntheticSamples();
  const id = createId();
  await recordings.put({
    id,
    createdAt,
    seconds: syntheticRecordingSeconds,
    levels: waveformLevels(samples, recordingLimits.levelBars),
    wav: encodeWav(samples, captureFormat.sampleRate),
  });
  return id;
}
