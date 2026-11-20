// Renders the whole app at an address over a demo session store, in StrictMode, as the screens run
// in development (docs/planlar/faz-2b.md, "Her görevde geçerli kurallar").
import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { appRoutes } from '../app/router';
import { type TestDevicesOptions, testDevices } from './sessionDevices';
import { type DemoSessionOptions, demoSessionStore } from './sessionStore';

export async function renderApp(
  path: string,
  options: DemoSessionOptions & { devices?: TestDevicesOptions } = {},
) {
  const session = await demoSessionStore(options);
  const devices = testDevices(options.devices);
  const router = createMemoryRouter(appRoutes({ store: session.store, devices }), {
    initialEntries: [path],
  });
  render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
  return { ...session, devices, router };
}
