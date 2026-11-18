// Developer pages (/gelistirme/*) and, from phase 2 on, the demo URL parameters exist in
// development and in the `e2e` build, never in the production build (docs/ekranlar.md).
export const devToolsEnabled: boolean = import.meta.env.MODE !== 'production';
