import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useChatStore } from '../../store/chatStore';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
}

const REPORT_REASONS = [
  'Spam hoặc lừa đảo',
  'Ngôn từ thù ghét hoặc quấy rối',
  'Nội dung không phù hợp',
  'Lý do khác'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const activeConversation = useChatStore((state) => state.activeConversation);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await reportService.createReport({
        reportedUserId,
        conversationId: activeConversation?.id,
        reason: selectedReason,
        description: description.trim()
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedReason(REPORT_REASONS[0]);
        setDescription('');
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Failed to submit report', error);
      // Fallback for error if any (can show toast)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[90%] max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Báo cáo vi phạm
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
              <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Đã gửi báo cáo
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hệ thống AI sẽ tự động phân tích cuộc trò chuyện của bạn và {reportedUserName} để đưa ra biện pháp xử lý. Cảm ơn bạn!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Bạn đang báo cáo <span className="font-semibold text-rose-500">{reportedUserName}</span>. Hành động này sẽ được AI kiểm duyệt dựa trên lịch sử nhắn tin gần nhất.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lý do báo cáo
                </label>
                <div className="grid gap-2">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        selectedReason === reason
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                          : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="h-4 w-4 text-rose-500 accent-rose-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mô tả thêm (Tùy chọn)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cung cấp thêm chi tiết..."
                  className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-transparent p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          )}
        </div>

        {!isSuccess && (
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center justify-center rounded-lg bg-rose-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Gửi báo cáo'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
