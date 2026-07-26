export interface TimeSuggestion {
  date: Date;
  label: string;
  matchedText: string;
}

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatSuggestion = (date: Date) => {
  const datePart = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${timePart}, ${datePart}`;
};

const readPeriodDefaultHour = (text: string) => {
  if (/\b(sang)\b/.test(text)) return 9;
  if (/\b(trua)\b/.test(text)) return 12;
  if (/\b(chieu)\b/.test(text)) return 14;
  if (/\b(toi|dem)\b/.test(text)) return 20;
  return 9;
};

const applyPeriod = (hour: number, text: string) => {
  if (/\b(chieu|toi|dem)\b/.test(text) && hour < 12) return hour + 12;
  if (/\b(sang)\b/.test(text) && hour === 12) return 0;
  return hour;
};

/**
 * Extracts a future Vietnamese date/time from a chat message.
 * Relative phrases are anchored to messageCreatedAt so old messages do not
 * continually produce new suggestions.
 */
export function detectVietnameseTime(
  content: string,
  messageCreatedAt: string | Date,
  now = new Date(),
): TimeSuggestion | null {
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ');
  const text = normalize(plainText);
  if (!text) return null;

  const reference = new Date(messageCreatedAt);
  const anchor = Number.isNaN(reference.getTime()) ? now : reference;

  const relativeMatch = text.match(/\b(\d{1,3})\s*(phut|tieng|gio|ngay)\s*(nua|sau)\b/);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    const milliseconds = unit === 'phut'
      ? amount * 60_000
      : (unit === 'tieng' || unit === 'gio')
        ? amount * 3_600_000
        : amount * 86_400_000;
    const date = new Date(anchor.getTime() + milliseconds);
    if (date.getTime() > now.getTime() + 30_000) {
      return { date, label: formatSuggestion(date), matchedText: relativeMatch[0] };
    }
    return null;
  }

  let targetDay: Date | null = null;
  let hasDatePhrase = false;

  const numericDate = text.match(/\b(?:ngay\s*)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  const wordDate = text.match(/\bngay\s+(\d{1,2})\s+thang\s+(\d{1,2})(?:\s+nam\s+(\d{4}))?\b/);
  const dateMatch = numericDate ?? wordDate;
  if (dateMatch) {
    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    let year = dateMatch[3] ? Number(dateMatch[3]) : anchor.getFullYear();
    if (year < 100) year += 2000;
    targetDay = new Date(year, month - 1, day);
    if (!dateMatch[3] && targetDay.getTime() < startOfDay(anchor).getTime()) {
      targetDay.setFullYear(targetDay.getFullYear() + 1);
    }
    if (targetDay.getDate() !== day || targetDay.getMonth() !== month - 1) return null;
    hasDatePhrase = true;
  } else if (/\b(ngay kia|ngay mot)\b/.test(text)) {
    targetDay = addDays(startOfDay(anchor), 2);
    hasDatePhrase = true;
  } else if (/\b(ngay mai|mai)\b/.test(text)) {
    targetDay = addDays(startOfDay(anchor), 1);
    hasDatePhrase = true;
  } else if (/\bhom nay\b/.test(text)) {
    targetDay = startOfDay(anchor);
    hasDatePhrase = true;
  } else {
    const weekdayMatch = text.match(/\b(?:thu\s*([2-7])|thu\s+(hai|ba|tu|nam|sau|bay)|chu nhat)\b/);
    if (weekdayMatch) {
      const namedWeekdays: Record<string, number> = { hai: 1, ba: 2, tu: 3, nam: 4, sau: 5, bay: 6 };
      const targetWeekday = weekdayMatch[1]
        ? Number(weekdayMatch[1]) - 1
        : weekdayMatch[2]
          ? namedWeekdays[weekdayMatch[2]]
          : 0;
      let delta: number;
      if (/\btuan sau\b/.test(text)) {
        const daysUntilNextMonday = ((1 - anchor.getDay() + 7) % 7) || 7;
        delta = daysUntilNextMonday + ((targetWeekday + 6) % 7);
      } else {
        delta = (targetWeekday - anchor.getDay() + 7) % 7;
        if (delta === 0) delta = 7;
      }
      targetDay = addDays(startOfDay(anchor), delta);
      hasDatePhrase = true;
    } else if (/\b(tuan sau)\b/.test(text)) {
      const daysUntilMonday = ((1 - anchor.getDay() + 7) % 7) || 7;
      targetDay = addDays(startOfDay(anchor), daysUntilMonday);
      hasDatePhrase = true;
    } else if (/\b(cuoi tuan)\b/.test(text)) {
      const daysUntilSaturday = ((6 - anchor.getDay() + 7) % 7) || 7;
      targetDay = addDays(startOfDay(anchor), daysUntilSaturday);
      hasDatePhrase = true;
    }
  }

  const clockMatch = text.match(/\b(?:luc\s*)?(\d{1,2})(?:\s*(?:h|gio)\s*(\d{1,2})?|:(\d{2}))\b/)
    ?? text.match(/\bluc\s+(\d{1,2})\b/);
  const hasClock = Boolean(clockMatch);
  if (!hasDatePhrase && !hasClock) return null;
  const hasTimeIntent = /\b(luc|hen|hop|gap|nhac|goi|vao|truoc|sau|sang|trua|chieu|dem)\b/.test(text)
    || /\bgio\s+toi\b/.test(text);
  if (!hasDatePhrase && hasClock && !hasTimeIntent) {
    return null;
  }

  let hour = clockMatch ? Number(clockMatch[1]) : readPeriodDefaultHour(text);
  const minute = clockMatch ? Number(clockMatch[2] ?? clockMatch[3] ?? 0) : 0;
  if (hour > 23 || minute > 59) return null;
  hour = applyPeriod(hour, text);
  if (hour > 23) return null;

  const date = targetDay ?? startOfDay(anchor);
  date.setHours(hour, minute, 0, 0);

  if (!targetDay && date.getTime() <= anchor.getTime()) {
    date.setDate(date.getDate() + 1);
  }
  if (date.getTime() <= now.getTime() + 30_000) return null;

  const matchedText = [dateMatch?.[0], clockMatch?.[0]]
    .filter(Boolean)
    .join(' ') || plainText.trim();
  return { date, label: formatSuggestion(date), matchedText };
}
