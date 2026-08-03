import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const chatStorePath = fileURLToPath(new URL('../src/store/chatStore.ts', import.meta.url));
const source = readFileSync(chatStorePath, 'utf8');
const authStore = readFileSync(fileURLToPath(new URL('../src/store/authStore.ts', import.meta.url)), 'utf8');
const privacyUtility = readFileSync(fileURLToPath(new URL('../src/utils/chatDraftPrivacy.ts', import.meta.url)), 'utf8');

const forbiddenPersistence = [
  /localStorage\.setItem\([^\n]*messageDraft/i,
  /localStorage\.getItem\([^\n]*messageDraft/i,
  /\bsaveMessageDrafts\b/,
  /\bloadMessageDrafts\b/,
];

for (const pattern of forbiddenPersistence) {
  if (pattern.test(source)) {
    throw new Error(`Chat draft privacy regression: forbidden persistence matched ${pattern}`);
  }
}

if (!source.includes('purgeLegacyMessageDraftStorage()')) {
  throw new Error('Chat draft privacy regression: legacy plaintext draft cleanup is missing');
}

if ((authStore.match(/purgeLegacyMessageDraftStorage\(\)/g) ?? []).length < 2) {
  throw new Error('Chat draft privacy regression: startup/logout cleanup is missing');
}

if (!privacyUtility.includes('window.localStorage.removeItem(key)')) {
  throw new Error('Chat draft privacy regression: legacy draft keys are not removed');
}

if (!source.includes('messageDrafts: {},')) {
  throw new Error('Chat draft privacy regression: drafts are not initialized as session-only state');
}

console.log('Chat draft privacy check passed.');
