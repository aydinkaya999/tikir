// Numbers on the audio lab page, written the Turkish way ("10,0").
import { rmsToDbfs } from '../../../services/audio/pcm';
import { copy } from './copy';

const meterFloorDbfs = -60;
const wholeNumber = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Position on the level meter: -60 dBFS and below is empty, full scale is full. */
export function meterValue(rms: number): number {
  const dbfs = rmsToDbfs(rms);
  return Math.min(1, Math.max(0, (dbfs - meterFloorDbfs) / -meterFloorDbfs));
}

export function formatDbfs(rms: number): string {
  return rms > 0 ? copy.mic.dbfs(wholeNumber.format(rmsToDbfs(rms))) : copy.mic.silence;
}

export function formatSeconds(seconds: number): string {
  return oneDecimal.format(seconds);
}

export function formatMs(ms: number): string {
  return oneDecimal.format(ms);
}
