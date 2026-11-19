import { describe, expect, it } from 'vitest';
import { buildTrialReport } from './report';

describe('buildTrialReport', () => {
  it('stamps the report and rounds times and levels to one decimal', () => {
    const report = buildTrialReport(
      {
        environment: {
          userAgent: 'UA',
          browser: 'Safari 26.0',
          os: 'iOS',
          shell: 'browser',
          standalone: true,
          secureContext: true,
          origin: 'https://192.168.1.5:4443',
        },
        permission: 'granted',
        capture: {
          state: 'capturing',
          requested: { echoCancellation: true, noiseSuppression: false, autoGainControl: true },
          applied: { echoCancellation: true, sampleRate: 48_000, latency: 0.01 },
          deviceLabel: 'iPhone Mikrofonu',
          inputSampleRate: 48_000,
          framesDelivered: 512,
          framesDropped: 2,
          framesSilent: 0,
          failure: null,
        },
        recording: { seconds: 10, frames: 500, levelDbfs: -23.456 },
        echo: {
          url: 'wss://192.168.1.5:4443/gelistirme/yanki',
          outcome: 'completed',
          sent: 500,
          received: 499,
          lost: 1,
          medianMs: 21.2345,
          p95Ms: 48.96,
          minMs: 9.01,
          maxMs: 120.44,
        },
      },
      new Date(Date.UTC(2026, 10, 19, 13, 32, 5)),
    );

    expect(report).toEqual({
      version: 1,
      createdAt: '2026-11-19T13:32:05.000Z',
      environment: {
        userAgent: 'UA',
        browser: 'Safari 26.0',
        os: 'iOS',
        shell: 'browser',
        standalone: true,
        secureContext: true,
        origin: 'https://192.168.1.5:4443',
      },
      permission: 'granted',
      capture: {
        state: 'capturing',
        requested: { echoCancellation: true, noiseSuppression: false, autoGainControl: true },
        applied: { echoCancellation: true, sampleRate: 48_000, latency: 0.01 },
        deviceLabel: 'iPhone Mikrofonu',
        inputSampleRate: 48_000,
        framesDelivered: 512,
        framesDropped: 2,
        framesSilent: 0,
        failure: null,
      },
      recording: { seconds: 10, frames: 500, levelDbfs: -23.5 },
      echo: {
        url: 'wss://192.168.1.5:4443/gelistirme/yanki',
        outcome: 'completed',
        sent: 500,
        received: 499,
        lost: 1,
        medianMs: 21.2,
        p95Ms: 49,
        minMs: 9,
        maxMs: 120.4,
      },
    });
  });

  it('keeps empty parts empty and a silent take readable as JSON', () => {
    const report = buildTrialReport(
      {
        environment: {
          userAgent: 'UA',
          browser: 'unknown',
          os: 'unknown',
          shell: 'browser',
          standalone: false,
          secureContext: false,
          origin: 'http://192.168.1.5:5173',
        },
        permission: 'unknown',
        capture: {
          state: 'unavailable',
          requested: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          applied: null,
          deviceLabel: null,
          inputSampleRate: null,
          framesDelivered: 0,
          framesDropped: 0,
          framesSilent: 0,
          failure: { name: 'MediaDevicesMissing', message: '…' },
        },
        recording: { seconds: 0.2, frames: 10, levelDbfs: Number.NEGATIVE_INFINITY },
        echo: null,
      },
      new Date(Date.UTC(2026, 10, 19, 13, 32, 5)),
    );

    expect(report.echo).toBeNull();
    // Silence has no level in decibels; JSON has no infinity, so the report says null.
    expect(report.recording?.levelDbfs).toBeNull();
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  });
});
