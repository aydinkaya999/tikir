// Which implementation each service uses (docs/mimari.md, "Servisler"). In phase 1 only the
// developer audio lab uses services; its route imports this module lazily, so none of it reaches
// the production build.
import type { AudioLabServices } from '../features/dev/audio/AudioLabPage';
import { browserCaptureEnvironment } from '../services/audio/browserCaptureEnvironment';
import { WebAudioCapture } from '../services/audio/WebAudioCapture';

export const audioLabServices: AudioLabServices = {
  createCapture: (settings) => new WebAudioCapture(settings, browserCaptureEnvironment()),
};
