import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { AlertCircle, Camera, CheckCircle2, Loader2, ScanQrCode, X } from 'lucide-react';
import { authService } from '../../services/authService';

type ScanStatus = 'starting' | 'scanning' | 'confirming' | 'success' | 'error';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const extractQrToken = (rawValue: string) => {
  const value = rawValue.trim();
  if (!value) return null;

  try {
    const parsedUrl = new URL(value);
    return parsedUrl.searchParams.get('token')?.trim() || null;
  } catch {
    return value;
  }
};

export const QrScannerModal = ({ isOpen, onClose }: QrScannerModalProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const handledResultRef = useRef(false);
  const [status, setStatus] = useState<ScanStatus>('starting');
  const [message, setMessage] = useState('Đưa mã QR đăng nhập trên máy tính vào khung quét.');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const reader = new BrowserQRCodeReader();
    handledResultRef.current = false;
    setStatus('starting');
    setMessage('Đang mở camera...');

    const stopScanner = () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };

    const confirmScannedToken = async (rawValue: string, controls: IScannerControls) => {
      if (handledResultRef.current) return;
      handledResultRef.current = true;
      controls.stop();
      controlsRef.current = null;

      const qrToken = extractQrToken(rawValue);
      if (!qrToken) {
        if (!isMounted) return;
        handledResultRef.current = false;
        setStatus('error');
        setMessage('Mã QR không hợp lệ. Vui lòng quét lại mã đăng nhập NexTalk.');
        return;
      }

      if (!isMounted) return;
      setStatus('confirming');
      setMessage('Đã nhận mã QR, đang xác nhận đăng nhập...');

      try {
        const response = await authService.confirmQrLogin(qrToken);
        if (!isMounted) return;

        if (response.success) {
          setStatus('success');
          setMessage('Đã xác nhận đăng nhập trên thiết bị khác.');
        } else {
          handledResultRef.current = false;
          setStatus('error');
          setMessage(response.message || 'Không thể xác nhận mã QR. Vui lòng thử lại.');
        }
      } catch (error: any) {
        if (!isMounted) return;
        handledResultRef.current = false;
        setStatus('error');
        setMessage(error.response?.data?.message || 'Mã QR không hợp lệ hoặc đã hết hạn.');
      }
    };

    const startScanner = async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current ?? undefined,
          (result, error, callbackControls) => {
            if (result) {
              void confirmScannedToken(result.getText(), callbackControls);
              return;
            }

            if (error && error.name !== 'NotFoundException') {
              console.debug('QR scan error', error);
            }
          }
        );

        if (!isMounted) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setStatus('scanning');
        setMessage('Đưa mã QR đăng nhập trên máy tính vào khung quét.');
      } catch (error) {
        if (!isMounted) return;
        const fallbackMessage = error instanceof Error && error.name === 'NotAllowedError'
          ? 'Bạn cần cấp quyền camera để quét mã QR.'
          : 'Không thể mở camera. Hãy kiểm tra quyền camera hoặc thử lại trên trình duyệt khác.';
        setStatus('error');
        setMessage(fallbackMessage);
      }
    };

    void startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isBusy = status === 'starting' || status === 'confirming';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-4 text-gray-950 shadow-2xl dark:bg-discord-mid dark:text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <ScanQrCode className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="m-0 text-base font-bold">Quét mã QR đăng nhập</h3>
            <p className="m-0 mt-1 text-sm text-gray-500 dark:text-zinc-400">
              Mở NexTalk trên máy tính, chọn đăng nhập bằng QR rồi dùng camera này để quét.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-white"
            title="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative aspect-[3/4] max-h-[62vh] overflow-hidden rounded-2xl bg-zinc-950">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            autoPlay
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-56 w-56 rounded-3xl border-2 border-white/85 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
          </div>
          {isBusy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm font-semibold">{status === 'starting' ? 'Đang mở camera...' : 'Đang xác nhận...'}</span>
            </div>
          )}
          {isSuccess && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-950/80 text-white">
              <CheckCircle2 className="h-12 w-12 text-emerald-300" />
              <span className="text-sm font-semibold">Thành công</span>
            </div>
          )}
        </div>

        <div className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${
          isSuccess
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
            : isError
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200'
              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200'
        }`}>
          {isSuccess ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : isError ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <Camera className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{message}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          {isSuccess ? 'Hoàn tất' : 'Đóng'}
        </button>
      </div>
    </div>
  );
};

export default QrScannerModal;
