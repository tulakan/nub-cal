import { KcalPipe, MacroPipe, formatDate } from './format.pipes';

describe('format', () => {
  const d = new Date(2026, 10, 25, 12);

  it('formats dates in the three styles', () => {
    expect(formatDate(d)).toBe('25 Nov 2026');
    expect(formatDate(d, 'day')).toBe('Wed 25 Nov');
    expect(formatDate(d.getTime(), 'axis')).toBe('25 Nov');
    expect(formatDate(null)).toBe('');
    expect(formatDate('nope')).toBe('');
  });

  it('rounds calories and grams', () => {
    expect(new KcalPipe().transform(1240.4)).toBe('1,240');
    expect(new MacroPipe().transform(33.333, 1)).toBe('33.3');
    expect(new MacroPipe().transform(undefined)).toBe('0');
  });
});
