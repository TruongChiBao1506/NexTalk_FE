import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Loader2, Plus, Settings2, Trash2, X } from 'lucide-react';
import { groupEventService } from '../../services/groupEventService';
import type { GroupEventResponse, GroupRole, SaveGroupEventRequest } from '../../types/group';
import { GroupEventCard } from './GroupEventCard';

interface Props {
  group: any;
  conversationId: string;
  currentUserRole?: GroupRole | null;
  onGroupsChanged: () => Promise<void>;
}

const toInputValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const toLocalDateTime = (value: string) => value.length === 16 ? `${value}:00` : value;
const emptyForm = (): SaveGroupEventRequest => ({
  title: '', description: '', location: '', meetingUrl: '',
  startsAt: toInputValue(new Date(Date.now() + 60 * 60 * 1000).toISOString()),
  endsAt: '', reminderMinutes: 60,
});

export const GroupEventsSection: React.FC<Props> = ({ group, conversationId, currentUserRole, onGroupsChanged }) => {
  const [events, setEvents] = useState<GroupEventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<GroupEventResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SaveGroupEventRequest>(emptyForm);
  const manager = ['OWNER', 'LEADER', 'DEPUTY', 'ADMIN'].includes(currentUserRole ?? '');
  const canCreate = manager || Boolean(group.membersCanCreateEvents);

  const load = async () => {
    setLoading(true);
    try { setEvents(await groupEventService.getUpcoming(group.id)); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [group.id]);

  const startCreate = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const startEdit = (event: GroupEventResponse) => {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      meetingUrl: event.meetingUrl ?? '',
      startsAt: toInputValue(event.startsAt),
      endsAt: toInputValue(event.endsAt),
      reminderMinutes: event.reminderMinutes,
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        startsAt: toLocalDateTime(form.startsAt),
        endsAt: form.endsAt ? toLocalDateTime(form.endsAt) : undefined,
      };
      if (editing) await groupEventService.update(group.id, editing.id, payload);
      else await groupEventService.create(group.id, { ...payload, conversationId });
      setOpen(false);
      await load();
    } finally { setSaving(false); }
  };

  const toggleMembers = async () => {
    await groupEventService.updateSettings(group.id, !group.membersCanCreateEvents);
    group.membersCanCreateEvents = !group.membersCanCreateEvents;
    await onGroupsChanged();
  };

  const sortedEvents = useMemo(() => [...events].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)), [events]);

  return (
    <section className="border-b border-gray-100 px-4 py-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-bold text-gray-800 dark:text-zinc-100">Sự kiện sắp tới</span>
        </div>
        <div className="flex items-center gap-1">
          {manager && <button type="button" onClick={() => void toggleMembers()} title={group.membersCanCreateEvents ? 'Chỉ quản trị viên được tạo' : 'Cho phép thành viên tạo'} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"><Settings2 className="h-4 w-4" /></button>}
          {canCreate && <button type="button" onClick={startCreate} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" />Tạo</button>}
        </div>
      </div>
      {manager && <p className="mb-3 text-[11px] text-gray-500 dark:text-zinc-400">{group.membersCanCreateEvents ? 'Mọi thành viên có thể tạo sự kiện' : 'Chỉ quản trị viên có thể tạo sự kiện'}</p>}
      {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-500" /> : sortedEvents.length === 0 ? (
        <p className="text-xs text-gray-400">Chưa có sự kiện sắp tới.</p>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event) => (
            <div key={event.id}>
              <GroupEventCard event={event} compact onChange={(updated) => setEvents((items) => items.map((item) => item.id === updated.id ? updated : item))} />
              {event.canManage && <div className="mt-1.5 flex justify-end gap-2">
                <button onClick={() => startEdit(event)} className="text-[11px] font-semibold text-indigo-600">Chỉnh sửa</button>
                <button onClick={async () => { if (confirm('Hủy sự kiện này?')) { await groupEventService.cancel(group.id, event.id); await load(); } }} className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500"><Trash2 className="h-3 w-3" />Hủy</button>
              </div>}
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
          <form onSubmit={submit} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 text-base font-extrabold text-gray-900 dark:text-white">{editing ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện'}</h3>
              <button type="button" onClick={() => setOpen(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="space-y-3">
              <input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tên sự kiện" className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
              <textarea maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả (không bắt buộc)" className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
              <div><label className="mb-1 block text-xs font-semibold">Bắt đầu</label><input required type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" /></div>
              <div><label className="mb-1 block text-xs font-semibold">Kết thúc</label><input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" /></div>
              <input maxLength={300} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Địa điểm" className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
              <input type="url" maxLength={500} value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} placeholder="Liên kết họp trực tuyến" className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
              <select value={form.reminderMinutes} onChange={(e) => setForm({ ...form, reminderMinutes: Number(e.target.value) })} className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-700">
                <option value={0}>Không nhắc</option><option value={15}>Trước 15 phút</option><option value={60}>Trước 1 giờ</option><option value={1440}>Trước 1 ngày</option>
              </select>
            </div>
            <button disabled={saving} className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Đang lưu…' : 'Lưu sự kiện'}</button>
          </form>
        </div>
      )}
    </section>
  );
};
