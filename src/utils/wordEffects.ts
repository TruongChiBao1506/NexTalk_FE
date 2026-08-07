export interface CustomWordEffect {
  id: string;
  keyword: string;
  emoji: string;
}

const STORAGE_KEY = 'nextalk_word_effects';

export const DEFAULT_WORD_EFFECTS: CustomWordEffect[] = [
  { id: 'def_1', keyword: 'chúc mừng', emoji: '🎉' },
  { id: 'def_2', keyword: 'congratulations', emoji: '🎉' },
  { id: 'def_3', keyword: 'congrats', emoji: '🎉' },
  { id: 'def_4', keyword: 'sinh nhật', emoji: '🎂' },
  { id: 'def_5', keyword: 'happy birthday', emoji: '🎂' },
  { id: 'def_6', keyword: 'hpbd', emoji: '🎂' },
  { id: 'def_7', keyword: 'tuyệt vời', emoji: '⭐' },
  { id: 'def_8', keyword: 'awesome', emoji: '⭐' },
  { id: 'def_9', keyword: 'thắng', emoji: '🏆' },
  { id: 'def_10', keyword: 'yêu', emoji: '❤️' },
  { id: 'def_11', keyword: 'love', emoji: '❤️' },
  { id: 'def_12', keyword: 'lì xì', emoji: '🧧' },
];

import { conversationService } from '../services/conversationService';
import { useChatStore } from '../store/chatStore';

export const getCustomWordEffects = (conversationInput?: any): CustomWordEffect[] => {
  let custom: CustomWordEffect[] = [];
  let conversationId: string | null = null;

  if (typeof conversationInput === 'string') {
    conversationId = conversationInput;
  } else if (conversationInput && typeof conversationInput === 'object') {
    conversationId = conversationInput.id || null;
    if (Array.isArray(conversationInput.wordEffects)) {
      custom = conversationInput.wordEffects;
    }
  }

  if (custom.length === 0 && conversationId) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${conversationId}`);
      if (raw) {
        custom = JSON.parse(raw);
      }
    } catch {
      // Ignore storage errors
    }
  }

  const merged = [...DEFAULT_WORD_EFFECTS];
  for (const c of custom) {
    if (!c || !c.keyword) continue;
    const existingIndex = merged.findIndex((m) => m.keyword.toLowerCase() === c.keyword.toLowerCase());
    if (existingIndex >= 0) {
      merged[existingIndex] = c;
    } else {
      merged.push(c);
    }
  }
  return merged;
};

export const saveCustomWordEffects = async (conversationId: string, effects: CustomWordEffect[]): Promise<void> => {
  if (!conversationId) return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${conversationId}`, JSON.stringify(effects));
  } catch {
    // Ignore storage errors
  }
  try {
    const response = await conversationService.updateWordEffects(conversationId, effects);
    if (response.success && response.data) {
      useChatStore.getState().updateConversation(response.data);
    }
  } catch (error) {
    console.error('Failed to sync word effects to server:', error);
  }
};

export interface MatchedWordEffectToken {
  type: 'text' | 'wordEffect';
  text: string;
  emoji?: string;
  effectId?: string;
}

export const parseMessageWordEffects = (
  text: string,
  wordEffects: CustomWordEffect[]
): MatchedWordEffectToken[] => {
  if (!text || !wordEffects || wordEffects.length === 0) {
    return [{ type: 'text', text }];
  }

  // Escape special regex chars in keywords
  const sorted = [...wordEffects].sort((a, b) => b.keyword.length - a.keyword.length);
  const patterns = sorted.map((e) => e.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  if (!patterns) return [{ type: 'text', text }];

  const regex = new RegExp(`(${patterns})`, 'gi');
  const tokens: MatchedWordEffectToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) tokens.push({ type: 'text', text: before });

    const matchedStr = match[0];
    const effect = sorted.find((e) => e.keyword.toLowerCase() === matchedStr.toLowerCase());

    tokens.push({
      type: 'wordEffect',
      text: matchedStr,
      emoji: effect?.emoji || '✨',
      effectId: effect?.id,
    });

    lastIndex = regex.lastIndex;
  }

  const remaining = text.slice(lastIndex);
  if (remaining) tokens.push({ type: 'text', text: remaining });

  return tokens;
};
