// V1 Haftalık özet (docs/ekranlar.md, V1; docs/planlar/faz-4.md, kararlar 2 and 11–16): the week's
// numbers, the six measured weeks' chart with the goal line and the grade average, the session
// days, one sentence about the week and "Hedefi güncelle".
import { type ReactNode, useId, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { Chip } from '../../components/Chip/Chip';
import { Dialog } from '../../components/Dialog/Dialog';
import { Icon } from '../../components/Icon/Icon';
import { IconButton } from '../../components/IconButton/IconButton';
import { LineChart } from '../../components/LineChart/LineChart';
import { StatCard } from '../../components/StatCard/StatCard';
import { withGenitiveSuffix } from '../../domain/text';
import type { LocalDate } from '../../domain/types';
import { tr } from '../../i18n/tr';
import { useSession, useSessionStore } from '../session/sessionContext';
import { EmptyReport } from './EmptyReport';
import styles from './SummaryPage.module.css';
import { summaryView } from './views';

const copy = tr.report.summary;

/** The phone's short label beside the tablet's and the web's long one; CSS shows one. */
function sized(long: ReactNode, short: string) {
  return (
    <>
      <span className={styles.long}>{long}</span>
      <span className={styles.short}>{short}</span>
    </>
  );
}

export function SummaryPage() {
  const store = useSessionStore();
  const data = useSession((state) => state.data);
  const [week, setWeek] = useState<LocalDate | undefined>(undefined);
  const [offered, setOffered] = useState<number | null>(null);
  const chartTitleId = useId();
  const daysTitleId = useId();

  if (data === null) {
    // The setup guard loads the store before the parent area opens.
    return null;
  }
  const state = summaryView(data, week);
  if (state.kind === 'empty') {
    return (
      <EmptyReport title={copy.title(withGenitiveSuffix(data.child.name))} text={copy.empty} />
    );
  }
  const { view } = state;
  const missing = copy.missing;

  const confirmGoal = (target: number) => {
    setOffered(null);
    store
      .getState()
      .setGoal(target)
      .catch(() => undefined);
  };

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.titles}>
          <h1 className={styles.title}>{view.title}</h1>
          <p className={styles.range}>{view.range}</p>
        </div>
        <div className={styles.weeks}>
          <IconButton
            icon="left"
            label={copy.previousWeek}
            disabled={view.previousWeek === null}
            onClick={() => {
              setWeek(view.previousWeek ?? undefined);
            }}
          />
          <IconButton
            icon="right"
            label={copy.nextWeek}
            disabled={view.nextWeek === null}
            onClick={() => {
              setWeek(view.nextWeek ?? undefined);
            }}
          />
        </div>
      </div>

      <div className={styles.stats}>
        <StatCard
          tone="hero"
          className={styles.hero}
          value={view.wcpm === null ? missing : String(view.wcpm)}
          label={sized(
            <>
              {copy.wcpm.firstLine}
              <br />
              {copy.wcpm.secondLine}
            </>,
            copy.wcpm.short,
          )}
          extra={view.gain === null ? undefined : <Chip icon="chart">{copy.gain(view.gain)}</Chip>}
        />
        <div className={styles.small}>
          <StatCard
            className={styles.stat}
            value={
              view.accuracyPercent === null ? missing : copy.accuracy.value(view.accuracyPercent)
            }
            label={copy.accuracy.label}
          />
          <StatCard
            className={styles.stat}
            value={view.prosody === null ? missing : copy.prosody.value(view.prosody)}
            label={sized(copy.prosody.long, copy.prosody.short)}
          />
          <StatCard
            className={styles.stat}
            value={copy.sessionDays.value(view.sessionDayCount)}
            label={sized(copy.sessionDays.long, copy.sessionDays.short)}
          />
        </div>
        {/* TODO(design): the phone draws no day strip; the unheard days stay on the report (P14). */}
        {view.unheardDays !== null && (
          <p className={`${styles.unheard} ${styles.phoneOnly}`}>{view.unheardDays}</p>
        )}
      </div>

      <div className={styles.lower}>
        <section className={styles.chartCard} aria-labelledby={chartTitleId}>
          <h2 id={chartTitleId} className={styles.cardTitle}>
            {copy.chartTitle}
          </h2>
          {view.chart !== null && (
            <LineChart
              label={view.chart.label}
              points={view.chart.points}
              labels={view.chart.labels}
              yTicks={view.chart.yTicks}
              target={
                view.chart.target === null
                  ? undefined
                  : { value: view.chart.target, label: copy.target(view.chart.target) }
              }
              average={
                view.chart.average === null
                  ? undefined
                  : {
                      value: view.chart.average,
                      label: copy.average(data.child.grade, view.chart.average),
                    }
              }
            />
          )}
          <p className={`${styles.comment} ${styles.phoneOnly}`}>{view.comment}</p>
        </section>

        <div className={styles.side}>
          <div className={styles.days}>
            <h2 id={daysTitleId} className={styles.cardTitle}>
              {copy.daysTitle}
            </h2>
            <ol className={styles.strip} aria-label={view.daysLabel}>
              {view.days.map((day) => (
                <li key={day.label} className={styles.day} data-mark={day.mark}>
                  <span className={styles.box}>
                    {day.mark !== 'none' && <Icon name="check" size={16} />}
                  </span>
                  <span className={styles.dayLabel}>{day.label}</span>
                </li>
              ))}
            </ol>
            {view.unheardDays !== null && <p className={styles.unheard}>{view.unheardDays}</p>}
          </div>
          <hr className={styles.divider} />
          <p className={`${styles.comment} ${styles.sideComment}`}>{view.comment}</p>
          {view.goalUpdate !== null && (
            <Button
              variant="secondary"
              icon="target"
              fullWidth
              className={styles.update}
              onClick={() => {
                setOffered(view.goalUpdate);
              }}
            >
              {copy.updateGoal}
            </Button>
          )}
        </div>
      </div>

      {/* TODO(design): "Hedefi güncelle"'s dialog is not drawn (D17). */}
      <Dialog
        open={offered !== null}
        title={copy.goalDialog.title}
        onClose={() => {
          setOffered(null);
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setOffered(null);
              }}
            >
              {copy.goalDialog.cancel}
            </Button>
            <Button
              onClick={() => {
                if (offered !== null) {
                  confirmGoal(offered);
                }
              }}
            >
              {copy.goalDialog.confirm}
            </Button>
          </>
        }
      >
        <p className={styles.dialogText}>{offered === null ? '' : copy.goalDialog.body(offered)}</p>
      </Dialog>
    </div>
  );
}
