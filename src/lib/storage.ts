/**
 * Browsers may clear a site's IndexedDB when the device runs low on space
 * (Safari also clears it after 7 days without a visit, unless the app is
 * installed). Asking for "persistent" storage opts out of that clean-up.
 * Chrome and Edge usually grant it silently for installed or often-used sites.
 */
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function isStoragePersistent(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persisted) return null;
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
}
