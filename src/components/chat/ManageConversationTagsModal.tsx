import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Tag as TagIcon, Loader2 } from 'lucide-react';
import type { ConversationTag } from '../../services/conversationTagService';

interface ManageConversationTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: ConversationTag[];
  onCreateTag: (name: string, color: string) => Promise<void>;
  onUpdateTag: (tagId: string, name: string, color: string) => Promise<void>;
  onDeleteTag: (tagId: string) => Promise<void>;
}

const PRESET_COLORS = [
  { name: 'Đỏ', hex: '#EF4444' },
  { name: 'Hồng', hex: '#EC4899' },
  { name: 'Cam', hex: '#F97316' },
  { name: 'Vàng', hex: '#EAB308' },
  { name: 'Xanh lá', hex: '#22C55E' },
  { name: 'Xanh dương', hex: '#3B82F6' },
  { name: 'Tím', hex: '#8B5CF6' },
  { name: 'Xám', hex: '#6B7280' },
];

export const ManageConversationTagsModal: React.FC<ManageConversationTagsModalProps> = ({
  isOpen,
  onClose,
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}) => {
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagName, setTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].hex);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingTagId(null);
    setTagName('');
    setSelectedColor(PRESET_COLORS[0].hex);
    setErrorMsg(null);
  };

  const handleStartEdit = (tag: ConversationTag) => {
    setEditingTagId(tag.id);
    setTagName(tag.name);
    setSelectedColor(tag.color);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setErrorMsg('Vui lòng nhập tên thẻ');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      if (editingTagId) {
        await onUpdateTag(editingTagId, tagName.trim(), selectedColor);
      } else {
        await onCreateTag(tagName.trim(), selectedColor);
      }
      handleStartCreate();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Không thể lưu thẻ phân loại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thẻ phân loại này?')) return;
    setIsSubmitting(true);
    try {
      await onDeleteTag(tagId);
      if (editingTagId === tagId) handleStartCreate();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Không thể xóa thẻ phân loại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white m-0">Quản lý thẻ phân loại</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Create/Edit Form */}
          <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-200/80 dark:border-zinc-700/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 m-0">
              {editingTagId ? 'Chỉnh sửa thẻ' : 'Thêm thẻ mới'}
            </h4>

            <div>
              <input
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Tên thẻ (ví dụ: Khách hàng, Gia đình...)"
                maxLength={50}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Color selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Màu sắc đại diện</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setSelectedColor(color.hex)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-110 relative"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {selectedColor === color.hex && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium m-0">{errorMsg}</p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingTagId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingTagId ? 'Cập nhật' : 'Thêm mới'}</span>
              </button>

              {editingTagId && (
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition"
                >
                  Hủy sửa
                </button>
              )}
            </div>
          </form>

          {/* List of Tags */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 m-0">Danh sách thẻ hiện có ({tags.length})</h4>
            {tags.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">Chưa có thẻ phân loại nào.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between py-2.5 px-1 hover:bg-gray-50 dark:hover:bg-zinc-800/40 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{tag.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(tag)}
                        className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition"
                        title="Sửa thẻ"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(tag.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition"
                        title="Xóa thẻ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
