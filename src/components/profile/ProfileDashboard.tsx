import { useEffect, useState } from 'react';
import {
  Bell,
  Cake,
  Calendar,
  CheckCircle2,
  Edit3,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Monitor,
  ShieldCheck,
  Smartphone,
  UserRound,
  UsersRound,
} from 'lucide-react';
import type { User } from '../../types/auth';

type SettingKey = 'showActivityStatus' | 'blockStrangerMessages' | 'enableBirthdayNotification';
type SettingUpdate = Partial<Pick<User, SettingKey>>;

interface Props {
  profile: User;
  sessionCount: number;
  isLoggingOut: boolean;
  onBack: () => void;
  onEdit: () => void;
  onChangePassword: () => void;
  onManageSessions: () => void;
  onSetupPin: () => void;
  onDeletePin: () => void;
  onLogout: () => void;
  onUpdateSetting: (data: SettingUpdate) => Promise<boolean>;
}

const Toggle = ({ checked, disabled, label, onClick }: { checked: boolean; disabled?: boolean; label: string; onClick: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-label={label}
    aria-checked={checked}
    disabled={disabled}
    onClick={onClick}
    className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'}`}
  >
    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
  </button>
);

export function ProfileDashboard({ profile, sessionCount, isLoggingOut, onBack, onEdit, onChangePassword, onManageSessions, onSetupPin, onDeletePin, onLogout, onUpdateSetting }: Props) {
  const [pendingSetting, setPendingSetting] = useState<SettingKey | null>(null);
  const [settingNotice, setSettingNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const joinedAt = new Date(profile.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
  const birthday = profile.birthday ? new Date(profile.birthday).toLocaleDateString('vi-VN') : 'Chưa có dữ liệu';

  useEffect(() => {
    if (!settingNotice) return;
    const timer = window.setTimeout(() => setSettingNotice(null), 2500);
    return () => window.clearTimeout(timer);
  }, [settingNotice]);

  const updateSetting = async (key: SettingKey, value: boolean) => {
    if (pendingSetting) return;
    setPendingSetting(key);
    setSettingNotice(null);
    const success = await onUpdateSetting({ [key]: value });
    setSettingNotice(success
      ? { type: 'success', text: 'Đã cập nhật cài đặt.' }
      : { type: 'error', text: 'Không thể cập nhật. Vui lòng thử lại.' });
    setPendingSetting(null);
  };

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-[#f7f9fc] shadow-2xl dark:border-zinc-800 dark:bg-[#111318] lg:grid lg:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="flex border-b border-slate-200 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/70 lg:min-h-[720px] lg:flex-col lg:border-b-0 lg:border-r">
        <div className="hidden lg:block">
          <p className="m-0 text-base font-black text-slate-900 dark:text-white">NexTalk Identity</p>
          <p className="m-0 mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Quản lý tài khoản</p>
        </div>
        <nav aria-label="Điều hướng tài khoản" className="flex flex-1 gap-2 overflow-x-auto lg:mt-8 lg:flex-col">
          <button onClick={onBack} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"><UsersRound className="h-4 w-4" />Tin nhắn</button>
          <button aria-current="page" className="flex shrink-0 items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><UserRound className="h-4 w-4" />Hồ sơ</button>
          <button onClick={onChangePassword} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"><Lock className="h-4 w-4" />Bảo mật</button>
          <button onClick={onManageSessions} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"><Monitor className="h-4 w-4" />Thiết bị</button>
          <button disabled={isLoggingOut} onClick={onLogout} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-500/10 lg:hidden">
            {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}Đăng xuất
          </button>
        </nav>
        <button disabled={isLoggingOut} onClick={onLogout} className="hidden items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-500/10 lg:flex">
          {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}Đăng xuất
        </button>
      </aside>

      <main className="p-4 sm:p-7 lg:p-8">
        <section className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row">
          <div className="relative h-20 w-20 shrink-0">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`Ảnh đại diện của ${profile.username}`} className="h-full w-full rounded-full object-cover ring-4 ring-slate-100 dark:ring-zinc-800" /> : <div className="flex h-full w-full items-center justify-center rounded-full bg-indigo-600 text-2xl font-black text-white">{profile.username[0]?.toUpperCase()}</div>}
            {profile.showActivityStatus !== false && <span title={profile.status === 'ONLINE' ? 'Đang hoạt động' : 'Ngoại tuyến'} className={`absolute bottom-1 right-0 h-4 w-4 rounded-full border-2 border-white ${profile.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="m-0 truncate text-xl font-black text-slate-950 dark:text-white">{profile.username}</h1>
              {profile.isVerified && <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-600 dark:bg-sky-500/10">Đã xác minh</span>}
            </div>
            <p className="m-0 mt-1 truncate text-sm text-slate-500">{profile.email}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"><Edit3 className="h-3.5 w-3.5" />Chỉnh sửa hồ sơ</button>
              <button onClick={onChangePassword} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200"><Lock className="h-3.5 w-3.5" />Đổi mật khẩu</button>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.85fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="m-0 border-b border-slate-100 px-5 py-4 text-sm font-black dark:border-zinc-800">Thông tin cá nhân</h2>
            <div className="space-y-1 p-4">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-800/60"><p className="m-0 text-[10px] font-bold uppercase text-slate-400">Giới thiệu</p><p className="m-0 mt-2 break-words text-sm italic text-slate-700 dark:text-zinc-200">{profile.bio ? `“${profile.bio}”` : 'Chưa có giới thiệu'}</p></div>
              <div className="flex items-center gap-3 border-b border-slate-100 px-2 py-4 text-sm dark:border-zinc-800"><Mail className="h-4 w-4 shrink-0 text-slate-400" /><span className="text-slate-500">Địa chỉ email</span><strong className="ml-auto break-all text-right text-slate-800 dark:text-zinc-100">{profile.email}</strong></div>
              <div className="flex items-center gap-3 border-b border-slate-100 px-2 py-4 text-sm dark:border-zinc-800"><Calendar className="h-4 w-4 shrink-0 text-slate-400" /><span className="text-slate-500">Ngày tham gia</span><strong className="ml-auto text-right text-slate-800 dark:text-zinc-100">{joinedAt}</strong></div>
              <div className="flex items-center gap-3 px-2 py-4 text-sm"><Cake className="h-4 w-4 shrink-0 text-slate-400" /><span className="text-slate-500">Ngày sinh</span><strong className="ml-auto text-right text-slate-800 dark:text-zinc-100">{birthday}</strong></div>
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="m-0 border-b border-slate-100 px-5 py-4 text-sm font-black dark:border-zinc-800">Bảo mật tài khoản</h2>
              <div className="space-y-3 p-4">
                <button onClick={onManageSessions} className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"><span className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-500/10"><Smartphone className="h-4 w-4" /></span><span><strong className="block text-xs">Thiết bị đăng nhập</strong><small className="text-slate-400">{sessionCount} phiên đang hiệu lực</small></span><span className="ml-auto" aria-hidden>›</span></button>
                <button onClick={profile.hasChatPin ? onDeletePin : onSetupPin} className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left hover:bg-slate-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"><span className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-500/10"><Lock className="h-4 w-4" /></span><span><strong className="block text-xs">Khóa ẩn trò chuyện</strong><small className="text-slate-400">{profile.hasChatPin ? 'Đã thiết lập PIN' : 'Chưa thiết lập'}</small></span><span className="ml-auto text-xs font-bold text-indigo-600">{profile.hasChatPin ? 'Xóa PIN' : 'Thiết lập'}</span></button>
              </div>
            </section>

            <section className="relative rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex min-h-14 items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-zinc-800">
                <h2 className="m-0 text-sm font-black">Cài đặt & Tùy chỉnh</h2>
                {pendingSetting && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" aria-label="Đang lưu cài đặt" />}
              </div>
              {settingNotice && <div role="status" className={`mx-4 mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${settingNotice.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'}`}><CheckCircle2 className="h-3.5 w-3.5" />{settingNotice.text}</div>}
              <div className="divide-y divide-slate-100 p-2 dark:divide-zinc-800">
                <div className="flex items-center gap-3 p-3"><Monitor className="h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0 flex-1"><strong className="block text-xs">Trạng thái hoạt động</strong><small className="text-slate-400">Hiển thị Online và hoạt động gần đây</small></span><Toggle label="Trạng thái hoạt động" checked={profile.showActivityStatus !== false} disabled={!!pendingSetting} onClick={() => void updateSetting('showActivityStatus', profile.showActivityStatus === false)} /></div>
                <div className="flex items-center gap-3 p-3"><ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0 flex-1"><strong className="block text-xs">Chỉ nhận tin từ bạn bè</strong><small className="text-slate-400">Chặn lời nhắn từ người lạ</small></span><Toggle label="Chỉ nhận tin từ bạn bè" checked={!!profile.blockStrangerMessages} disabled={!!pendingSetting} onClick={() => void updateSetting('blockStrangerMessages', !profile.blockStrangerMessages)} /></div>
                <div className="flex items-center gap-3 p-3"><Bell className="h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0 flex-1"><strong className="block text-xs">Thông báo sinh nhật</strong><small className="text-slate-400">Nhận nhắc nhở sinh nhật bạn bè</small></span><Toggle label="Thông báo sinh nhật" checked={profile.enableBirthdayNotification !== false} disabled={!!pendingSetting} onClick={() => void updateSetting('enableBirthdayNotification', profile.enableBirthdayNotification === false)} /></div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
