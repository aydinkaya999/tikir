// The weekly measurement walked as a child does (docs/planlar/faz-4.md, kararlar 28–35): the demo
// morning's last measurement was six days ago, so it opens the next day.
import { expect, type Page } from '@playwright/test';
import { heading } from './onboarding';
import {
  dayMs,
  openPaused,
  reloadPaused,
  runUntilVisible,
  sessionDay,
  storedRecords,
  waitForListening,
} from './session';

const trialSwitch = 'Ölçümlerde iki ayarı dene';

/** V4: the trial switched off, kept in the store. */
export async function switchTrialOff(page: Page): Promise<void> {
  await openPaused(page, '/veli/yazi?demo=cocuk-sabahi&kapi=acik');
  const toggle = page.getByRole('switch', { name: trialSwitch });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect
    .poll(async () => {
      const [child] = await storedRecords<{ readingStyle: { trialEnabled: boolean } }>(
        page,
        'child',
      );
      return child?.readingStyle.trialEnabled;
    })
    .toBe(false);
}

/** The next day's road, where the measurement card waits. */
export async function openTomorrow(page: Page): Promise<void> {
  await page.clock.setSystemTime(new Date(sessionDay.getTime() + dayMs));
  await reloadPaused(page);
  await expect(heading(page, 'Merhaba Deniz')).toBeVisible();
}

/** One minute: the microphone listens, the clock runs until the given sign shows. */
export async function readUntil(page: Page, sign: Parameters<typeof runUntilVisible>[1]) {
  await waitForListening(page);
  await runUntilVisible(page, sign, { limitMs: 90_000 });
}
