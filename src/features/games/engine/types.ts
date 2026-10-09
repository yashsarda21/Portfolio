export type Quality = "perfect" | "good" | "miss";
/** A random number in [0, 1). Injected so tests can force a win or a loss (spec §8 luck roll). */
export type Luck = () => number;
export type Winner = "yash" | "you";
/** Which layout the visitor sees: the 1440×900 stage, or the one-thumb column (phones and tablets). */
export type GameLayout = "stage" | "column";
