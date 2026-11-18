// Domain types (docs/mimari.md, "Tipler"). The names are binding; fields grow phase by phase.

export type Grade = 1 | 2 | 3 | 4;

/** Phrase units; joined, they make the sentence. */
export type Sentence = string[];

export type Page = Sentence[];
