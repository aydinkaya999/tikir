// Every product address and every setup address passes the setup (docs/planlar/faz-3.md, karar 4):
// nothing is decided while the store loads; then the setup still ahead opens, or the road once the
// setup is done. The developer pages are outside it.
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../session/sessionContext';
import { StatusScreen } from '../session/StatusScreen';
import { setupRedirect } from './paths';

export function SetupGuard() {
  const { pathname } = useLocation();
  const status = useSession((state) => state.status);
  const setup = useSession((state) => state.setup);
  const load = useSession((state) => state.load);

  useEffect(() => {
    if (status === 'idle') {
      void load();
    }
  }, [status, load]);

  if (status === 'idle' || status === 'loading') {
    return <StatusScreen kind="loading" as="main" />;
  }
  if (status === 'error') {
    return <StatusScreen kind="error" as="main" />;
  }
  const target = setupRedirect(status === 'setup' ? setup : null, pathname);
  return target === null ? <Outlet /> : <Navigate to={target} replace />;
}
