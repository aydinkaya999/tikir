import { describe, expect, it } from 'vitest';
import { devPaths, extraPaths, parentExtraPaths, screenPaths } from './routes';

describe('routes', () => {
  it('uses the paths of docs/ekranlar.md for every screen', () => {
    expect(screenPaths).toEqual({
      G1: '/',
      G2: '/seans/isinma',
      G3: '/seans/dinle',
      G4: '/seans/oku',
      G5: '/seans/kayit',
      G6: '/seans/kapanis',
      G7: '/seans/bitti',
      K1: '/kurulum/hesap',
      K2: '/kurulum/okuyucu',
      K3: '/kurulum/seviye',
      K4: '/kurulum/tanisma',
      U1: '/kitaplik',
      U2: '/veli/kitap',
      U3: '/kitaplik/kur',
      U4: '/kitaplik/:bookId/hazir',
      V1: '/veli',
      V2: '/veli/takilinan',
      V3: '/veli/olcum',
      V4: '/veli/yazi',
    });
  });

  it('adds the album and studio tabs and the developer pages', () => {
    expect(extraPaths).toEqual({ album: '/album', studio: '/studyo' });
    expect(devPaths).toEqual({ showcase: '/gelistirme/vitrin', audio: '/gelistirme/ses' });
  });

  it('adds the parent’s account page (docs/planlar/faz-4.md, karar 36)', () => {
    expect(parentExtraPaths).toEqual({ account: '/veli/hesap' });
  });
});
