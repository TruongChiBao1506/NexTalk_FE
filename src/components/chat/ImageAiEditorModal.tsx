import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Loader2, Send, Sparkles, X } from 'lucide-react';
import {
  imageEditService,
  type ImageEditOperation,
  type ImageEditOptions,
  type ImageEditResult,
} from '../../services/imageEditService';

export interface ImageEditTarget {
  messageId: string;
  url: string;
  name?: string | null;
}

interface ImageAiEditorModalProps {
  target: ImageEditTarget;
  onClose: () => void;
  onSend: (result: ImageEditResult) => Promise<boolean> | boolean;
}

const operations: Array<{ value: ImageEditOperation; label: string; hint: string }> = [
  { value: 'REMOVE', label: 'Xóa vật thể', hint: 'Xóa người hoặc đồ vật khỏi ảnh' },
  { value: 'REPLACE', label: 'Thay vật thể', hint: 'Đổi một vật thể thành vật thể khác' },
  { value: 'RECOLOR', label: 'Đổi màu', hint: 'Đổi màu một phần cụ thể của ảnh' },
  { value: 'BACKGROUND_REPLACE', label: 'Đổi nền', hint: 'Tạo một phông nền mới bằng AI' },
  { value: 'FILL', label: 'Mở rộng ảnh', hint: 'Mở rộng ảnh theo tỷ lệ mới' },
  { value: 'RESTORE', label: 'Khôi phục', hint: 'Giảm nhiễu và làm rõ ảnh cũ' },
];

const initialForm = {
  subject: '',
  replacement: '',
  color: '#4F46E5',
  prompt: '',
  aspectRatio: '16:9' as const,
};

