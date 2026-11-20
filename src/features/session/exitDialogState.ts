// Whether the session shell's exit dialog is open: the screens pause narration and reading while
// it is (docs/planlar/faz-2b.md, karar 9).
import { createContext, useContext } from 'react';

export const ExitDialogContext = createContext(false);

export function useExitDialogOpen(): boolean {
  return useContext(ExitDialogContext);
}
