export const money = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    value
  );

export const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

export const count = (value: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);

export const percentage = (value: number, fractionDigits = 1) => `${value.toFixed(fractionDigits)}%`;

export const shortDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
