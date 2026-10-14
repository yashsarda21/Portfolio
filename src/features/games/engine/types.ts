export type Quality = "perfect" | "good" | "miss";
/** A random number in [0, 1). Injected so tests can force the serve's side and toss. */
export type Luck = () => number;
/** Which layout the visitor sees: the 1440×900 stage, or the one-thumb column (phones and tablets). */
export type GameLayout = "stage" | "column";
