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
  ParentAccountPage,
} from '../features/onboarding/pages';
import {
  AssessmentPage,
  ReadingStylePage,
  StuckWordsPage,
  WeeklySummaryPage,
} from '../features/parent/pages';
import {
  AlbumPage,
  DonePage,
  ListenPage,
  ReadPage,
  RecordPage,
  RoadPage,
  StudioPage,
  WarmupPage,
  WrapUpPage,
} from '../features/session/pages';
import { tr } from '../i18n/tr';
import { devPaths, extraPaths, screenPaths } from './routes';
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
          lazy: async () => ({
            Component: (await import('../features/dev/showcase/ShowcasePage')).ShowcasePage,
          }),
        },
        {
          path: devPaths.audio,
          // The page gets its services from here, so features never import src/app.
          lazy: async () => {
            const [{ AudioLabPage }, { audioLabServices }] = await Promise.all([
              import('../features/dev/audio/AudioLabPage'),
              import('./services'),
            ]);
            return { element: <AudioLabPage services={audioLabServices} /> };
          },
        },
      ]
    : [];

export const appRoutes: RouteObject[] = [
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
      { path: screenPaths.G2, element: <WarmupPage /> },
      { path: screenPaths.G3, element: <ListenPage /> },
      { path: screenPaths.G4, element: <ReadPage /> },
      { path: screenPaths.G5, element: <RecordPage /> },
      { path: screenPaths.G6, element: <WrapUpPage /> },
      { path: screenPaths.G7, element: <DonePage /> },
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
      { path: screenPaths.K1, element: <ParentAccountPage /> },
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
  ...devRoutes,
  // No design or copy exists for "not found"; unknown addresses go to the road.
  { path: '*', element: <Navigate to={screenPaths.G1} replace /> },
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
