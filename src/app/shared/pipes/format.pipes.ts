import { Pipe, PipeTransform } from '@angular/core';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** 1240.4 -> "1,240" */
@Pipe({ name: 'kcal', standalone: true })
export class KcalPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return Math.round(value ?? 0).toLocaleString('en-US');
  }
}

/** grams: 0 decimals by default, pass 1 for detail views. 33.333 -> "33" / "33.3" */
@Pipe({ name: 'macro', standalone: true })
export class MacroPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 0): string {
    const v = value ?? 0;
    return v.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }
}

/** short -> "15 Oct 2026", day -> "Thu 15 Oct", axis -> "15 Oct" */
export function formatDate(
  value: Date | number | string | null | undefined,
  format: 'short' | 'day' | 'axis' = 'short'
): string {
  if (value == null || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  const dayMonth = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  if (format === 'day') return `${DAYS[d.getDay()]} ${dayMonth}`;
  if (format === 'axis') return dayMonth;
  return `${dayMonth} ${d.getFullYear()}`;
}
