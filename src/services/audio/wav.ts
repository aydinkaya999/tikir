// WAV files for 16 kHz mono PCM (docs/dinleme-hatti.md, section 5: record and play back).

export interface WavData {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  samples: Int16Array;
}

const headerBytes = 44;

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function readAscii(view: DataView, offset: number): string {
  let text = '';
  for (let index = 0; index < 4; index += 1) {
    text += String.fromCharCode(view.getUint8(offset + index));
  }
  return text;
}

/** A RIFF/WAVE file: 44-byte header, PCM, one channel, 16-bit little-endian samples. */
export function encodeWav(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(headerBytes + dataBytes);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, headerBytes - 8 + dataBytes, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // bytes per second
  view.setUint16(32, 2, true); // bytes per sample frame
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataBytes, true);
  samples.forEach((sample, index) => {
    view.setInt16(headerBytes + index * 2, sample, true);
  });
  return buffer;
}

interface FormatChunk {
  audioFormat: number;
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
}

/** Reads a 16-bit PCM WAV file; walks the chunks, so extra ones (LIST, …) are skipped. */
export function parseWav(buffer: ArrayBuffer): WavData {
  const view = new DataView(buffer);
  if (buffer.byteLength < 12 || readAscii(view, 0) !== 'RIFF' || readAscii(view, 8) !== 'WAVE') {
    throw new Error('Not a RIFF/WAVE file');
  }

  let format: FormatChunk | null = null;
  let data: { offset: number; length: number } | null = null;
  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const id = readAscii(view, offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'fmt ' && body + 16 <= buffer.byteLength) {
      format = {
        audioFormat: view.getUint16(body, true),
        channels: view.getUint16(body + 2, true),
        sampleRate: view.getUint32(body + 4, true),
        bitsPerSample: view.getUint16(body + 14, true),
      };
    } else if (id === 'data') {
      data = { offset: body, length: Math.min(size, buffer.byteLength - body) };
    }
    // Chunks are word-aligned: an odd-sized chunk carries one padding byte.
    offset = body + size + (size % 2);
  }

  if (format === null || data === null) {
    throw new Error('Not a RIFF/WAVE file: the fmt or data chunk is missing');
  }
  if (format.audioFormat !== 1 || format.bitsPerSample !== 16) {
    throw new Error('Only 16-bit PCM is supported');
  }

  const samples = new Int16Array(Math.floor(data.length / 2));
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = view.getInt16(data.offset + index * 2, true);
  }
  return {
    sampleRate: format.sampleRate,
    channels: format.channels,
    bitsPerSample: format.bitsPerSample,
    samples,
  };
}
