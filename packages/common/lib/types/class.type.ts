/**
 * Type of classes that implemented I.
 */
export type Class<I, Args extends any[] = any[]> = new (...args: Args) => I;
