// The parent's account page (docs/planlar/faz-4.md, kararlar 5–7 and 36): the consents given on
// K1, changed here; every recording, to listen to or delete; and deleting the account with all
// that is stored. No design yet. TODO(design)
import { useId, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Dialog } from '../../components/Dialog/Dialog';
import { Switch } from '../../components/Switch/Switch';
import { tr } from '../../i18n/tr';
import { usePlayback } from '../session/playback';
import { useSession, useSessionDevices, useSessionStore } from '../session/sessionContext';
import styles from './AccountSettingsPage.module.css';
import { RecordingList } from './RecordingList';
import { useRecordings } from './useRecordings';
import { recordingRows } from './views';

const copy = tr.accountPage;
const consentCopy = tr.onboarding.account;

export function AccountSettingsPage() {
  const store = useSessionStore();
  const data = useSession((state) => state.data);
  const { recorder } = useSessionDevices();
  const { recordings, refresh } = useRecordings(recorder);
  const playback = usePlayback(recorder);
  const [confirming, setConfirming] = useState(false);
  const consentsId = useId();
  const removeId = useId();

  if (data === null) {
    // The setup guard loads the store before the parent area opens; after the account is deleted
    // it opens the setup.
    return null;
  }
  const { consent } = data.parent;

  const setConsent = (change: Partial<{ voiceProcessing: boolean; weeklyEmail: boolean }>) => {
    store
      .getState()
      .setConsent({
        voiceProcessing: consent.voiceProcessing,
        weeklyEmail: consent.weeklyEmail,
        ...change,
      })
      .catch(() => undefined);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{copy.title}</h1>

      <section className={styles.card} aria-labelledby={consentsId}>
        <h2 id={consentsId} className={styles.cardTitle}>
          {copy.consents}
        </h2>
        <Switch
          label={consentCopy.consent}
          checked={consent.voiceProcessing}
          onChange={(voiceProcessing) => {
            setConsent({ voiceProcessing });
          }}
        />
        <p className={styles.note}>{consentCopy.consentNote}</p>
        <Switch
          label={consentCopy.weeklyEmail}
          checked={consent.weeklyEmail}
          onChange={(weeklyEmail) => {
            setConsent({ weeklyEmail });
          }}
        />
      </section>

      {recordings !== null && (
        <RecordingList
          title={copy.recordings}
          rows={recordingRows(data, recordings)}
          empty={copy.noRecordings}
          onPlay={(id) => {
            playback.play(id);
          }}
          onRemove={(id) => {
            store
              .getState()
              .deleteRecording(id)
              .catch(() => undefined)
              .finally(refresh);
          }}
        />
      )}

      <section className={styles.card} aria-labelledby={removeId}>
        <h2 id={removeId} className={styles.cardTitle}>
          {copy.remove.title}
        </h2>
        <p className={styles.note}>{copy.remove.body}</p>
        <div>
          <Button
            variant="danger"
            onClick={() => {
              setConfirming(true);
            }}
          >
            {copy.remove.button}
          </Button>
        </div>
      </section>

      <Dialog
        open={confirming}
        title={copy.remove.dialog}
        onClose={() => {
          setConfirming(false);
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(false);
              }}
            >
              {copy.remove.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirming(false);
                playback.stop();
                store
                  .getState()
                  .deleteAccount()
                  .catch(() => undefined);
              }}
            >
              {copy.remove.confirm}
            </Button>
          </>
        }
      >
        <p className={styles.note}>{copy.remove.body}</p>
      </Dialog>
    </div>
  );
}
