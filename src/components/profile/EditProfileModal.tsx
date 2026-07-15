import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Link2,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { fileService } from '../../services/fileService';
import type { UpdateProfilePayload } from '../../services/userService';
import { useUserStore } from '../../store/userStore';
import type { User } from '../../types/auth';

const editProfileSchema = z.object({
  username: z.string(),
  avatarUrl: z.string().min(1, 'Vui lòng chọn ảnh đại diện'),
  bio: z.string().max(160, 'Giới thiệu không vượt quá 160 ký tự').optional().or(z.literal('')),
  birthday: z.string().optional().or(z.literal('')),
  enableBirthdayNotification: z.boolean().optional(),
});

const usernameSchema = z.string()
  .trim()
  .min(3, 'Username cần ít nhất 3 ký tự')
  .max(50, 'Username không vượt quá 50 ký tự');

type EditProfileInput = z.infer<typeof editProfileSchema>;

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150',
];

const DICEBEAR_STYLES = ['adventurer', 'bottts', 'avataaars', 'lorelei', 'fun-emoji'];
const MAX_AVATAR_SIZE_MB = 5;

export const EditProfileModal = ({ user, onClose }: EditProfileModalProps) => {
  const updateProfile = useUserStore((state) => state.updateProfile);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl || AVATAR_PRESETS[0]);
  const [dicebearStyle, setDicebearStyle] = useState('adventurer');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      username: user.username,
      avatarUrl: user.avatarUrl || AVATAR_PRESETS[0],
      bio: user.bio || '',
      birthday: user.birthday || '',
      enableBirthdayNotification: user.enableBirthdayNotification ?? true,
    },
  });

  useEffect(() => {
    setValue('avatarUrl', selectedAvatar, {
      shouldValidate: true,
      shouldDirty: selectedAvatar !== (user.avatarUrl || AVATAR_PRESETS[0]),
    });
  }, [selectedAvatar, setValue, user.avatarUrl]);

  const setAvatar = (url: string) => {
    setAvatarUploadError(null);
    setSelectedAvatar(url);
  };

  const generateDicebear = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const randomStyle = DICEBEAR_STYLES[Math.floor(Math.random() * DICEBEAR_STYLES.length)];
    setDicebearStyle(randomStyle);
    setAvatar(`https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`);
  };

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Vui lòng chọn tệp hình ảnh.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      setAvatarUploadError(`Ảnh đại diện không được vượt quá ${MAX_AVATAR_SIZE_MB}MB.`);
      return;
    }

    setIsUploadingAvatar(true);
    setUploadProgress(0);
    setAvatarUploadError(null);

    try {
      const response = await fileService.uploadFile(file, setUploadProgress);
      if (response.success && response.data?.url) {
        setAvatar(response.data.url);
      } else {
        setAvatarUploadError(response.message || 'Không thể tải ảnh lên.');
      }
    } catch (err: any) {
      setAvatarUploadError(err.response?.data?.message || err.message || 'Không thể tải ảnh lên.');
    } finally {
      setIsUploadingAvatar(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: EditProfileInput) => {
    if (isUploadingAvatar) return;
    const payload: UpdateProfilePayload = {};

    if (dirtyFields.username) {
      const result = usernameSchema.safeParse(data.username);
      if (!result.success) {
        setError('username', { type: 'validate', message: result.error.issues[0]?.message });
        return;
      }
      if (result.data !== user.username) payload.username = result.data;
    }
    if (dirtyFields.avatarUrl) payload.avatarUrl = data.avatarUrl;
    if (dirtyFields.bio) payload.bio = data.bio || '';
    if (dirtyFields.birthday) payload.birthday = data.birthday || '';
    if (dirtyFields.enableBirthdayNotification) {
      payload.enableBirthdayNotification = Boolean(data.enableBirthdayNotification);
    }

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    const success = await updateProfile(payload);
    if (success) {
      onClose();
    }
  };

  const isSubmitting = isLoading || isUploadingAvatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left text-gray-900 shadow-2xl dark:border-zinc-800 dark:bg-discord-mid dark:text-white">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h3 className="m-0 text-xl font-bold">Chỉnh sửa hồ sơ</h3>
            <p className="m-0 mt-1 text-sm text-gray-500 dark:text-zinc-400">
              Cập nhật ảnh đại diện, tên hiển thị và giới thiệu của bạn.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="m-0 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Ảnh đại diện</p>

              <div className="mt-4 flex flex-col items-center">
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-md ring-2 ring-indigo-500 dark:border-zinc-900 dark:bg-zinc-800">
                  <img
                    src={selectedAvatar}
                    alt="Ảnh đại diện"
                    className="h-full w-full object-cover"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 text-white">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="mt-2 text-xs font-bold">{uploadProgress}%</span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  <span>{isUploadingAvatar ? 'Đang tải lên...' : 'Tải ảnh từ máy'}</span>
                </button>

                <p className="m-0 mt-2 text-center text-xs text-gray-500 dark:text-zinc-400">
                  JPG, PNG, GIF hoặc WebP. Tối đa {MAX_AVATAR_SIZE_MB}MB.
                </p>
              </div>
            </section>

            <section className="space-y-5">
              {(error || avatarUploadError) && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {avatarUploadError || error}
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/35">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="m-0 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Chọn nhanh</p>
                    <p className="m-0 mt-0.5 text-xs text-gray-400 dark:text-zinc-500">Dùng preset hoặc tạo avatar tự động.</p>
                  </div>
                  <button
                    type="button"
                    onClick={generateDicebear}
                    disabled={isSubmitting}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Tạo avatar</span>
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setAvatar(url)}
                      disabled={isSubmitting}
                      className={`relative h-10 w-10 overflow-hidden rounded-full border-2 transition hover:scale-105 disabled:opacity-60 ${
                        selectedAvatar === url ? 'border-indigo-600' : 'border-transparent'
                      }`}
                      title={`Avatar mẫu ${idx + 1}`}
                    >
                      <img src={url} alt={`Avatar mẫu ${idx + 1}`} className="h-full w-full object-cover" />
                      {selectedAvatar === url && (
                        <span className="absolute bottom-0 right-0 rounded-full bg-indigo-600 text-white">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-zinc-950/60 dark:text-zinc-400">
                  <Camera className="h-4 w-4 text-indigo-500" />
                  <span>Kiểu tạo hiện tại: <strong>{dicebearStyle}</strong></span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Link ảnh đại diện</label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="https://example.com/avatar.jpg"
                    value={selectedAvatar}
                    onChange={(event) => setAvatar(event.target.value)}
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-zinc-950"
                  />
                </div>
                {errors.avatarUrl && <p className="m-0 text-xs font-medium text-rose-500">{errors.avatarUrl.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Tên người dùng (Username)</label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  placeholder="Tên hiển thị"
                  {...register('username')}
                  className={`h-11 w-full rounded-xl border bg-gray-50 px-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white disabled:opacity-60 dark:bg-zinc-900/70 dark:text-white dark:focus:bg-zinc-950 ${
                    errors.username
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-gray-200 focus:border-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-500'
                  }`}
                />
                {errors.username && <p className="m-0 text-xs font-medium text-rose-500">{errors.username.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Giới thiệu bản thân</label>
                <textarea
                  disabled={isSubmitting}
                  rows={4}
                  placeholder="Viết vài dòng giới thiệu về bạn..."
                  {...register('bio')}
                  className={`w-full resize-none rounded-xl border bg-gray-50 px-3 py-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white disabled:opacity-60 dark:bg-zinc-900/70 dark:text-white dark:focus:bg-zinc-950 ${
                    errors.bio
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-gray-200 focus:border-indigo-500 dark:border-zinc-800 dark:focus:border-indigo-500'
                  }`}
                />
                {errors.bio && <p className="m-0 text-xs font-medium text-rose-500">{errors.bio.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Ngày sinh</label>
                <input
                  type="date"
                  disabled={isSubmitting}
                  {...register('birthday')}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-900 outline-none transition focus:border-indigo-500 focus:bg-white disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-zinc-950"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="pr-4">
                  <p className="m-0 text-sm font-bold text-gray-900 dark:text-white">Thông báo sinh nhật</p>
                  <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                    Nhận tin nhắn chúc mừng sinh nhật từ NexTalk Moderator.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    disabled={isSubmitting}
                    {...register('enableBirthdayNotification')}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 disabled:opacity-60 dark:bg-zinc-700 dark:border-zinc-600 dark:peer-focus:ring-indigo-800"></div>
                </label>
              </div>
            </section>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              <span>{isUploadingAvatar ? 'Đang tải ảnh...' : isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
