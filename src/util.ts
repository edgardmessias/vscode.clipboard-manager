export interface IDisposable {
  dispose(): void;
}

export function toDisposable(dispose: () => void): IDisposable {
  return { dispose };
}

export function leftPad(
  value: string | number,
  size: number,
  char: string = " "
) {
  const chars = char.repeat(size);

  const paddedNumber = `${chars}${value}`.substr(-chars.length);

  return paddedNumber;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
