// Sharing a short text the parent chooses to send (V3's "Öğretmenle paylaş"; docs/kararlar.md T23):
// the device's share sheet, else the clipboard. Only text leaves, and only from the parent's tap.

export interface ShareContent {
  title: string;
  text: string;
}

/** 'cancelled': the parent closed the share sheet without sharing. */
export type ShareResult = 'shared' | 'copied' | 'cancelled';

export interface ShareService {
  /** Whether sharing can be offered at all: a share sheet or a clipboard. */
  canShare(): boolean;
  /** Call from the tap: the share sheet needs the parent's gesture. Rejects when sharing fails. */
  share(content: ShareContent): Promise<ShareResult>;
}

/** The parts of the browser's navigator that sharing uses; each may be missing. */
export interface ShareNavigator {
  share?: (data: ShareContent) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
}

export class BrowserShareService implements ShareService {
  private readonly navigator: ShareNavigator;

  /** The browser's own navigator unless a test gives one. */
  constructor(navigator: ShareNavigator = globalThis.navigator) {
    this.navigator = navigator;
  }

  canShare(): boolean {
    return (
      typeof this.navigator.share === 'function' ||
      typeof this.navigator.clipboard?.writeText === 'function'
    );
  }

  async share(content: ShareContent): Promise<ShareResult> {
    const { share, clipboard } = this.navigator;
    if (typeof share === 'function') {
      try {
        await share.call(this.navigator, { title: content.title, text: content.text });
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return 'cancelled';
        }
        throw error;
      }
    }
    if (typeof clipboard?.writeText === 'function') {
      await clipboard.writeText(`${content.title}\n${content.text}`);
      return 'copied';
    }
    throw new Error('Sharing is not available on this device.');
  }
}
