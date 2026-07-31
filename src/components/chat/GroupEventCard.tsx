import React, { useState } from 'react';
import { CalendarDays, Clock3, MapPin, Users, Video } from 'lucide-react';
import { groupEventService } from '../../services/groupEventService';
import type { GroupEventResponse, GroupEventRsvpStatus } from '../../types/group';
import { useAuthStore } from '../../store/authStore';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});

const RSVP_OPTIONS: Array<{ value: GroupEventRsvpStatus; label: string }> = [
  { value: 'ATTENDING', label: 'Tham gia' },
  { value: 'MAYBE', label: 'Có thể' },
  { value: 'NOT_ATTENDING', label: 'Không tham gia' },
];

interface Props {
  event: GroupEventResponse;
  compact?: boolean;
  onChange?: (event: GroupEventResponse) => void;
}

export const GroupEventCard: React.FC<Props> = ({ event: initialEvent, compact = false, onChange }) => {
  const [event, setEvent] = useState(initialEvent);
  const [saving, setSaving] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const selectedRsvp = event.participants.find((participant) => participant.userId === currentUserId)?.status
    ?? event.currentUserRsvp;

  React.useEffect(() => setEvent(initialEvent), [initialEvent]);

  const updateRsvp = async (status: GroupEventRsvpStatus) => {
    if (event.status === 'CANCELLED' || saving) return;
    setSaving(true);
    try {
      const updated = await groupEventService.rsvp(event.groupId, event.id, status);
      setEvent(updated);
      onChange?.(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${compact ? 'w-full' : 'w-[min(92vw,520px)]'} overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-gray-200 dark:bg-zinc-900 dark:ring-zinc-800`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="m-0 truncate text-sm font-extrabold text-gray-900 dark:text-zinc-100">{event.title}</h4>
            {event.status === 'CANCELLED' && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-zinc-800">Đã hủy</span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
            <Clock3 className="h-3.5 w-3.5" />
            {dateFormatter.format(new Date(event.startsAt))}
            {event.endsAt ? ` – ${dateFormatter.format(new Date(event.endsAt))}` : ''}
          </p>
          {event.description && <p className="mt-2 whitespace-pre-wrap text-xs text-gray-600 dark:text-zinc-300">{event.description}</p>}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-zinc-400">
            {event.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>}
            {event.meetingUrl && (
              <a className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline" href={event.meetingUrl} target="_blank" rel="noreferrer">
                <Video className="h-3.5 w-3.5" />Tham gia trực tuyến
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-3 dark:border-zinc-800">
        <div className="grid grid-cols-3 gap-1.5">
          {RSVP_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={saving || event.status === 'CANCELLED'}
              onClick={() => void updateRsvp(option.value)}
              className={`rounded-lg px-2 py-1.5 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                selectedRsvp === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowParticipants(!showParticipants)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-indigo-600 dark:text-zinc-400">
          <Users className="h-3.5 w-3.5" />
          {event.attendingCount} tham gia · {event.maybeCount} có thể
        </button>
        {showParticipants && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {event.participants.length === 0 ? (
              <span className="text-xs text-gray-400">Chưa có phản hồi</span>
            ) : event.participants.map((participant) => (
              <span key={participant.userId} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
                {participant.avatarUrl ? <img src={participant.avatarUrl} className="h-4 w-4 rounded-full object-cover" alt="" /> : null}
                {participant.username}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
