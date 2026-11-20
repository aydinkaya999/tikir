import { afterEach, describe, expect, it, vi } from 'vitest';
import { readDevParams } from './devParams';

describe('readDevParams', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the demo, the step and the scenario and leaves the other parameters', () => {
    expect(readDevParams('?demo=cocuk-sabahi&adim=read-2&senaryo=design&x=1')).toEqual({
      params: { demo: 'cocuk-sabahi', step: 'read-2', scenario: 'design' },
      rest: '?x=1',
    });
  });

  it('turns the consent off and takes the manual listener', () => {
    expect(readDevParams('?onay=kapali&senaryo=elle')).toEqual({
      params: { consentOff: true, scenario: 'elle' },
      rest: '',
    });
  });

  it('opens the parent gate for the tab', () => {
    expect(readDevParams('?kapi=acik&demo=veli-haftasonu')).toEqual({
      params: { gateOpen: true, demo: 'veli-haftasonu' },
      rest: '',
    });
  });

  it('drops an unknown value with a warning, and the parameter with it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(readDevParams('?adim=uc&demo=yok')).toEqual({ params: {}, rest: '' });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('reads an empty store and the setup steps', () => {
    expect(readDevParams('?demo=bos')).toEqual({ params: { demo: 'bos' }, rest: '' });
    expect(readDevParams('?kurulum=seviye&x=1')).toEqual({
      params: { setup: 'seviye' },
      rest: '?x=1',
    });
    expect(readDevParams('?kurulum=tanisma&onay=kapali')).toEqual({
      params: { setup: 'tanisma', consentOff: true },
      rest: '',
    });
  });

  it('drops an unknown setup step with a warning', () => {
    expect(readDevParams('?kurulum=bitti')).toEqual({ params: {}, rest: '' });
  });

  it('reads nothing from an address without them', () => {
    expect(readDevParams('')).toEqual({ params: {}, rest: '' });
    expect(readDevParams('?x=1')).toEqual({ params: {}, rest: '?x=1' });
  });
});
