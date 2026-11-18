import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { EmptyPage } from './EmptyPage';
import { devPaths, screenPaths } from './routes';

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
  { path: screenPaths.G1, element: <EmptyPage /> },
  ...devRoutes,
  // No design or copy exists for "not found"; unknown addresses go to the road.
  { path: '*', element: <Navigate to={screenPaths.G1} replace /> },
];

export function createAppRouter() {
  return createBrowserRouter(appRoutes);
}
