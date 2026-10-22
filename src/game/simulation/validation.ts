export function nonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative number`);
  }
}

export function positiveFinite(value: number, name: string): void {
  nonNegativeFinite(value, name);
  if (value === 0) throw new RangeError(`${name} must be greater than zero`);
}
