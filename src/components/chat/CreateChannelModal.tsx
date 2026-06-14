import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Hash, Volume2, Lock, X } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { useGroupStore } from '../../store/groupStore';

const schema = z.object({
  name: z.string().min(1, 'Tên kênh không được để trống').max(50, 'Tên kênh quá dài'),
  type: z.enum(['TEXT', 'VOICE']),
  isPrivate: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface CreateChannelModalProps {
  groupId: string;
  onClose: () => void;
}

export default function CreateChannelModal({ groupId, onClose }: CreateChannelModalProps) {
  const [error, setError] = useState('');
  const { upsertGroup } = useGroupStore();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'TEXT',
      isPrivate: false,
    },
  });

  const channelType = watch('type');
  const isPrivate = watch('isPrivate');

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await groupService.createChannel(groupId, data);
      
      // We must fetch the updated group to get its new channels
      const updatedGroupResponse = await groupService.getGroup(groupId);
      if (updatedGroupResponse.success && updatedGroupResponse.data) {
        upsertGroup(updatedGroupResponse.data);
      }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo kênh. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[scaleIn_0.2s_ease-out]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white m-0">Tạo kênh mới</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 m-0">Thêm một không gian thảo luận mới cho nhóm</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Loại kênh
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('type', 'TEXT')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition ${
                  channelType === 'TEXT'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-discord-blurple dark:bg-discord-blurple/10 dark:text-discord-blurple'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <Hash className="w-6 h-6" />
                <span className="font-semibold text-sm">Kênh Text</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'VOICE')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition ${
                  channelType === 'VOICE'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-discord-blurple dark:bg-discord-blurple/10 dark:text-discord-blurple'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <Volume2 className="w-6 h-6" />
                <span className="font-semibold text-sm">Kênh Voice</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-2" htmlFor="name">
              Tên kênh
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-gray-400 dark:text-zinc-500">
                {channelType === 'VOICE' ? <Volume2 className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
              </div>
              <input
                id="name"
                type="text"
                {...register('name')}
                placeholder={channelType === 'VOICE' ? 'phong-hop-1' : 'thao-luan-chung'}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-zinc-900 dark:border-zinc-700 dark:text-white dark:focus:ring-discord-blurple transition"
              />
            </div>
            {errors.name && <p className="mt-1.5 text-xs text-rose-500 font-medium">{errors.name.message}</p>}
          </div>

          <div>
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <Lock className="w-4 h-4 text-gray-500" /> Kênh riêng tư
                </span>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-[280px]">
                  Chỉ những thành viên được chọn mới có thể xem và tham gia kênh này.
                </p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-discord-blurple dark:focus-within:ring-offset-zinc-900">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  {...register('isPrivate')}
                />
                <div className={`h-6 w-11 rounded-full transition-colors ${isPrivate ? 'bg-indigo-600 dark:bg-discord-blurple' : 'bg-gray-200 dark:bg-zinc-700'}`}></div>
                <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </label>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-discord-blurple dark:hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo kênh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
