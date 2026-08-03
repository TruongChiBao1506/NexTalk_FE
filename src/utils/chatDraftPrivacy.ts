const MESSAGE_DRAFTS_STORAGE_KEY = 'nextalk_messageDrafts';

export const purgeLegacyMessageDraftStorage = () => {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key === MESSAGE_DRAFTS_STORAGE_KEY || key?.startsWith(`${MESSAGE_DRAFTS_STORAGE_KEY}:`)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
};