export const ImageAiEditorModal = ({ target, onClose, onSend }: ImageAiEditorModalProps) => {
  const [operation, setOperation] = useState<ImageEditOperation>('REMOVE');
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<ImageEditResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isEditing && !isSending) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isEditing, isSending, onClose]);

  const canEdit = useMemo(() => {
    if (operation === 'RESTORE') return true;
    if (operation === 'REMOVE') return form.subject.trim().length >= 2;
    if (operation === 'REPLACE') {
      return form.subject.trim().length >= 2 && form.replacement.trim().length >= 2;
    }
    if (operation === 'RECOLOR') {
      return form.subject.trim().length >= 2 && /^#[0-9a-f]{6}$/i.test(form.color);
    }
    if (operation === 'BACKGROUND_REPLACE') return form.prompt.trim().length >= 2;
    return Boolean(form.aspectRatio);
  }, [form, operation]);

  const buildOptions = (): ImageEditOptions => {
    if (operation === 'REMOVE') return { operation, subject: form.subject.trim() };
    if (operation === 'REPLACE') {
      return {
        operation,
        subject: form.subject.trim(),
        replacement: form.replacement.trim(),
      };
    }
    if (operation === 'RECOLOR') {
      return { operation, subject: form.subject.trim(), color: form.color };
    }
    if (operation === 'BACKGROUND_REPLACE') {
      return { operation, prompt: form.prompt.trim() };
    }
    if (operation === 'FILL') {
      return {
        operation,
        prompt: form.prompt.trim() || undefined,
        aspectRatio: form.aspectRatio,
      };
    }
    return { operation };
  };

  const editImage = async () => {
    if (!canEdit || isEditing) return;
    setIsEditing(true);
    setError(null);
    try {
      const response = await imageEditService.edit(target.messageId, target.url, buildOptions());
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Không thể chỉnh sửa ảnh.');
      }
      setResult(response.data);
    } catch (caught) {
      const message = axios.isAxiosError<{ message?: string }>(caught)
        ? caught.response?.data?.message || 'Không thể chỉnh sửa ảnh.'
        : caught instanceof Error ? caught.message : 'Không thể chỉnh sửa ảnh.';
      setError(message);
    } finally {
      setIsEditing(false);
    }
  };

  const sendResult = async () => {
    if (!result || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      if (await onSend(result)) onClose();
      else setError('Không thể gửi ảnh đã chỉnh sửa.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể gửi ảnh đã chỉnh sửa.');
    } finally {
      setIsSending(false);
    }
  };

  const updateForm = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" aria-label="Đóng" className="absolute inset-0 cursor-default" onClick={() => !isEditing && !isSending && onClose()} />
      <div className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="m-0 text-base font-bold text-gray-950 dark:text-white">Chỉnh sửa ảnh bằng AI</h2>
              <p className="m-0 mt-0.5 text-xs text-gray-500 dark:text-zinc-400">Cloudinary sẽ tạo một bản sao; ảnh gốc không bị thay đổi.</p>
            </div>
          </div>
          <button type="button" aria-label="Đóng" disabled={isEditing || isSending} onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.35fr_1fr]">
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <figure className="m-0">
              <figcaption className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Ảnh gốc</figcaption>
              <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 dark:bg-black">
                <img src={target.url} alt={target.name || 'Ảnh gốc'} className="max-h-[58vh] w-full object-contain" />
              </div>
            </figure>
            <figure className="m-0">
              <figcaption className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Kết quả AI</figcaption>
              <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900">
                {result ? (
                  <img src={result.url} alt="Ảnh đã chỉnh sửa" className="max-h-[58vh] w-full object-contain" />
                ) : isEditing ? (
                  <div className="flex flex-col items-center gap-3 px-6 text-center text-indigo-600 dark:text-indigo-300">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm font-semibold">Cloudinary đang tạo ảnh, quá trình này có thể mất một lúc…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 px-6 text-center text-gray-400 dark:text-zinc-500">
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-sm">Chọn thao tác và điền thông tin để xem kết quả.</span>
                  </div>
                )}
              </div>
            </figure>
          </div>

          <div className="border-t border-gray-200 p-5 dark:border-zinc-800 lg:border-l lg:border-t-0">
            <label className="mb-2 block text-sm font-semibold text-gray-800 dark:text-zinc-200" htmlFor="image-ai-operation">Thao tác</label>
            <select
              id="image-ai-operation"
              value={operation}
              disabled={isEditing || isSending}
              onChange={(event) => {
                setOperation(event.target.value as ImageEditOperation);
                setResult(null);
                setError(null);
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              {operations.map((item) => <option key={item.value} value={item.value}>{item.label} — {item.hint}</option>)}
            </select>

            <div className="mt-4 space-y-4">
              {(operation === 'REMOVE' || operation === 'REPLACE' || operation === 'RECOLOR') && (
                <Field label={operation === 'REMOVE' ? 'Vật thể cần xóa' : operation === 'REPLACE' ? 'Vật thể cần thay' : 'Vật thể cần đổi màu'}>
                  <input
                    value={form.subject}
                    maxLength={200}
                    disabled={isEditing || isSending}
                    onChange={(event) => updateForm('subject', event.target.value)}
                    placeholder="Ví dụ: người đứng phía sau"
                    className={inputClass}
                  />
                </Field>
              )}

              {operation === 'REPLACE' && (
                <Field label="Thay bằng">
                  <input
                    value={form.replacement}
                    maxLength={200}
                    disabled={isEditing || isSending}
                    onChange={(event) => updateForm('replacement', event.target.value)}
                    placeholder="Ví dụ: một chậu cây"
                    className={inputClass}
                  />
                </Field>
              )}

              {operation === 'RECOLOR' && (
                <Field label="Màu mới">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.color}
                      disabled={isEditing || isSending}
                      onChange={(event) => updateForm('color', event.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-xl border border-gray-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <input
                      value={form.color}
                      maxLength={7}
                      disabled={isEditing || isSending}
                      onChange={(event) => updateForm('color', event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </Field>
              )}

              {(operation === 'BACKGROUND_REPLACE' || operation === 'FILL') && (
                <Field label={operation === 'BACKGROUND_REPLACE' ? 'Mô tả nền mới' : 'Gợi ý phần ảnh mở rộng (không bắt buộc)'}>
                  <textarea
                    value={form.prompt}
                    maxLength={500}
                    rows={3}
                    disabled={isEditing || isSending}
                    onChange={(event) => updateForm('prompt', event.target.value)}
                    placeholder={operation === 'BACKGROUND_REPLACE' ? 'Ví dụ: bãi biển lúc hoàng hôn' : 'Ví dụ: tiếp tục bầu trời và đồng cỏ'}
                    className={`${inputClass} resize-none`}
                  />
                </Field>
              )}

              {operation === 'FILL' && (
                <Field label="Tỷ lệ ảnh mới">
                  <select
                    value={form.aspectRatio}
                    disabled={isEditing || isSending}
                    onChange={(event) => updateForm('aspectRatio', event.target.value)}
                    className={inputClass}
                  >
                    <option value="1:1">1:1 — Vuông</option>
                    <option value="16:9">16:9 — Ngang</option>
                    <option value="9:16">9:16 — Dọc</option>
                    <option value="4:3">4:3 — Ngang</option>
                    <option value="3:4">3:4 — Dọc</option>
                  </select>
                </Field>
              )}

              {operation === 'RESTORE' && (
                <p className="m-0 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200">
                  Cloudinary sẽ giảm nhiễu, giảm lỗi nén và làm nét ảnh. Không cần nhập mô tả.
                </p>
              )}
            </div>

            {error && <p className="m-0 mt-3 text-sm font-medium text-rose-600 dark:text-rose-300">{error}</p>}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" disabled={isEditing || isSending} onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800">Hủy</button>
              <button
                type="button"
                disabled={!canEdit || isEditing || isSending}
                onClick={() => void editImage()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-100 px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500/15 dark:text-indigo-300"
              >
                {isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {result ? 'Tạo lại' : 'Chỉnh sửa'}
              </button>
              {result && (
                <button
                  type="button"
                  disabled={isEditing || isSending}
                  onClick={() => void sendResult()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Gửi ảnh
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputClass = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-zinc-300">{label}</span>
    {children}
  </label>
);
