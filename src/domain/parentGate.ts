// The parent gate's question (docs/kararlar.md P11; docs/planlar/faz-3.md, karar 25): two two-digit
// numbers whose ones carry and whose sum stays under 100, so a young reader cannot guess through.

export interface GateQuestion {
  a: number;
  b: number;
}

function pick(random: () => number, from: number, count: number): number {
  return from + Math.floor(random() * count);
}

export function gateQuestion(random: () => number): GateQuestion {
  const onesA = pick(random, 1, 9);
  const onesB = pick(random, 10 - onesA, onesA);
  const tensA = pick(random, 1, 7);
  const tensB = pick(random, 1, 8 - tensA);
  return { a: tensA * 10 + onesA, b: tensB * 10 + onesB };
}

/** The answer as typed: digits only, spaces around it allowed. */
export function isGateAnswer(question: GateQuestion, answer: string): boolean {
  const typed = answer.trim();
  return /^[0-9]+$/.test(typed) && Number(typed) === question.a + question.b;
}
