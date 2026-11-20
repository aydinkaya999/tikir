import { describe, expect, it, vi } from 'vitest';
import { onKeyDown } from './keyboard';

describe('onKeyDown', () => {
  it('reports the key and whether the focus is on a control, until unsubscribed', () => {
    const presses: { key: string; onControl: boolean }[] = [];
    const stop = onKeyDown(({ key, onControl }) => {
      presses.push({ key, onControl });
    });
    const button = document.createElement('button');
    document.body.append(button);

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true }));
    stop();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true }));

    expect(presses).toEqual([
      { key: ' ', onControl: false },
      { key: 'e', onControl: true },
    ]);
    button.remove();
  });

  it('lets the caller keep the browser from acting on the key', () => {
    const stop = onKeyDown((press) => {
      press.preventDefault();
    });
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    const prevent = vi.spyOn(event, 'preventDefault');

    document.body.dispatchEvent(event);
    stop();

    expect(prevent).toHaveBeenCalled();
  });
});
