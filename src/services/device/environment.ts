// Where the audio lab runs, for the device report (docs/dinleme-hatti.md, section 5). Browsers
// freeze the OS version in the user agent (Safari 26 says iOS 18.6, Chrome says Android 10 and
// macOS 10.15.7), so the OS is named without one; the tester writes the real version down.

export type ShellKind = 'browser' | 'ios-app' | 'android-app';

export interface EnvironmentInfo {
  userAgent: string;
  /** "Chrome 157", "Safari 26.0", "WKWebView", … or "unknown". */
  browser: string;
  /** "macOS", "iOS", "iPadOS", "Android", … or "unknown". */
  os: string;
  shell: ShellKind;
  /** Opened from the home screen (a web app) rather than a browser tab. */
  standalone: boolean;
  secureContext: boolean;
  origin: string;
}

export type PermissionReading = 'granted' | 'denied' | 'prompt' | 'unknown';

function browserName(userAgent: string): string {
  const webView = /; wv\).*Chrome\/(\d+)/.exec(userAgent);
  if (webView !== null) {
    return `Android WebView ${webView[1] ?? ''}`;
  }
  const firefox = /(?:Firefox|FxiOS)\/(\d+)/.exec(userAgent);
  if (firefox !== null) {
    return `Firefox ${firefox[1] ?? ''}`;
  }
  const chrome = /(?:HeadlessChrome|Chrome|CriOS)\/(\d+)/.exec(userAgent);
  if (chrome !== null) {
    return `Chrome ${chrome[1] ?? ''}`;
  }
  const safari = /Version\/(\d+(?:\.\d+)?).*Safari\//.exec(userAgent);
  if (safari !== null) {
    return `Safari ${safari[1] ?? ''}`;
  }
  // An app's WKWebView reports WebKit without Safari's Version/ and Safari/ tokens.
  return /AppleWebKit\//.test(userAgent) ? 'WKWebView' : 'unknown';
}

function osName(userAgent: string, maxTouchPoints: number): string {
  if (/iPhone|iPod/.test(userAgent)) {
    return 'iOS';
  }
  if (/iPad/.test(userAgent)) {
    return 'iPadOS';
  }
  if (/Android/.test(userAgent)) {
    return 'Android';
  }
  if (/Macintosh/.test(userAgent)) {
    // An iPad asking for the desktop site says Macintosh; Macs have no touch points.
    return maxTouchPoints > 1 ? 'iPadOS' : 'macOS';
  }
  if (/Windows/.test(userAgent)) {
    return 'Windows';
  }
  if (/CrOS/.test(userAgent)) {
    return 'ChromeOS';
  }
  return /Linux/.test(userAgent) ? 'Linux' : 'unknown';
}

export function describeUserAgent(
  userAgent: string,
  maxTouchPoints: number,
): { browser: string; os: string } {
  return { browser: browserName(userAgent), os: osName(userAgent, maxTouchPoints) };
}

function shellKind(): ShellKind {
  // Capacitor's bridge names the platform; if the CSP keeps the bridge out, the origin still
  // tells: iOS serves the app from capacitor://localhost, Android from https://localhost.
  const capacitor = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const platform = capacitor?.getPlatform?.();
  if (platform === 'ios' || location.protocol === 'capacitor:') {
    return 'ios-app';
  }
  if (
    platform === 'android' ||
    (location.origin === 'https://localhost' && /Android/.test(navigator.userAgent))
  ) {
    return 'android-app';
  }
  return 'browser';
}

export function readEnvironment(): EnvironmentInfo {
  const { browser, os } = describeUserAgent(navigator.userAgent, navigator.maxTouchPoints);
  const homeScreen = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return {
    userAgent: navigator.userAgent,
    browser,
    os,
    shell: shellKind(),
    standalone: homeScreen || matchMedia('(display-mode: standalone)').matches,
    secureContext: isSecureContext,
    origin: location.origin,
  };
}

/** The microphone permission without asking for it; 'unknown' where the browser cannot say. */
export async function readMicrophonePermission(): Promise<PermissionReading> {
  try {
    const status = await navigator.permissions.query({ name: 'microphone' });
    return status.state;
  } catch {
    return 'unknown';
  }
}
