// Shared service types (docs/mimari.md, "Servisler").

/** Returned by every subscription; calling it stops the callbacks. */
export type Unsubscribe = () => void;
