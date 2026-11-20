import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import {
  BookFromCardsPage,
  BookFromTextPage,
  BookReadyPage,
  LibraryPage,
} from '../features/library/pages';
import {
  ChildProfilePage,
  LevelAssessmentPage,
  MeetCompanionPage,
} from '../features/onboarding/pages';
import { AccountPage } from '../features/onboarding/AccountPage';
import {
  AssessmentPage,
  ReadingStylePage,
  StuckWordsPage,
  WeeklySummaryPage,
} from '../features/parent/pages';
import { AlbumPage } from '../features/session/AlbumPage';
import { DonePage } from '../features/session/DonePage';
import type { StoreApi } from 'zustand/vanilla';
import { SetupGuard } from '../features/onboarding/SetupGuard';
import { ListenPage } from '../features/session/ListenPage';
import { ReadPage } from '../features/session/ReadPage';
import { RecordPage } from '../features/session/RecordPage';
import { RoadPage } from '../features/session/RoadPage';
import { StudioPage } from '../features/session/StudioPage';
import { WrapUpPage } from '../features/session/WrapUpPage';
import { SessionGuard } from '../features/session/SessionGuard';
import { WarmupPage } from '../features/session/WarmupPage';
import type { SessionDevices } from '../features/session/sessionContext';
import { SessionRoot } from '../features/session/SessionRoot';
import { createSessionStore, type SessionState } from '../features/session/sessionStore';
import { localDateOf } from '../domain/date';
import { tr } from '../i18n/tr';
import { devPaths, extraPaths, screenPaths } from './routes';
import { appRepository, sessionDevices, sessionStoreServices } from './services';
import { ChildShell } from './shells/ChildShell';
import { FocusShell } from './shells/FocusShell';
import { OnboardingShell } from './shells/OnboardingShell';
import { ParentShell } from './shells/ParentShell';
import { SessionShell } from './shells/SessionShell';

// Developer pages are lazy chunks that must not reach the production build. Dev-only code tests
// import.meta.env.MODE inline: Vite replaces it in each module at build time, so the bundler can
// drop the dynamic imports. A flag imported from another module is not folded and leaves orphan
// chunks in dist/ (checked in phase 0).
const devRoutes: RouteObject[] =
  import.meta.env.MODE !== 'production'
    ? [
        {
          path: devPaths.showcase,
          lazy: async () => {
            const { ShowcasePage } = await import('../features/dev/showcase/ShowcasePage');
            return {
              element: (
                <ShowcasePage repository={appRepository} today={() => localDateOf(new Date())} />
              ),
            };
          },
        },
        {
          path: devPaths.audio,
          // The page gets its services from here, so features never import src/app.
          lazy: async () => {
            const [{ AudioLabPage }, { audioLabServices }] = await Promise.all([
              import('../features/dev/audio/AudioLabPage'),
              import('./devServices'),
            ]);
            return { element: <AudioLabPage services={audioLabServices} /> };
          },
        },
      ]
    : [];

/** The session's store and devices, created once per page by createAppRouter. */
export interface AppSession {
  store: StoreApi<SessionState>;
  devices: SessionDevices;
}

export function appRoutes(session: AppSession): RouteObject[] {
  return [
    {
      // Every product route: the session's store and devices, and the microphone rule.
      element: <SessionRoot store={session.store} devices={session.devices} />,
      children: [
        {
          // Nothing opens before the setup is done (docs/planlar/faz-3.md, karar 4).
          element: <SetupGuard />,
          children: [
            {
              element: <ChildShell />,
              children: [
                { path: screenPaths.G1, element: <RoadPage /> },
                { path: screenPaths.U1, element: <LibraryPage /> },
                { path: extraPaths.album, element: <AlbumPage /> },
                { path: extraPaths.studio, element: <StudioPage /> },
              ],
            },
            {
              element: <SessionShell />,
              children: [
                {
                  // The steps open in order (docs/ekranlar.md, "Yönlendirme kuralları").
                  element: <SessionGuard />,
                  children: [
                    { path: screenPaths.G2, element: <WarmupPage /> },
                    { path: screenPaths.G3, element: <ListenPage /> },
                    { path: screenPaths.G4, element: <ReadPage /> },
                    { path: screenPaths.G5, element: <RecordPage /> },
                    { path: screenPaths.G6, element: <WrapUpPage /> },
                    { path: screenPaths.G7, element: <DonePage /> },
                  ],
                },
              ],
            },
            {
              element: (
                <FocusShell
                  title={tr.focus.bookFromCards.title}
                  subtitle={tr.focus.bookFromCards.subtitle}
                  backTo={screenPaths.U1}
                />
              ),
              children: [{ path: screenPaths.U3, element: <BookFromCardsPage /> }],
            },
            {
              element: (
                <FocusShell
                  title={tr.focus.bookReady.title}
                  subtitle={tr.focus.bookReady.subtitle}
                  backTo={screenPaths.U3}
                />
              ),
              children: [{ path: screenPaths.U4, element: <BookReadyPage /> }],
            },
            {
              element: <OnboardingShell />,
              children: [
                { path: screenPaths.K1, element: <AccountPage /> },
                { path: screenPaths.K2, element: <ChildProfilePage /> },
                { path: screenPaths.K3, element: <LevelAssessmentPage /> },
                { path: screenPaths.K4, element: <MeetCompanionPage /> },
              ],
            },
            {
              element: <ParentShell />,
              children: [
                { path: screenPaths.V1, element: <WeeklySummaryPage /> },
                { path: screenPaths.V2, element: <StuckWordsPage /> },
                { path: screenPaths.V3, element: <AssessmentPage /> },
                { path: screenPaths.V4, element: <ReadingStylePage /> },
                { path: screenPaths.U2, element: <BookFromTextPage /> },
              ],
            },
          ],
        },
      ],
    },
    ...devRoutes,
    // No design or copy exists for "not found"; unknown addresses go to the road.
    { path: '*', element: <Navigate to={screenPaths.G1} replace /> },
  ];
}

export function createAppRouter() {
  return createBrowserRouter(
    appRoutes({ store: createSessionStore(sessionStoreServices()), devices: sessionDevices() }),
  );
}
