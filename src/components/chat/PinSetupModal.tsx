import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

interface PinSetupModalProps {
  pendingHideId: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinSetupModal = ({
  pendingHideId,
  onSuccess,
  onClose,
}: PinSetupModalProps) => {
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [pinValue, setPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toggleHideConversation, fetchConversations } = useChatStore(state => ({
    toggleHideConversation: state.toggleHideConversation,
    fetchConversations: state.fetchConversations,
  }));

  const handlePinSubmit = async () => {
    if (pinStep === 'enter') {
      if (!pinValue.match(/^\d{4}$/)) {
        setPinError('Mã PIN phải gồm đúng 4 chữ số.');
        return;
      }
      setPinStep('confirm');
      setPinError('');
    } else {
      if (pinValue !== confirmPinValue) {
        setPinError('Mã PIN xác nhận không trùng khớp.');
        return;
      }
      setIsSubmitting(true);
      try {
        const response = await userService.setupChatPin(pinValue);
        if (response.success && response.data) {
          useAuthStore.getState().updateUser(response.data);
          if (pendingHideId) {
            await toggleHideConversation(pendingHideId, true);
            await fetchConversations();
          }
          onSuccess();
        } else {
          setPinError(response.message || 'Lỗi khi thiết lập PIN.');
        }
      } catch (err: any) {
        setPinError(err.response?.data?.message || 'Không thể thiết lập PIN.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-zinc-800">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Thiết lập mã PIN
        </h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 text-center">
          {pinStep === 'enter'
            ? 'Nhập mã PIN gồm 4 chữ số để ẩn cuộc trò chuyện này. Mã PIN này sẽ dùng chung cho tất cả cuộc trò chuyện bị ẩn.'
            : 'Vui lòng nhập lại mã PIN để xác nhận.'}
        </p>

        <div className="flex justify-center mb-6">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((index) => {
              const currentValue = pinStep === 'enter' ? pinValue : confirmPinValue;
              const setFn = pinStep === 'enter' ? setPinValue : setConfirmPinValue;
              const inputId = `setup-pin-${pinStep}-${index}`;
              return (
                <input
                  key={index}
                  id={inputId}
                  type="password"
                  maxLength={1}
                  autoFocus={index === 0 && !currentValue}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={currentValue[index] || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val) {
                      const newVal = currentValue.substring(0, index) + val + currentValue.substring(index + 1);
                      setFn(newVal.slice(0, 4));
                      setPinError('');
                      if (index < 3) {
                        document.getElementById(`setup-pin-${pinStep}-${index + 1}`)?.focus();
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      if (!currentValue[index] && index > 0) {
                        const newVal = currentValue.substring(0, index - 1) + currentValue.substring(index);
                        setFn(newVal);
                        document.getElementById(`setup-pin-${pinStep}-${index - 1}`)?.focus();
                      } else {
                        const newVal = currentValue.substring(0, index) + currentValue.substring(index + 1);
                        setFn(newVal);
                      }
                      setPinError('');
                    } else if (e.key === 'Enter' && currentValue.length === 4) {
                      handlePinSubmit();
                    }
                  }}
                />
              );
            })}
          </div>
        </div>

        {pinError && (
          <p className="text-sm text-rose-500 text-center mt-2 mb-4 font-medium">{pinError}</p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handlePinSubmit}
            disabled={isSubmitting || (pinStep === 'enter' ? pinValue.length !== 4 : confirmPinValue.length !== 4)}
            className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
            {pinStep === 'enter' ? 'Tiếp tục' : 'Xác nhận'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl text-gray-700 dark:text-zinc-300 font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all"
          >
            Hủy
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
