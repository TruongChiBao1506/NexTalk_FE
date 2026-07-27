export interface SensitiveDetectionResult {
  isSensitive: boolean;
  type: 'OTP' | 'CARD' | 'CCCD' | 'PASSWORD' | null;
  title: string;
  message: string;
}

export function detectSensitiveInfo(text: string): SensitiveDetectionResult {
  if (!text || text.trim().length < 4) {
    return { isSensitive: false, type: null, title: '', message: '' };
  }

  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Detect OTP
  const otpPattern = /(?:mã\s*otp|otp|mã\s*xác\s*nhận|passcode)[:\s]*\b\d{4,8}\b/i;
  if (otpPattern.test(cleanText)) {
    return {
      isSensitive: true,
      type: 'OTP',
      title: 'Mã xác thực OTP nhạy cảm',
      message: 'Tuyệt đối không chia sẻ mã OTP cho người khác để tránh bị chiếm đoạt tài khoản.',
    };
  }

  // 2. Detect Bank Card / Credit Card
  const digitsOnly = cleanText.replace(/\D/g, '');
  const bankCardPattern = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|9704[0-9]{12})\b/;
  const isLikelyCard = bankCardPattern.test(cleanText) || (digitsOnly.length >= 15 && digitsOnly.length <= 19 && /(?:thẻ|card|atm|visa|master)/i.test(cleanText));
  if (isLikelyCard) {
    return {
      isSensitive: true,
      type: 'CARD',
      title: 'Thông tin thẻ ngân hàng',
      message: 'Cẩn trọng khi gửi số thẻ/thông tin tài chính trên ứng dụng trò chuyện.',
    };
  }

  // 3. Detect CCCD / CMND
  const cccdPattern = /(?:cccd|cmnd|căn\s*cước|chứng\s*minh|định\s*danh)[:\s]*\b\d{9,12}\b/i;
  if (cccdPattern.test(cleanText)) {
    return {
      isSensitive: true,
      type: 'CCCD',
      title: 'Số Căn cước công dân / CMND',
      message: 'Thông tin định danh cá nhân nhạy cảm. Bạn có thể sử dụng chế độ tin nhắn tự xóa.',
    };
  }

  // 4. Detect Password
  const passwordPattern = /(?:mật\s*khẩu|password|mật\s*khẩu\s*là|pass|mk)[:\s]*([^\s]{4,})/i;
  if (passwordPattern.test(cleanText)) {
    return {
      isSensitive: true,
      type: 'PASSWORD',
      title: 'Mật khẩu tài khoản',
      message: 'Tránh gửi mật khẩu công khai. Đổi mật khẩu ngay nếu gửi nhầm cho người lạ.',
    };
  }

  return { isSensitive: false, type: null, title: '', message: '' };
}
