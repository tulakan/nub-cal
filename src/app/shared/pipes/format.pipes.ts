import { Pipe, PipeTransform } from '@angular/core';

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];
const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

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

/** short -> "15 ต.ค. 2568", day -> "พ. 15 ต.ค." */
@Pipe({ name: 'thaiDate', standalone: true })
export class ThaiDatePipe implements PipeTransform {
  transform(
    value: Date | number | string | null | undefined,
    format: 'short' | 'day' = 'short'
  ): string {
    return formatThaiDate(value, format);
  }
}

export function formatThaiDate(
  value: Date | number | string | null | undefined,
  format: 'short' | 'day' = 'short'
): string {
  if (value == null || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  const month = THAI_MONTHS[d.getMonth()];
  if (format === 'day') {
    return `${THAI_DAYS[d.getDay()]} ${d.getDate()} ${month}`;
  }
  return `${d.getDate()} ${month} ${d.getFullYear() + 543}`;
}
