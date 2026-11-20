// The page's address, for the developer parameters read and removed before the router starts
// (docs/planlar/faz-2b.md, karar 21).

export function currentAddress(): { pathname: string; search: string; hash: string } {
  return { pathname: location.pathname, search: location.search, hash: location.hash };
}

/** Replaces the address without a navigation or a history entry. */
export function replaceAddress(pathSearchHash: string): void {
  history.replaceState(history.state, '', pathSearchHash);
}
