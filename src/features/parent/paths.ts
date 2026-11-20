// The parent area's addresses (docs/ekranlar.md, "Rotalar"): src/app/routes.ts builds its route
// table from them, so features never import src/app.
export const parentPaths = {
  summary: '/veli',
  stuckWords: '/veli/takilinan',
  assessment: '/veli/olcum',
  readingStyle: '/veli/yazi',
  books: '/veli/kitap',
  /** The account page: consents, recordings, deleting the account (docs/planlar/faz-4.md, karar 36). */
  account: '/veli/hesap',
} as const;
