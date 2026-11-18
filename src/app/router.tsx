import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { BookFromTextPage, LibraryPage } from '../features/library/pages';
import {
  AssessmentPage,
  ReadingStylePage,
  StuckWordsPage,
  WeeklySummaryPage,
} from '../features/parent/pages';
import { AlbumPage, RoadPage, StudioPage } from '../features/session/pages';
import { devPaths, extraPaths, screenPaths } from './routes';
import { ChildShell } from './shells/ChildShell';
import { ParentShell } from './shells/ParentShell';

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
          lazy: async () => ({
            Component: (await import('../features/dev/AudioLabPage')).AudioLabPage,
          }),
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
