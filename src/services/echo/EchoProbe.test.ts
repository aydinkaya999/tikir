import { describe, expect, it } from 'vitest';
import { webSocketUrlFor } from './EchoProbe';

describe('webSocketUrlFor', () => {
  it('uses wss on an https page, so the browser does not block it as mixed content', () => {
    expect(webSocketUrlFor('https://192.168.1.5:4443/gelistirme/ses', '/gelistirme/yanki')).toBe(
      'wss://192.168.1.5:4443/gelistirme/yanki',
    );
  });

  it('uses ws on a plain http page, on the same host and port', () => {
    expect(webSocketUrlFor('http://localhost:4317/gelistirme/ses?x=1', '/gelistirme/yanki')).toBe(
      'ws://localhost:4317/gelistirme/yanki',
    );
  });
});
