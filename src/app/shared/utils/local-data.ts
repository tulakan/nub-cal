/** Removes this account's cached logs and plans from the device. */
export function clearLocalUserData(uid: string, storage: Storage = localStorage) {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k?.includes(`:${uid}:`)) keys.push(k);
  }
  keys.forEach(k => storage.removeItem(k));
}
