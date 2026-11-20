import { describe, expect, it, vi } from 'vitest';
import { BrowserShareService } from './ShareService';

const content = { title: 'Deniz için ölçüm sonucu', text: 'Deniz, 3. sınıf\n71 doğru kelime' };

describe('BrowserShareService', () => {
  it('opens the device’s share sheet when there is one', async () => {
    const share = vi.fn(() => Promise.resolve());
    const service = new BrowserShareService({ share });

    expect(service.canShare()).toBe(true);
    expect(await service.share(content)).toBe('shared');
    expect(share).toHaveBeenCalledWith(content);
  });

  it('copies the title and the text when there is no share sheet', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    const service = new BrowserShareService({ clipboard: { writeText } });

    expect(service.canShare()).toBe(true);
    expect(await service.share(content)).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(
      'Deniz için ölçüm sonucu\nDeniz, 3. sınıf\n71 doğru kelime',
    );
  });

  it('reports a share sheet the parent closed as cancelled', async () => {
    const share = vi.fn(() => Promise.reject(new DOMException('Closed', 'AbortError')));

    expect(await new BrowserShareService({ share }).share(content)).toBe('cancelled');
  });

  it('passes on any other failure', async () => {
    const share = vi.fn(() => Promise.reject(new DOMException('No gesture', 'NotAllowedError')));

    await expect(new BrowserShareService({ share }).share(content)).rejects.toThrow('No gesture');
  });

  it('cannot share without a share sheet or a clipboard', async () => {
    const service = new BrowserShareService({});

    expect(service.canShare()).toBe(false);
    await expect(service.share(content)).rejects.toThrow('Sharing is not available');
  });
});
