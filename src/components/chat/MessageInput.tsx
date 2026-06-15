import React from 'react';
import {
  Plus,
  Smile,
  Image,
  Paperclip,
  User,
  Loader2,
  Crop,
  Type,
  Zap,
  ListChecks,
  CreditCard,
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Code,
  Link,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eraser,
  ThumbsUp,
  Send,
  X,
  FileText,
  Video
} from 'lucide-react';
import { ReplyPreview } from './ReplyPreview';

const emojiOptions = [
  '😀', '😄', '😂', '😊', '😍', '😘', '😎', '🥳',
  '😢', '😭', '😡', '😤', '😴', '🤔', '😅', '🙄',
  '👍', '👎', '👏', '🙏', '💪', '👌', '✌️', '🤝',
  '❤️', '💙', '🔥', '✨', '🎉', '✅', '⭐', '💯',
];

const stickerOptions = [
  { label: 'Cười lớn', value: '😂😂😂' },
  { label: 'Yêu quá', value: '😍💖' },
  { label: 'Đã rõ', value: '👍 OK!' },
  { label: 'Cố lên', value: '💪 Cố lên!' },
  { label: 'Chúc mừng', value: '🎉 Chúc mừng!' },
  { label: 'Ôm một cái', value: '🤗' },
  { label: 'Bất ngờ', value: '😮✨' },
  { label: 'Buồn ngủ', value: '😴 Zzz' },
  { label: 'Xin lỗi', value: '🙏 Xin lỗi nha' },
  { label: 'Cảm ơn', value: '❤️ Cảm ơn!' },
  { label: 'Tuyệt vời', value: '🌟 Tuyệt vời!' },
  { label: 'Đang tới', value: '🏃 Đang tới!' },
];

