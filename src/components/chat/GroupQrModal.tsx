import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ConversationResponse } from '../../types/chat';

interface GroupQrModalProps {
  group: ConversationResponse | null;
  onClose: () => void;
}

export const GroupQrModal = ({ group, onClose }: GroupQrModalProps) => {
  if (!group || !(group as any).inviteCode) return null;

  const qrValue = `nextalk://g/${(group as any).inviteCode}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-discord-mid dark:text-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-gray-100 p-1.5 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white">Mã QR nhóm</h3>
        <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-6 px-4 leading-relaxed">
          Sử dụng tính năng quét QR trên ứng dụng NexTalk (mobile) để quét mã này và tham gia nhóm nhanh chóng.
        </p>

        <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-100 dark:ring-zinc-800">
          <QRCodeSVG
            value={qrValue}
            size={200}
            bgColor="#ffffff"
            fgColor="#020617"
            level="H"
            includeMargin={false}
          />
        </div>

        <p className="mt-6 text-sm font-bold text-indigo-600 dark:text-indigo-400">
          Mã mời: {(group as any).inviteCode}
        </p>
      </div>
    </div>
  );
};
