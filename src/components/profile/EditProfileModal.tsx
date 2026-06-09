import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import type { User } from '../../types/auth';

const editProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username cannot exceed 30 characters'),
  avatarUrl: z.string().min(1, 'Avatar is required').max(250, 'Avatar URL must be under 250 characters'),
  bio: z.string().max(160, 'Bio cannot exceed 160 characters'),
});

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

export const EditProfileModal = ({ user, onClose }: EditProfileModalProps) => {
  const updateProfile = useUserStore((state) => state.updateProfile);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);

  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl || AVATAR_PRESETS[0]);
  const [dicebearStyle, setDicebearStyle] = useState('adventurer');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      username: user.username,
      avatarUrl: user.avatarUrl || AVATAR_PRESETS[0],
      bio: user.bio || '',
    },
  });

  useEffect(() => {
    setValue('avatarUrl', selectedAvatar);
  }, [selectedAvatar, setValue]);

  const generateDicebear = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const randomStyle = DICEBEAR_STYLES[Math.floor(Math.random() * DICEBEAR_STYLES.length)];
    setDicebearStyle(randomStyle);
    const newAvatar = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
    setSelectedAvatar(newAvatar);
  };

  const handlePresetSelect = (url: string) => {
    setSelectedAvatar(url);
  };

  const onSubmit = async (data: EditProfileInput) => {
    const success = await updateProfile(data);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal box */}
      <div className="relative w-full max-w-lg z-10 glass rounded-3xl p-6 md:p-8 shadow-2xl dark:shadow-black/50 border border-white/20 dark:border-zinc-800/80 animate-scale-up text-left overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white m-0">Edit Profile</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Avatar Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-discord-text/90">
              Lựa chọn hình đại diện
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start bg-gray-50/50 dark:bg-discord-black/20 p-4 rounded-2xl border border-gray-150 dark:border-zinc-850/60">

              {/* Current Preview */}
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500 bg-zinc-200 shrink-0">
                {selectedAvatar.endsWith('.svg') ? (
                  <object
                    data={selectedAvatar}
                    type="image/svg+xml"
                    className="w-full h-full object-cover"
                    aria-label="Avatar preview"
                  />
                ) : (
                  <img
                    src={selectedAvatar}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Picker tools */}
              <div className="flex-1 space-y-3 w-full">
                {/* Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Presets</span>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_PRESETS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePresetSelect(url)}
                        className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${selectedAvatar === url ? 'border-indigo-600 dark:border-discord-blurple' : 'border-transparent'
                          }`}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dicebear Generator */}
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={generateDicebear}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-discord-blurple border border-indigo-500/20 transition-all duration-200"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Avatar</span>
                  </button>
                  <span className="text-[10px] text-gray-400 dark:text-discord-muted">
                    Style: <span className="font-semibold text-gray-650 dark:text-zinc-350">{dicebearStyle}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Custom URL Input */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-400">Hoặc dán link hình ảnh (dưới 250 ký tự)</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  value={selectedAvatar}
                  onChange={(e) => setSelectedAvatar(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/60 dark:bg-discord-black/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-discord-blurple/20 focus:border-indigo-600 dark:focus:border-discord-blurple transition-all duration-200"
                />
              </div>
              {errors.avatarUrl && (
                <p className="text-xs text-rose-500 font-medium pl-1 mt-0.5">{errors.avatarUrl.message}</p>
              )}
            </div>
          </div>

          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-discord-text/90">
              Tên hiển thị
            </label>
            <input
              type="text"
              disabled={isLoading}
              placeholder="Tên hiển thị"
              {...register('username')}
              className={`w-full px-4 py-2.5 rounded-xl border bg-white/60 dark:bg-discord-black/40 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${errors.username
                ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                : 'border-gray-200 dark:border-zinc-800 focus:ring-indigo-500/20 dark:focus:ring-discord-blurple/20 focus:border-indigo-600 dark:focus:border-discord-blurple'
                }`}
            />
            {errors.username && (
              <p className="text-xs text-rose-500 font-medium pl-1 mt-0.5">{errors.username.message}</p>
            )}
          </div>

          {/* Bio Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-discord-text/90">
              Giới thiệu bản thân
            </label>
            <textarea
              disabled={isLoading}
              rows={3}
              placeholder="Tell us about yourself..."
              {...register('bio')}
              className={`w-full px-4 py-2.5 rounded-xl border bg-white/60 dark:bg-discord-black/40 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${errors.bio
                ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
                : 'border-gray-200 dark:border-zinc-800 focus:ring-indigo-500/20 dark:focus:ring-discord-blurple/20 focus:border-indigo-600 dark:focus:border-discord-blurple'
                }`}
            />
            {errors.bio && (
              <p className="text-xs text-rose-500 font-medium pl-1 mt-0.5">{errors.bio.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-150 dark:border-zinc-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-gray-150 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-750 dark:bg-discord-blurple dark:hover:bg-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditProfileModal;
