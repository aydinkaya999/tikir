// Which implementation each service uses (docs/mimari.md, "Servisler"). In phase 1 only the
// developer audio lab uses services; its route imports this module lazily, so none of it reaches
// the production build.
import type { AudioLabServices } from '../features/dev/audio/AudioLabPage';
import { browserCaptureEnvironment } from '../services/audio/browserCaptureEnvironment';
import { type WavPlayer, WebAudioWavPlayer } from '../services/audio/WavPlayer';
import { WebAudioCapture } from '../services/audio/WebAudioCapture';
import { pageWebSocketUrl, WebSocketEchoProbe } from '../services/echo/WebSocketEchoProbe';
import { saveFile } from '../services/files';
import { devEndpoints } from './routes';

const player: WavPlayer = new WebAudioWavPlayer();

export const audioLabServices: AudioLabServices = {
  createCapture: (settings) => new WebAudioCapture(settings, browserCaptureEnvironment()),
  player,
  saveFile,
  createEchoProbe: () => new WebSocketEchoProbe(),
  defaultEchoUrl: () => pageWebSocketUrl(devEndpoints.echo),
};