interface MessageInputProps {
  handleSendMessage: (e: any) => void;
  conversationInfoOffsetClass: string;
  replyTo: any;
  setReplyTo: (reply: any) => void;
  activePrivateChatBlocked: boolean;
  activePrivateChatBlockedByMe: boolean;
  canSendInActiveConversation: boolean;
  pendingAttachments: any[];
  resetUploadState: () => void;
  removePendingAttachment: (id: string) => void;
  isTakingScreenshot: boolean;
  handleTakeScreenshot: () => void;
  setIsFormattingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isFormattingOpen: boolean;
  applyInlineFormat: (before: string, after: string, defaultText?: string) => void;
  activeFormats: any;
  applyLineFormat: (prefix: string) => void;
  applyNumberedList: () => void;
  applyAlignment: (align: string) => void;
  clearFormatting: () => void;
  isEmojiStickerOpen: boolean;
  emojiStickerTab: 'emoji' | 'sticker';
  setEmojiStickerTab: (tab: 'emoji' | 'sticker') => void;
  setIsEmojiStickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleSelectEmoji: (emoji: string) => void;
  handleSendSticker: (sticker: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  groupAvatarInputRef: React.RefObject<HTMLInputElement | null>;
  handleGroupAvatarSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  handleSendBlockedChatRequest: () => void;
  quillEditorRef: React.RefObject<HTMLDivElement | null>;
  handleSendThumbsUp: () => void;
  inputMessage: string;
  isSendingBlockedChatRequest: boolean;
  isGroupConversation: boolean;
  canCreatePoll: boolean;
  setIsCreatePollOpen: (open: boolean) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  handleSendMessage,
  conversationInfoOffsetClass,
  replyTo,
  setReplyTo,
  activePrivateChatBlocked,
  activePrivateChatBlockedByMe,
  canSendInActiveConversation,
  pendingAttachments,
  resetUploadState,
  removePendingAttachment,
  isTakingScreenshot,
  handleTakeScreenshot,
  setIsFormattingOpen,
  isFormattingOpen,
  applyInlineFormat,
  activeFormats,
  applyLineFormat,
  applyNumberedList,
  applyAlignment,
  clearFormatting,
  isEmojiStickerOpen,
  emojiStickerTab,
  setEmojiStickerTab,
  setIsEmojiStickerOpen,
  handleSelectEmoji,
  handleSendSticker,
  fileInputRef,
  handleFileChange,
  groupAvatarInputRef,
  handleGroupAvatarSelected,
  handleInputPaste,
  handleSendBlockedChatRequest,
  quillEditorRef,
  handleSendThumbsUp,
  inputMessage,
  isSendingBlockedChatRequest,
  isGroupConversation,
  canCreatePoll,
  setIsCreatePollOpen,
}) => {
  return (
    <form onSubmit={handleSendMessage} className={`p-4 bg-gray-100 dark:bg-discord-dark shrink-0 transition-[margin] duration-300 ${conversationInfoOffsetClass}`}>
      {/* Reply Preview */}
      {replyTo && (
        <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />
      )}

      {activePrivateChatBlocked && (
        <div className="mb-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          <div className="font-semibold">
            {activePrivateChatBlockedByMe ? 'Bạn đã chặn người này.' : 'Người này đã chặn bạn.'}
          </div>
          <div className="mt-0.5 text-xs text-rose-700 dark:text-rose-200/80">
            {activePrivateChatBlockedByMe
              ? 'Bạn vẫn xem được lịch sử trò chuyện. Bỏ chặn nếu muốn tiếp tục nhắn tin.'
              : 'Bạn vẫn xem được lịch sử trò chuyện nhưng không thể gửi tin nhắn.'}
          </div>
        </div>
      )}

      {!canSendInActiveConversation && !activePrivateChatBlocked && (
        <div className="mb-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <div className="font-semibold">Hai bạn không còn là bạn bè.</div>
          <div className="mt-0.5 text-xs text-amber-700 dark:text-amber-200/80">
            Bạn vẫn xem được lịch sử trò chuyện. Nhập lời nhắn bên dưới để gửi tin nhắn chờ nếu muốn tiếp tục.
          </div>
          {pendingAttachments.length > 0 && (
            <div className="mt-1 text-xs text-amber-700 dark:text-amber-200/80">
              Tin nhắn chờ hiện chỉ gửi nội dung văn bản.
            </div>
          )}
        </div>
      )}

      {/* Attachment Preview Panel */}
      {pendingAttachments.length > 0 && (
        <div className={`bg-white dark:bg-discord-mid border border-gray-300 dark:border-zinc-900/60 p-3 border-b-0 animate-fadeIn ${
          replyTo ? 'border-t-0' : 'rounded-t-2xl'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-800 dark:text-white">
              {pendingAttachments.filter((attachment) => attachment.type === 'IMAGE').length > 0
                ? `${pendingAttachments.filter((attachment) => attachment.type === 'IMAGE').length} ảnh`
                : `${pendingAttachments.length} tệp`}
            </span>
            <button
              type="button"
              onClick={resetUploadState}
              className="text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-rose-500 transition"
            >
              Xóa tất cả
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {pendingAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative w-[90px] h-[90px] rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 overflow-hidden group"
                title={attachment.name}
              >
                {attachment.type === 'IMAGE' && attachment.previewUrl ? (
                  <img src={attachment.previewUrl} alt={attachment.name} className="w-full h-full object-cover" />
                ) : attachment.type === 'VIDEO' ? (
                  <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-discord-blurple">
                    <Video className="w-7 h-7" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-600 dark:text-discord-blurple">
                    <FileText className="w-7 h-7" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removePendingAttachment(attachment.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  title="Xóa"
                >
                  <X className="w-3 h-3" />
                </button>

                {attachment.isUploading && (
                  <div className="absolute inset-x-1 bottom-1 h-1 rounded-full bg-black/20 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${attachment.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              disabled={!canSendInActiveConversation}
              onClick={() => {
                if (!canSendInActiveConversation) return;
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/*,video/*';
                  fileInputRef.current.click();
                }
              }}
              className="w-[90px] h-[90px] rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-650 bg-gray-50 dark:bg-zinc-850 text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-400 dark:hover:border-discord-blurple disabled:opacity-45 disabled:hover:text-gray-500 disabled:hover:border-gray-300 flex items-center justify-center transition"
              title="Thêm ảnh hoặc video"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {/* Toolbar & Input Box Container */}
      <div className={`bg-white dark:bg-discord-mid border border-gray-300 dark:border-zinc-900/60 flex flex-col ${
        (pendingAttachments.length > 0 || replyTo) ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'
      } overflow-hidden focus-within:border-indigo-600 dark:focus-within:border-discord-blurple focus-within:ring-1 focus-within:ring-indigo-600 dark:focus-within:ring-discord-blurple transition-all`}>
        
        {/* Top Toolbar Row */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200/80 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/10">
          <div className="flex items-center gap-0.5">
            {/* Sticker/Smile */}
            <button
              type="button"
              disabled={!canSendInActiveConversation}
              onClick={() => {
                setEmojiStickerTab('sticker');
                setIsEmojiStickerOpen((open) => !open);
              }}
              className={`p-1.5 rounded transition disabled:opacity-45 disabled:hover:bg-transparent ${
                isEmojiStickerOpen && emojiStickerTab === 'sticker'
                  ? 'bg-indigo-100 text-indigo-650 dark:bg-discord-blurple/20 dark:text-white'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-zinc-800/60'
              }`}
              title="Sticker"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Image attachment */}
            <button
              type="button"
              disabled={!canSendInActiveConversation}
              onClick={() => {
                if (!canSendInActiveConversation) return;
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*,video/*";
                  fileInputRef.current.click();
                }
              }}
              className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 disabled:opacity-45 disabled:hover:text-gray-500 disabled:hover:bg-transparent transition"
              title="Send Images or Videos"
            >
              <Image className="w-4 h-4" />
            </button>

            {/* File attachment */}
            <button
              type="button"
              disabled={!canSendInActiveConversation}
              onClick={() => {
                if (!canSendInActiveConversation) return;
                if (fileInputRef.current) {
                  fileInputRef.current.accept = ".pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
                  fileInputRef.current.click();
                }
              }}
              className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 disabled:opacity-45 disabled:hover:text-gray-500 disabled:hover:bg-transparent transition"
              title="Send Files"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Contact card */}
            <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Send Contact Card">
              <User className="w-4 h-4" />
            </button>

            {/* Screenshot */}
            <button
              type="button"
              disabled={!canSendInActiveConversation || isTakingScreenshot}
              onClick={handleTakeScreenshot}
              className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 disabled:opacity-45 disabled:hover:text-gray-500 disabled:hover:bg-transparent transition"
              title="Chụp màn hình"
            >
              {isTakingScreenshot ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crop className="w-4 h-4" />
              )}
            </button>

            {/* Formatting */}
            <button
              type="button"
              onClick={() => setIsFormattingOpen((open) => !open)}
              className={`p-1.5 rounded transition ${
                isFormattingOpen
                  ? 'bg-indigo-100 text-indigo-650 dark:bg-discord-blurple/20 dark:text-white'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-zinc-800/60'
              }`}
              title="Text Formatting"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Quick message */}
            <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Quick Message Templates">
              <Zap className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={!canSendInActiveConversation || !isGroupConversation || !canCreatePoll}
              onClick={() => setIsCreatePollOpen(true)}
              className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 disabled:opacity-45 disabled:hover:text-gray-500 disabled:hover:bg-transparent transition"
              title={isGroupConversation ? 'Tạo bình chọn' : 'Bình chọn chỉ dùng trong nhóm'}
            >
              <ListChecks className="w-4 h-4" />
            </button>

            {/* Credit card */}
            <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="Send Gift/Card">
              <CreditCard className="w-4 h-4" />
            </button>

            {/* More */}
            <button type="button" className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white rounded hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 transition" title="More Options">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isFormattingOpen && (
          <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-discord-mid overflow-x-auto">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('**', '**', 'đậm'); }} className={`p-1.5 rounded transition ${activeFormats.bold ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Đậm">
              <Bold className="w-4 h-4" />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('_', '_', 'nghiêng'); }} className={`p-1.5 rounded transition ${activeFormats.italic ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Nghiêng">
              <Italic className="w-4 h-4" />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('<u>', '</u>', 'gạch chân'); }} className={`p-1.5 rounded transition ${activeFormats.underline ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Gạch chân">
              <Underline className="w-4 h-4" />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('~~', '~~', 'gạch ngang'); }} className={`p-1.5 rounded transition ${activeFormats.strike ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Gạch ngang">
              <Strikethrough className="w-4 h-4" />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('<mark>', '</mark>', 'đánh dấu'); }} className={`p-1.5 rounded transition ${activeFormats.background ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Đánh dấu">
              <Highlighter className="w-4 h-4" />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('`', '`', 'code'); }} className={`p-1.5 rounded transition ${activeFormats.code ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Code">
              <Code className="w-4 h-4" />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('[', '](https://)', 'liên kết'); }} className={`p-1.5 rounded transition ${activeFormats.link ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Liên kết">
              <Link className="w-4 h-4" />
            </button>
            <span className="h-5 w-px bg-gray-200 dark:bg-zinc-800 mx-1" />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyLineFormat('> '); }} className={`p-1.5 rounded transition ${activeFormats.blockquote ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Trích dẫn">
              <Quote className="w-4 h-4" />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyLineFormat('- '); }} className={`p-1.5 rounded transition ${activeFormats.list === 'bullet' ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Danh sách">
              <List className="w-4 h-4" />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyNumberedList(); }} className={`p-1.5 rounded transition ${activeFormats.list === 'ordered' ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Danh sách số">
              <ListOrdered className="w-4 h-4" />
            </button>
            <span className="h-5 w-px bg-gray-200 dark:bg-zinc-800 mx-1" />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyAlignment('left'); }} className={`p-1.5 rounded transition ${!activeFormats.align || activeFormats.align === 'left' ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Căn trái">
              <AlignLeft className="w-4 h-4" />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyAlignment('center'); }} className={`p-1.5 rounded transition ${activeFormats.align === 'center' ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Căn giữa">
              <AlignCenter className="w-4 h-4" />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); applyAlignment('right'); }} className={`p-1.5 rounded transition ${activeFormats.align === 'right' ? 'bg-indigo-100 text-indigo-600 dark:bg-discord-blurple/30 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Căn phải">
              <AlignRight className="w-4 h-4" />
            </button>
            <span className="h-5 w-px bg-gray-200 dark:bg-zinc-800 mx-1" />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); clearFormatting(); }} className="p-1.5 rounded text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition" title="Xóa định dạng">
              <Eraser className="w-4 h-4" />
            </button>
          </div>
        )}

        {isEmojiStickerOpen && (
          <div className="border-b border-gray-200/80 bg-white px-3 py-3 dark:border-zinc-800/80 dark:bg-discord-mid">
            <div className="mb-3 inline-flex rounded-lg bg-gray-100 p-1 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setEmojiStickerTab('emoji')}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  emojiStickerTab === 'emoji'
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                Emoji
              </button>
              <button
                type="button"
                onClick={() => setEmojiStickerTab('sticker')}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  emojiStickerTab === 'sticker'
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                Sticker
              </button>
            </div>

            {emojiStickerTab === 'emoji' ? (
              <div className="grid grid-cols-8 gap-1 sm:grid-cols-12">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectEmoji(emoji)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-gray-100 dark:hover:bg-zinc-800"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {stickerOptions.map((sticker) => (
                  <button
                    key={sticker.label}
                    type="button"
                    onClick={() => handleSendSticker(sticker.value)}
                    className="min-h-16 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                    title={`Gửi ${sticker.label}`}
                  >
                    <span className="block text-xl">{sticker.value}</span>
                    <span className="mt-1 block truncate text-[11px] font-semibold text-gray-500 dark:text-zinc-400">{sticker.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Text Area Row */}
        <div className="flex items-end gap-2 p-2 bg-white dark:bg-discord-mid">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
          <input
            type="file"
            ref={groupAvatarInputRef}
            onChange={handleGroupAvatarSelected}
            accept="image/*"
            className="hidden"
          />

          <div
            className="min-w-0 flex-1"
            onPasteCapture={handleInputPaste}
            onKeyDownCapture={(e) => {
              if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'x') {
                e.preventDefault();
                setIsFormattingOpen((open) => !open);
                return;
              }

              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSendInActiveConversation) {
                  handleSendMessage(e);
                } else if (activePrivateChatBlocked) {
                  return;
                } else {
                  handleSendBlockedChatRequest();
                }
              }
            }}
          >
            <div ref={quillEditorRef} className="nextalk-quill-input" />
          </div>

          <div className="flex items-center gap-1 shrink-0 pb-1">
            {/* Emoji smile face */}
            <button
              type="button"
              disabled={!canSendInActiveConversation}
              onClick={() => {
                setEmojiStickerTab('emoji');
                setIsEmojiStickerOpen((open) => !open);
              }}
              className={`p-1.5 rounded-lg transition disabled:opacity-45 disabled:hover:bg-transparent ${
                isEmojiStickerOpen && emojiStickerTab === 'emoji'
                  ? 'bg-indigo-100 text-indigo-650 dark:bg-discord-blurple/20 dark:text-white'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-zinc-800/60'
              }`}
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* ThumbsUp or Send */}
            {(!inputMessage.trim() && pendingAttachments.length === 0) ? (
              <button
                type="button"
                onClick={handleSendThumbsUp}
                disabled={!canSendInActiveConversation}
                className="p-1.5 text-amber-500 hover:text-amber-600 dark:hover:text-amber-450 rounded-lg hover:bg-gray-200/60 dark:hover:bg-zinc-800/60 disabled:opacity-45 disabled:hover:bg-transparent transition active:scale-90"
                title="Send Like"
              >
                <ThumbsUp className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                type={canSendInActiveConversation ? 'submit' : 'button'}
                onClick={!canSendInActiveConversation ? handleSendBlockedChatRequest : undefined}
                disabled={
                  canSendInActiveConversation
                    ? pendingAttachments.some((attachment) => attachment.isUploading)
                    : activePrivateChatBlocked || !inputMessage.trim() || isSendingBlockedChatRequest
                }
                className="p-2 bg-indigo-600 dark:bg-discord-blurple hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-xl active:scale-95 disabled:opacity-50 disabled:scale-100 transition shadow"
                title={canSendInActiveConversation ? 'Send Message' : 'Gửi tin nhắn chờ'}
              >
                {isSendingBlockedChatRequest ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};
