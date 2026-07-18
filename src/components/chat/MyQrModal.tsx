import { RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { User as AuthUser } from '../../types/auth';
import { userService } from '../../services/userService';

interface MyQrModalProps {
  user: AuthUser | null;
  onClose: () => void;
}

export const MyQrModal = ({ user, onClose }: MyQrModalProps) => {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setLoading(true);
    userService.getProfileQr()
      .then((response) => {
        setQrToken(response.data?.token ?? null);
        setEnabled(response.data?.enabled ?? true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const qrValue = qrToken ? `nextalk://u/${qrToken}` : null;

  const rotateQr = async () => {
    setLoading(true);
    try {
      const response = await userService.rotateProfileQr();
      setQrToken(response.data?.token ?? null);
      setEnabled(response.data?.enabled ?? true);
    } finally {
      setLoading(false);
    }
  };

  const toggleQr = async () => {
    setLoading(true);
    try {
      const response = await userService.setProfileQrEnabled(!enabled);
      setEnabled(response.data?.enabled ?? !enabled);
    } finally {
      setLoading(false);
    }
  };

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

        <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white">Mã QR của tôi</h3>
        <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-6 px-4 leading-relaxed">
          Đưa mã này cho bạn bè quét bằng tính năng quét QR trong app di động để thêm bạn.
        </p>

        <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-100 dark:ring-zinc-800">
          {qrValue && enabled && !loading ? <QRCodeSVG
            value={qrValue}
            size={200}
            bgColor="#ffffff"
            fgColor="#020617"
            level="H"
            includeMargin={false}
          /> : <div className="flex h-[200px] w-[200px] items-center justify-center text-sm font-semibold text-slate-500">{loading ? 'Đang tạo mã QR...' : 'Mã QR đang tắt'}</div>}
        </div>

        <p className="mt-6 text-lg font-bold text-indigo-600 dark:text-indigo-400">
          @{user.username}
        </p>
        <button type="button" disabled={loading} onClick={() => void rotateQr()} className="mx-auto mt-3 flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-600 disabled:opacity-50 dark:bg-indigo-500/10 dark:text-indigo-300">
          <RefreshCw className="h-4 w-4" /> Tạo mã QR mới
        </button>
        <button type="button" disabled={loading} onClick={() => void toggleQr()} className="mx-auto mt-2 text-sm font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-50 dark:text-zinc-400">
          {enabled ? 'Tắt tìm bằng QR' : 'Bật tìm bằng QR'}
        </button>
      </div>
    </div>
  );
};
