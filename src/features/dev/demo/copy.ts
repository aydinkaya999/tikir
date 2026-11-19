// Copy for the showcase's demo profile section (docs/planlar/faz-2a.md, "Geliştirme sayfası
// metinleri"). Not product copy: developer pages stay out of src/i18n/tr.ts (docs/kararlar.md T17).
import type { DemoMode } from './loadDemoProfile';

export const copy = {
  heading: 'Demo profili',
  description: 'Depoyu temizler ve tasarımlardaki örnek kullanıcıyı (Deniz) kurar.',
  modes: {
    'cocuk-sabahi': 'Çocuk sabahı (G1–G7)',
    'veli-haftasonu': 'Veli hafta sonu (V1–V4)',
  } satisfies Record<DemoMode, string>,
  loading: 'Kuruluyor…',
  loaded: (label: string) => `Kuruldu: ${label}.`,
  counts: (sessions: number, stuckWords: number, assessments: number) =>
    `Depoda ${String(sessions)} seans, ${String(stuckWords)} kelime kartı, ${String(assessments)} ölçüm var.`,
  empty: 'Depo boş.',
  failed: (name: string, message: string) =>
    `Kurulamadı (${name}: ${message}). Sayfayı yenileyip yeniden dene.`,
};
