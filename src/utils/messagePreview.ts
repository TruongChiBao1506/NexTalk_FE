import type { MessageResponse, PollMetadata } from '../types/chat';

const urlPattern = /https?:\/\/[^\s<>"']+/gi;

export type MessagePreviewKind = 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'ALBUM' | 'LINK' | 'POLL' | 'STICKER' | 'RECALLED';

export interface MessagePreviewData {
  kind: MessagePreviewKind;
  label: string;
  text: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number | null;
  url?: string;
}

export const stripMessageHtml = (content?: string | null) => {
  if (!content) return '';
  return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const getFirstUrl = (content?: string | null) => stripMessageHtml(content).match(urlPattern)?.[0] ?? '';

const getPollQuestion = (message: MessageResponse) => {
  const metadata = message.metadata as PollMetadata | undefined;
  return metadata?.question || stripMessageHtml(message.content) || 'Bình chọn';
};

export const getMessagePreviewData = (message: MessageResponse | null | undefined): MessagePreviewData => {
  if (!message) {
    return {
      kind: 'TEXT',
      label: 'Tin nhắn',
      text: 'Tin nhắn cũ không còn trong vùng tải',
    };
  }

  if (message.isRecalled) {
    return {
      kind: 'RECALLED',
      label: 'Đã thu hồi',
      text: 'Tin nhắn đã bị thu hồi',
    };
  }

  if (message.messageType === 'POLL') {
    return {
      kind: 'POLL',
      label: 'Bình chọn',
      text: getPollQuestion(message),
    };
  }

  if (message.messageType === 'STICKER') {
    return {
      kind: 'STICKER',
      label: 'Sticker',
      text: 'Sticker',
      thumbnailUrl: message.content,
    };
  }

  const attachments = message.attachments ?? [];
  const firstAttachment = attachments[0];
  const text = stripMessageHtml(message.content);

  if (message.messageType === 'IMAGE' && !firstAttachment) {
    return {
      kind: 'IMAGE',
      label: 'Hình ảnh',
      text: text || 'Hình ảnh',
      thumbnailUrl: message.content,
    };
  }

  if (message.messageType === 'VIDEO' && !firstAttachment) {
    return {
      kind: 'VIDEO',
      label: 'Video',
      text: text || 'Video',
      thumbnailUrl: message.content,
    };
  }

  if (firstAttachment) {
    if (attachments.length > 1) {
      const mediaCount = attachments.filter((attachment) => attachment.type === 'IMAGE' || attachment.type === 'VIDEO').length;
      return {
        kind: 'ALBUM',
        label: mediaCount === attachments.length ? 'Album' : 'Tệp đính kèm',
        text: text || `${attachments.length} mục đính kèm`,
        thumbnailUrl: attachments.find((attachment) => attachment.type === 'IMAGE')?.url,
      };
    }

    if (firstAttachment.type === 'IMAGE') {
      return {
        kind: 'IMAGE',
        label: 'Hình ảnh',
        text: text || firstAttachment.name || 'Hình ảnh',
        thumbnailUrl: firstAttachment.url,
      };
    }

    if (firstAttachment.type === 'VIDEO') {
      return {
        kind: 'VIDEO',
        label: 'Video',
        text: text || firstAttachment.name || 'Video',
        thumbnailUrl: firstAttachment.url,
      };
    }

    return {
      kind: 'FILE',
      label: 'Tệp đính kèm',
      text: text || firstAttachment.name || 'Tệp đính kèm',
      fileName: firstAttachment.name || firstAttachment.url.split('/').pop() || 'Tệp đính kèm',
      fileSize: firstAttachment.size,
      url: firstAttachment.url,
    };
  }

  const firstUrl = getFirstUrl(message.content);
  if (firstUrl) {
    return {
      kind: 'LINK',
      label: 'Liên kết',
      text: text || firstUrl,
      url: firstUrl,
    };
  }

  return {
    kind: 'TEXT',
    label: 'Tin nhắn',
    text: text || 'Tin nhắn trống',
  };
};
