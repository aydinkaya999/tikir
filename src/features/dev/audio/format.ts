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

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

/** ses-denemesi-YYYYMMDD-HHMMSS.<extension>, in local time, for downloaded takes and reports. */
export function trialFileName(createdAt: Date, extension: 'json' | 'wav'): string {
  const date = `${String(createdAt.getFullYear())}${twoDigits(createdAt.getMonth() + 1)}${twoDigits(createdAt.getDate())}`;
  const time = `${twoDigits(createdAt.getHours())}${twoDigits(createdAt.getMinutes())}${twoDigits(createdAt.getSeconds())}`;
  return `ses-denemesi-${date}-${time}.${extension}`;
}
