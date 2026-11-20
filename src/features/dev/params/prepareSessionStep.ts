// &adim=<adım> (docs/planlar/faz-2b.md, karar 21): brings today's session to a step through the
// store's own actions, so the data is what a child would leave: warmup cards read correctly,
// readings simulated from the scenario, questions answered correctly. The session counts as
// started twelve minutes ago (G7's "12 dakika").
import { chapterTokens } from '../../../domain/text';
import type { Chapter, Id, ReadingOutcome } from '../../../domain/types';
import { scenarioSets, type ScenarioName } from '../../../services/listener/scenarios';
import { simulateReading, toWordResults } from '../../../services/listener/simulateReading';
import type { FakeScenario } from '../../../services/listener/types';
import type { RecordingStore } from '../../../services/recorder/RecordingStore';
import { placeOf, type SessionPlace } from '../../session/sessionMachine';
import { createSessionStore, type SessionStoreServices } from '../../session/sessionStore';
import { type DevStep, devSteps } from './devParams';
import { storeSyntheticRecording } from './syntheticRecording';
import { sessionListens } from '../../session/views';

const sessionLengthMs = 12 * 60_000;
/** More than enough actions for any step: three cards, listen, three readings, two questions. */
const actionLimit = 40;

function devStepOf(place: SessionPlace): DevStep {
  switch (place.step) {
    case 'read':
      return place.redo ? 'read-3' : (`read-${String(place.attempt)}` as DevStep);
    default:
      return place.step;
  }
}

function simulatedOutcome(chapter: Chapter, scenario: FakeScenario): ReadingOutcome {
  const simulation = simulateReading(
    chapterTokens(chapter).map((token) => token.spoken),
    scenario,
  );
  const outcome: ReadingOutcome = { words: toWordResults(simulation), seconds: simulation.seconds };
  if (simulation.prosodyScore !== undefined) {
    outcome.prosodyScore = simulation.prosodyScore;
  }
  return outcome;
}

export async function prepareSessionStep(
  services: SessionStoreServices,
  step: DevStep | null,
  scenario: ScenarioName,
  recordings: RecordingStore,
  bookId?: Id,
): Promise<void> {
  let offsetMs = -sessionLengthMs;
  const now = () => new Date(services.now().getTime() + offsetMs);
  const store = createSessionStore({ ...services, now });
  const state = () => store.getState();

  await state().load();
  if (state().status !== 'ready') {
    throw new Error(`Today's session cannot be prepared: the store is ${state().status}.`);
  }
  if (state().data?.session === null) {
    if (bookId === undefined) {
      await state().start();
    } else {
      // &kitap=: the day is read from a library book (docs/kararlar.md P18).
      await state().startWithBook(bookId);
      if (state().data?.session === null) {
        throw new Error(`There is no book ${bookId} in the library to read today.`);
      }
    }
  } else if (bookId !== undefined && state().data?.session?.chapterRef.bookId !== bookId) {
    console.warn(`Today's session already reads another book; ${bookId} waits for tomorrow.`);
  }
  if (step === null) {
    return;
  }
  const target = devSteps.indexOf(step);
  for (let action = 0; action < actionLimit; action += 1) {
    const data = state().data;
    const session = data?.session ?? null;
    const chapter = data?.chapter ?? null;
    if (session === null || chapter === null) {
      throw new Error('There is no session to prepare today.');
    }
    // Without the parent's consent, or after P14's choice, the steps go unheard (P13, P14).
    const heard = data === null ? false : sessionListens(data);
    const place = placeOf(session);
    const here = devSteps.indexOf(devStepOf(place));
    if (here >= target) {
      if (here > target) {
        console.warn(`Today's session is already past ${step}; it stays at ${devStepOf(place)}.`);
      }
      return;
    }
    switch (place.step) {
      case 'warmup':
        await (place.secondAttempt || !heard
          ? state().nextWarmupCard()
          : state().answerWarmupCard(true));
        break;
      case 'listen':
        await state().finishListening();
        break;
      case 'read': {
        if (!heard) {
          await state().skipUnheardReading();
          break;
        }
        const reading = scenarioSets[scenario].readings[place.attempt - 1];
        if (reading === undefined) {
          throw new Error(`The ${scenario} scenario has no reading ${String(place.attempt)}.`);
        }
        const startedAt = now().toISOString();
        const recordingId =
          place.attempt === 3 ? await storeSyntheticRecording(recordings, startedAt) : null;
        await state().saveReading(simulatedOutcome(chapter, reading), { startedAt, recordingId });
        break;
      }
      case 'record':
        await state().finishRecording();
        break;
      case 'wrapUp': {
        const question = chapter.questions[place.question];
        if (question === undefined) {
          offsetMs = 0;
          await state().finishSession();
        } else {
          await state().answerQuestion(question.correctIndex);
        }
        break;
      }
      case 'done':
        return;
    }
  }
  throw new Error(`Today's session did not reach ${step}.`);
}
