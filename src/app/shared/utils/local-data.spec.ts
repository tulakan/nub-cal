import { clearLocalUserData } from './local-data';

function fakeStorage(init: Record<string, string>): Storage {
  const map = new Map(Object.entries(init));
  return {
    get length() {
      return map.size;
    },
    key: i => [...map.keys()][i] ?? null,
    getItem: k => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: k => void map.delete(k),
    clear: () => map.clear(),
  };
}

describe('clearLocalUserData', () => {
  it("removes only that account's logs and plans", () => {
    const s = fakeStorage({
      'log:abc:2026-11-25': '[]',
      'plan:abc:2026-11-25': '[]',
      'log:other:2026-11-25': '[]',
      theme: 'x',
    });
    clearLocalUserData('abc', s);
    expect(s.length).toBe(2);
    expect(s.getItem('log:other:2026-11-25')).toBe('[]');
  });
});
