import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Hash, Volume2, Lock, X, Trash2, Check, Search } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import type { ChannelResponse } from '../../types/group';

const schema = z.object({
  name: z.string().min(1, 'Tên kênh không được để trống').max(50, 'Tên kênh quá dài'),
  type: z.enum(['TEXT', 'VOICE']),
  isPrivate: z.boolean(),
  isTaskEnabled: z.boolean().optional(),
  memberIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

interface ChannelSettingsModalProps {
  groupId: string;
  channel: ChannelResponse;
  onClose: () => void;
}

export default function ChannelSettingsModal({ groupId, channel, onClose }: ChannelSettingsModalProps) {
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { upsertGroup, groups } = useGroupStore();
  const { user } = useAuthStore();
  const { conversations } = useChatStore();

  const group = groups.find(g => g.id === groupId);
  const conversation = conversations.find(c => c.id === channel.conversationId);
  
  const allMembers = group?.members.filter(m => m.userId !== user?.id) || [];
  const members = allMembers.filter(m => 
    m.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const existingMemberIds = conversation?.members.map(m => m.id) || [];
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: channel.name,
      type: channel.type === 'VOICE' ? 'VOICE' : 'TEXT',
      isPrivate: Boolean(channel.isPrivate ?? (channel as any).private),
      isTaskEnabled: Boolean(channel.isTaskEnabled ?? false),
      memberIds: existingMemberIds,
    },
  });

  useEffect(() => {
    reset({
      name: channel.name,
      type: channel.type === 'VOICE' ? 'VOICE' : 'TEXT',
      isPrivate: Boolean(channel.isPrivate ?? (channel as any).private),
      isTaskEnabled: Boolean(channel.isTaskEnabled ?? false),
      memberIds: existingMemberIds,
    });
  }, [channel, reset, existingMemberIds.length]);

  const channelType = watch('type');
  const isPrivate = watch('isPrivate');

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await groupService.updateChannel(groupId, channel.id, data);
      
      const updatedGroupResponse = await groupService.getGroup(groupId);
      if (updatedGroupResponse.success && updatedGroupResponse.data) {
        upsertGroup(updatedGroupResponse.data);
      }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật kênh. Vui lòng thử lại.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kênh này không? Hành động này không thể hoàn tác.')) return;
    try {
      setIsDeleting(true);
      setError('');
      await groupService.deleteChannel(groupId, channel.id);
      
      const updatedGroupResponse = await groupService.getGroup(groupId);
      if (updatedGroupResponse.success && updatedGroupResponse.data) {
        upsertGroup(updatedGroupResponse.data);
      }
      
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xóa kênh. Vui lòng thử lại.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[scaleIn_0.2s_ease-out]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white m-0">Cài đặt kênh</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 m-0">Chỉnh sửa thông tin hoặc xóa kênh</p>
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

          <div>
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  Quản lý công việc
                </span>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-[280px]">
                  Bật tab Công việc cho riêng kênh này.
                </p>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-discord-blurple dark:focus-within:ring-offset-zinc-900">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  {...register('isTaskEnabled')}
                />
                <div className={`h-6 w-11 rounded-full transition-colors ${watch('isTaskEnabled') ? 'bg-indigo-600 dark:bg-discord-blurple' : 'bg-gray-200 dark:bg-zinc-700'}`}></div>
                <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${watch('isTaskEnabled') ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </label>
          </div>

          {isPrivate && allMembers.length > 0 && (
            <div className="animate-[fadeIn_0.2s_ease-out] flex flex-col gap-3">
              <label className="block text-xs font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                Chọn thành viên
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thành viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-zinc-900/50 dark:border-zinc-700/50 dark:text-white dark:focus:ring-discord-blurple transition text-sm"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-zinc-700/50 rounded-xl divide-y divide-gray-100 dark:divide-zinc-800/50 bg-white dark:bg-zinc-900/20">
                {members.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-zinc-400">
                    Không tìm thấy thành viên nào.
                  </div>
                ) : (
                  members.map(member => {
                    const isSelected = watch('memberIds')?.includes(member.userId);
                    return (
                      <label key={member.userId} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            value={member.userId}
                            {...register('memberIds')}
                            className="peer sr-only"
                          />
                          <div className={`w-5 h-5 rounded border ${isSelected ? 'bg-indigo-600 border-indigo-600 dark:bg-discord-blurple dark:border-discord-blurple' : 'border-gray-300 dark:border-zinc-600'} flex items-center justify-center transition-colors`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.username} className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-discord-blurple/20 text-indigo-600 dark:text-discord-blurple flex items-center justify-center text-xs font-bold shrink-0">
                              {member.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.username}</span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
              className="py-2.5 px-4 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition flex items-center justify-center disabled:opacity-50"
              title="Xóa kênh"
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDeleting}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-discord-blurple dark:hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
