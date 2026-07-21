import { useState, useEffect } from 'react';
import { formatRelativeTime } from '../utils/time';

/**
 * Returns a live-updating relative time string (e.g. "5 phút trước").
 * Polling interval is adaptive: fast when recent, slow when older.
 */
export function useRelativeTime(dateString: string | null | undefined): string {
  const [text, setText] = useState(() =>
    dateString ? formatRelativeTime(dateString) : ''
  );

  useEffect(() => {
    if (!dateString) {
      setText('');
      return;
    }

    const update = () => setText(formatRelativeTime(dateString));
    update();

    const getInterval = () => {
      const diffSecs = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
      if (diffSecs < 60) return 10_000;       // < 1 phút → cập nhật mỗi 10s
      if (diffSecs < 3600) return 60_000;     // < 1 giờ  → cập nhật mỗi 1 phút
      return 5 * 60_000;                      // > 1 giờ  → cập nhật mỗi 5 phút
    };

    let timerId: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timerId = setTimeout(() => {
        update();
        schedule();
      }, getInterval());
    };

    schedule();

    return () => clearTimeout(timerId);
  }, [dateString]);

  return text;
}
