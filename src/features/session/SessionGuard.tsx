// The session steps open in order (docs/ekranlar.md, "Yönlendirme kuralları"; docs/planlar/
// faz-2b.md, karar 4): every session address shows the current step.
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from './sessionContext';
import { sessionRedirect } from './sessionMachine';
import { StatusScreen } from './StatusScreen';

export function SessionGuard() {
  const { pathname } = useLocation();
  const status = useSession((state) => state.status);
  const session = useSession((state) => state.data?.session ?? null);
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
  const target = sessionRedirect(session, pathname);
  return target === null ? <Outlet /> : <Navigate to={target} replace />;
}
