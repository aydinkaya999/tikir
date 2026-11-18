import { describe, expect, it } from 'vitest';
import { describeUserAgent } from './environment';

describe('describeUserAgent', () => {
  it.each([
    [
      'desktop Chrome',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36',
      0,
      { browser: 'Chrome 157', os: 'macOS' },
    ],
    [
      'headless Chrome (Playwright)',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/146.0.7680.31 Safari/537.36',
      0,
      { browser: 'Chrome 146', os: 'macOS' },
    ],
    [
      'iPhone Safari (the OS version is frozen in the string)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
      5,
      { browser: 'Safari 26.0', os: 'iOS' },
    ],
    [
      'Android Chrome (reduced user agent)',
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36',
      5,
      { browser: 'Chrome 157', os: 'Android' },
    ],
    [
      'an iPad asking for the desktop site',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
      5,
      { browser: 'Safari 26.0', os: 'iPadOS' },
    ],
    [
      'desktop Safari',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
      0,
      { browser: 'Safari 26.0', os: 'macOS' },
    ],
    [
      'the iOS app shell (WKWebView: no Version/ and no Safari)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      5,
      { browser: 'WKWebView', os: 'iOS' },
    ],
    [
      'the Android app shell (WebView)',
      'Mozilla/5.0 (Linux; Android 10; K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/157.0.0.0 Mobile Safari/537.36',
      5,
      { browser: 'Android WebView 157', os: 'Android' },
    ],
    ['something else', 'curl/8.7.1', 0, { browser: 'unknown', os: 'unknown' }],
  ])('names %s', (_case, userAgent, touchPoints, expected) => {
    expect(describeUserAgent(userAgent, touchPoints)).toEqual(expected);
  });
});
