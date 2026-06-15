import { useState } from 'react';
import { X, Plus, ListChecks } from 'lucide-react';

export interface CreatePollData {
  question: string;
  options: string[];
  allowMultiple: boolean;
  allowAddOptions: boolean;
  anonymous: boolean;
  expiresAt: string | null;
}

interface CreatePollModalProps {
  onSubmit: (data: CreatePollData) => Promise<void>;
  onClose: () => void;
}

export const CreatePollModal = ({
  onSubmit,
  onClose,
}: CreatePollModalProps) => {
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [pollAllowAddOptions, setPollAllowAddOptions] = useState(false);
  const [pollAnonymous, setPollAnonymous] = useState(false);
  const [pollExpiresAt, setPollExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        question: pollQuestion,
        options: pollOptions,
        allowMultiple: pollAllowMultiple,
        allowAddOptions: pollAllowAddOptions,
        anonymous: pollAnonymous,
        expiresAt: pollExpiresAt ? pollExpiresAt : null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-5 text-gray-900 shadow-2xl dark:bg-discord-mid dark:text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="m-0 flex items-center gap-2 text-lg font-bold">
            <ListChecks className="h-5 w-5 text-indigo-600" />
            Tạo bình chọn
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={pollQuestion}
            onChange={(event) => setPollQuestion(event.target.value)}
            placeholder="Câu hỏi bình chọn"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />

          <div className="space-y-2">
            {pollOptions.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={option}
                  onChange={(event) => setPollOptions((options) => options.map((item, i) => i === index ? event.target.value : item))}
                  placeholder={`Lựa chọn ${index + 1}`}
                  className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions((options) => options.filter((_, i) => i !== index))}
                    className="rounded-xl px-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPollOptions((options) => [...options, ''])}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm lựa chọn
            </button>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-zinc-900">
              <input type="checkbox" checked={pollAllowMultiple} onChange={(event) => setPollAllowMultiple(event.target.checked)} />
              <span>Chọn nhiều phương án</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-zinc-900">
              <input type="checkbox" checked={pollAllowAddOptions} onChange={(event) => setPollAllowAddOptions(event.target.checked)} />
              <span>Cho thêm lựa chọn</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 dark:bg-zinc-900">
              <input type="checkbox" checked={pollAnonymous} onChange={(event) => setPollAnonymous(event.target.checked)} />
              <span>Ẩn người bình chọn</span>
            </label>
            <label className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-zinc-900">
              <span className="mb-1 block text-xs font-semibold text-gray-500 dark:text-zinc-400">Thời hạn khóa</span>
              <input
                type="datetime-local"
                value={pollExpiresAt}
                onChange={(event) => setPollExpiresAt(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo bình chọn'}
          </button>
        </div>
      </div>
    </div>
  );
};
