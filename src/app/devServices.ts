// The audio lab's services (docs/mimari.md, "Ses denemesinin öteki servisleri"). Only the lazily
// loaded developer route imports this module, so the lab never reaches the production build.
import type { AudioLabServices } from '../features/dev/audio/AudioLabPage';
import { browserCaptureEnvironment } from '../services/audio/browserCaptureEnvironment';
import { WebAudioWavPlayer } from '../services/audio/WavPlayer';
import { WebAudioCapture } from '../services/audio/WebAudioCapture';
import { readEnvironment, readMicrophonePermission } from '../services/device/environment';
import { pageWebSocketUrl, WebSocketEchoProbe } from '../services/echo/WebSocketEchoProbe';
import { saveFile } from '../services/files';
import { devEndpoints } from './routes';

export const audioLabServices: AudioLabServices = {
  createCapture: (settings) => new WebAudioCapture(settings, browserCaptureEnvironment()),
  player: new WebAudioWavPlayer(),
  saveFile,
  createEchoProbe: () => new WebSocketEchoProbe(),
  defaultEchoUrl: () => pageWebSocketUrl(devEndpoints.echo),
  readEnvironment,
  readMicrophonePermission,
};
