// @ts-nocheck
﻿import {
  Loader2,
  MessageSquare,
  Shield,
  Check,
  X,
  AlertTriangle,
  Search,
  FileText,
  Image,
  Video,
  Phone,
  UserPlus,
  Pin,
  Sparkles,
  UserMinus,
  User,
  Users,
  Volume2,
  Lock,
  Hash,
  Settings,
  Trash2,
  MoreHorizontal,
  Unlock,
  ChevronDown,
  ChevronRight,
  Plus,
  PinOff,
  Link,
} from "lucide-react";
import React from "react";

interface ConversationListProps {
  conversationTab: any;
  isLoadingChatRequests: any;
  incomingChatRequests: any;
  selectedChatRequest: any;
  setSelectedChatRequest: any;
  formatConversationTime: any;
  isSearchActive: any;
  isGlobalSearching: any;
  globalSearchError: any;
  globalUserResults: any;
  isExistingFriend: any;
  sentFriendRequestIds: any;
  openSearchProfile: any;
  sentChatRequestIds: any;
  textMessageResults: any;
  sharedDataResults: any;
  activeConversation: any;
  selectConversation: any;
  user: any;
  notifications: any;
  setChannelSettingsData: any;
  handleDeleteConversation: any;
  conversationActionId: any;
  handleStartChatFromSearch: any;
  handleSendFriendRequestFromSearch: any;
  friendRequestActionId: any;
  globalConversationResults: any;
  handleOpenSearchMessage: any;
  getConversationTitle: any;
  getSearchMessagePreview: any;
  messageHasSharedLink: any;
  filteredUnified: any;
  getFriendInfo: any;
  lastMessages: any;
  setOpenConversationMenuId: any;
  openConversationMenuId: any;
  handleToggleConversationPin: any;
  handleHideClick: any;
  getGroupConversationId: any;
  expandedGroups: any;
  handleOpenGroup: any;
  toggleGroupExpand: any;
  formatLastMessage: any;
  conversations: any;
  searchQuery: any;
  setSearchQuery: any;
}

export const ConversationList = ({
  conversationTab,
  isLoadingChatRequests,
  incomingChatRequests,
  selectedChatRequest,
  setSelectedChatRequest,
  formatConversationTime,
  isSearchActive,
  isGlobalSearching,
  globalSearchError,
  globalUserResults,
  isExistingFriend,
  sentFriendRequestIds,
  openSearchProfile,
  sentChatRequestIds,
  textMessageResults,
  sharedDataResults,
  activeConversation,
  selectConversation,
  user,
  notifications,
  setChannelSettingsData,
  handleDeleteConversation,
  conversationActionId,
  handleStartChatFromSearch,
  handleSendFriendRequestFromSearch,
  friendRequestActionId,
  globalConversationResults,
  handleOpenSearchMessage,
  getConversationTitle,
  getSearchMessagePreview,
  messageHasSharedLink,
  filteredUnified,
  getFriendInfo,
  lastMessages,
  setOpenConversationMenuId,
  openConversationMenuId,
  handleToggleConversationPin,
  handleHideClick,
  getGroupConversationId,
  expandedGroups,
  handleOpenGroup,
  toggleGroupExpand,
  formatLastMessage,
  conversations,
  searchQuery,
  setSearchQuery,
}: ConversationListProps) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversationTab === "requests" ? (
        isLoadingChatRequests ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-600 dark:text-discord-blurple" />
          </div>
        ) : incomingChatRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-gray-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm text-gray-400 dark:text-zinc-500">
              Không có tin nhắn chờ.
            </p>
          </div>
        ) : (
          <div>
            <div className="mx-3 mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Tin nhắn từ người chưa kết bạn được ẩn tại
                  đây. Chỉ trả lời khi bạn nhận ra người gửi;
                  bạn có thể kết bạn, trả lời hoặc chặn/báo
                  xấu.
                </span>
              </div>
            </div>
            {incomingChatRequests.map((request) => (
              <button
                type="button"
                key={request.id}
                onClick={() => setSelectedChatRequest(request)}
                className={`block w-full px-3 py-3 text-left border-b border-gray-100 dark:border-zinc-800/60 transition-colors ${
                  selectedChatRequest?.id === request.id
                    ? "bg-indigo-50 dark:bg-indigo-500/10"
                    : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {request.sender.avatarUrl ? (
                    <img
                      src={request.sender.avatarUrl}
                      alt={request.sender.username}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shrink-0">
                      {request.sender.username.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white truncate">
                        {request.sender.username}
                      </span>
                      <span className="text-[11px] shrink-0 text-gray-400 dark:text-zinc-500">
                        {formatConversationTime(request.createdAt)}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                      {request.message}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
                      Mở trong khung chat
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      ) : isSearchActive ? (
        <div className="px-3 pb-4 space-y-4">
          {isGlobalSearching && (
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-zinc-800/50 px-3 py-2 text-xs text-gray-500 dark:text-zinc-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang tìm kiếm...</span>
            </div>
          )}

          {globalSearchError && (
            <div className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
              {globalSearchError}
            </div>
          )}

          {globalUserResults.length > 0 && (
            <div>
              <div className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                Người dùng & kết nối
              </div>
              <div className="space-y-1">
                {globalUserResults.slice(0, 6).map((result) => {
                  const alreadyFriend = isExistingFriend(result.id);
                  const requestSent = sentFriendRequestIds.includes(result.id);
                  return (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    >
                      <button
                        type="button"
                        onClick={() => openSearchProfile(result)}
                        className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Mở hồ sơ"
                      >
                        {result.avatarUrl ? (
                          <img
                            src={result.avatarUrl}
                            alt={result.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                            {result.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </button>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {result.username}
                        </div>
                        <div className="truncate text-[11px] text-gray-400 dark:text-zinc-500">
                          {result.email}
                        </div>
                      </div>
                      {!alreadyFriend && (
                        <button
                          type="button"
                          onClick={() => openSearchProfile(result)}
                          disabled={sentChatRequestIds.includes(result.id)}
                          className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-500/10 disabled:text-indigo-500 disabled:opacity-80 transition"
                        >
                          {sentChatRequestIds.includes(result.id)
                            ? "Đã nhắn"
                            : "Nhắn"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          alreadyFriend
                            ? handleStartChatFromSearch(result.id)
                            : handleSendFriendRequestFromSearch(result.id)
                        }
                        disabled={
                          friendRequestActionId === result.id || requestSent
                        }
                        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                          alreadyFriend
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : requestSent
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-700 hover:bg-indigo-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-200"
                        } disabled:opacity-60`}
                      >
                        {friendRequestActionId === result.id
                          ? "..."
                          : alreadyFriend
                            ? "Nhắn"
                            : requestSent
                              ? "Đã gửi"
                              : "Kết bạn"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {globalConversationResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-1 pb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                  Cuộc trò chuyện & nhóm
                </span>
                {searchQuery.match(/^\d{4}$/) && user?.hasChatPin && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
                    <Unlock className="h-3 w-3" />
                    Đã mở khóa ẩn
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {globalConversationResults.slice(0, 8).map((c) => {
                  if (c.type === "PRIVATE") {
                    const friend = getFriendInfo(c);
                    const friendId = c.members.find(
                      (member) => member.id !== user?.id,
                    )?.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          selectConversation(c.id);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="relative shrink-0">
                          {friend.avatarUrl ? (
                            <img
                              src={friend.avatarUrl}
                              alt={friend.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm">
                              {friend.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {c.hidden && (
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white dark:ring-zinc-900 shadow">
                              <Lock className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {friend.username}
                            </span>
                            {c.hidden && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                                Bị ẩn
                              </span>
                            )}
                          </div>
                          <div className="truncate text-[11px] text-gray-400 dark:text-zinc-500">
                            {friendId && isExistingFriend(friendId)
                              ? "Bạn bè"
                              : "Chưa là bạn bè"}
                          </div>
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        selectConversation(c.id);
                        setSearchQuery("");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="relative shrink-0">
                        {(c as any).avatarUrl ? (
                          <img
                            src={(c as any).avatarUrl as string}
                            alt={c.name || ""}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                            {c.name ? c.name.charAt(0).toUpperCase() : "G"}
                          </div>
                        )}
                        {c.hidden && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white dark:ring-zinc-900 shadow">
                            <Lock className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {c.name || "Nhóm không tên"}
                          </span>
                          {c.hidden && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                              Bị ẩn
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[11px] text-gray-400 dark:text-zinc-500">
                          {c.members?.length || 0} thành viên
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {textMessageResults.length > 0 && (
            <div>
              <div className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                Tin nhắn
              </div>
              <div className="space-y-1">
                {textMessageResults.map((message) => (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => handleOpenSearchMessage(message)}
                    className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                  >
                    <MessageSquare className="mt-1 w-4 h-4 shrink-0 text-indigo-500" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold text-gray-700 dark:text-zinc-200">
                        {getConversationTitle(message.conversationId)}
                      </div>
                      <div className="line-clamp-2 text-[12px] text-gray-500 dark:text-zinc-400">
                        {getSearchMessagePreview(message)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sharedDataResults.length > 0 && (
            <div>
              <div className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                File, hình ảnh & liên kết
              </div>
              <div className="space-y-1">
                {sharedDataResults.map((message) => (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => handleOpenSearchMessage(message)}
                    className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                  >
                    {messageHasSharedLink(message) ? (
                      <Link className="mt-1 w-4 h-4 shrink-0 text-sky-500" />
                    ) : message.attachments?.some(
                        (attachment) => attachment.type === "IMAGE",
                      ) || message.messageType === "IMAGE" ? (
                      <Image className="mt-1 w-4 h-4 shrink-0 text-emerald-500" />
                    ) : (
                      <FileText className="mt-1 w-4 h-4 shrink-0 text-amber-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold text-gray-700 dark:text-zinc-200">
                        {getConversationTitle(message.conversationId)}
                      </div>
                      <div className="line-clamp-2 text-[12px] text-gray-500 dark:text-zinc-400">
                        {getSearchMessagePreview(message)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isGlobalSearching &&
            !globalSearchError &&
            globalUserResults.length === 0 &&
            globalConversationResults.length === 0 &&
            textMessageResults.length === 0 &&
            sharedDataResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-400 dark:text-zinc-500" />
                </div>
                <p className="text-sm text-gray-400 dark:text-zinc-500">
                  Không tìm thấy người dùng, nhóm, tin nhắn hoặc
                  dữ liệu đã chia sẻ.
                </p>
              </div>
            )}
        </div>
      ) : filteredUnified.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-gray-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm text-gray-400 dark:text-zinc-500">
            {searchQuery
              ? "Không tìm thấy cuộc trò chuyện nào."
              : "Chưa có cuộc trò chuyện nào."}
          </p>
        </div>
      ) : (
        filteredUnified.map((item) => {
          if (item.kind === "dm") {
            const c = item.conv;
            const friend = getFriendInfo(c);
            const lastMsg = lastMessages[c.id];
            const isSelected = activeConversation?.id === c.id;
            const unreadNotifs = notifications.filter(
              (n) =>
                n.referenceId === c.id && !n.read && n.type === "NEW_MESSAGE",
            );
            const unreadCount = unreadNotifs.length;
            const hasUnread = unreadCount > 0;

            return (
              <div
                key={c.id}
                onClick={() => {
                  setOpenConversationMenuId(null);
                  selectConversation(c.id);
                }}
                className={`group relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors duration-150 ${
                  isSelected
                    ? "bg-blue-50 dark:bg-indigo-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                {/* Avatar with status dot */}
                <div className="relative shrink-0">
                  {friend.avatarUrl ? (
                    <img
                      src={friend.avatarUrl}
                      alt={friend.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg">
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1e1e2e] ${
                      friend.status === "ONLINE"
                        ? "bg-emerald-500"
                        : friend.status === "AWAY"
                          ? "bg-amber-400"
                          : "bg-gray-400 dark:bg-zinc-600"
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[14px] truncate ${
                        hasUnread
                          ? "font-bold text-gray-900 dark:text-white"
                          : "font-medium text-gray-800 dark:text-zinc-200"
                      }`}
                    >
                      {friend.username}
                      {c.pinned && (
                        <Pin className="ml-1.5 inline h-3 w-3 text-indigo-500" />
                      )}
                    </span>
                    {lastMsg && (
                      <span
                        className={`text-[11px] shrink-0 ${
                          hasUnread
                            ? "text-blue-600 dark:text-indigo-400 font-semibold"
                            : "text-gray-400 dark:text-zinc-500"
                        }`}
                      >
                        {formatConversationTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                      className={`text-[12px] truncate flex-1 ${
                        hasUnread
                          ? "font-semibold text-gray-700 dark:text-zinc-200"
                          : "text-gray-400 dark:text-zinc-500"
                      }`}
                    >
                      {lastMsg
                        ? formatLastMessage(lastMsg, false)
                        : "Bắt đầu cuộc trò chuyện"}
                    </p>
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenConversationMenuId((current) =>
                            current === c.id ? null : c.id,
                          );
                        }}
                        className={`rounded-md p-1.5 transition ${
                          openConversationMenuId === c.id
                            ? "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200"
                            : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        }`}
                        title="Tùy chọn hội thoại"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openConversationMenuId === c.id && (
                        <div
                          className="absolute right-0 top-8 z-30 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleConversationPin(c.id, c.pinned)
                            }
                            disabled={conversationActionId === `pin-${c.id}`}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            {conversationActionId === `pin-${c.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                            ) : c.pinned ? (
                              <PinOff className="h-4 w-4 text-indigo-500" />
                            ) : (
                              <Pin className="h-4 w-4 text-gray-500" />
                            )}
                            <span>
                              {c.pinned
                                ? "Bỏ ghim hội thoại"
                                : "Ghim hội thoại"}
                            </span>
                          </button>
                          <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                          <button
                            type="button"
                            onClick={() => handleHideClick(c.id)}
                            disabled={conversationActionId === `hide-${c.id}`}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            {conversationActionId === `hide-${c.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                            ) : (
                              <Lock className="h-4 w-4 text-gray-500" />
                            )}
                            <span>Ẩn trò chuyện</span>
                          </button>
                          <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                          <button
                            type="button"
                            onClick={() => handleDeleteConversation(c.id)}
                            disabled={conversationActionId === `delete-${c.id}`}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-500/10"
                          >
                            {conversationActionId === `delete-${c.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span>Xóa hội thoại</span>
                          </button>
                        </div>
                      )}
                    </div>
                    {hasUnread && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-blue-600 dark:bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // Group item
          const g = item.group;
          const groupConversationId = getGroupConversationId(g);
          const isGroupExpanded = expandedGroups.has(g.id);
          const isSelected = activeConversation?.id === groupConversationId;
          const groupConversation = groupConversationId
            ? conversations.find(
                (conversation) => conversation.id === groupConversationId,
              )
            : null;
          const lastMsg = groupConversationId
            ? lastMessages[groupConversationId]
            : undefined;
          const unreadNotifs = notifications.filter(
            (n) =>
              n.referenceId === groupConversationId &&
              !n.read &&
              n.type === "NEW_MESSAGE",
          );
          const unreadCount = unreadNotifs.length;
          const hasUnread = unreadCount > 0;

          return (
            <div key={g.id} className="flex flex-col">
              <div
                onClick={(e) => {
                  setOpenConversationMenuId(null);
                  handleOpenGroup(g);
                  toggleGroupExpand(g.id, e);
                }}
                className={`group relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors duration-150 ${
                  isSelected
                    ? "bg-blue-50 dark:bg-indigo-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                {/* Group Avatar */}
                <div className="relative shrink-0">
                  {g.avatarUrl ? (
                    <img
                      src={g.avatarUrl}
                      alt={g.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Group badge */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-[#1e1e2e] rounded-full flex items-center justify-center shadow-sm">
                    <Users className="w-2.5 h-2.5 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  {g.pendingApprovalCount > 0 && g.ownerId === user?.id && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-discord-mid">
                      {g.pendingApprovalCount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[14px] truncate ${
                        hasUnread
                          ? "font-bold text-gray-900 dark:text-white"
                          : "font-medium text-gray-800 dark:text-zinc-200"
                      }`}
                    >
                      {g.name}
                      {groupConversation?.pinned && (
                        <Pin className="ml-1.5 inline h-3 w-3 text-indigo-500" />
                      )}
                    </span>
                    {lastMsg && (
                      <span
                        className={`text-[11px] shrink-0 ${
                          hasUnread
                            ? "text-blue-600 dark:text-indigo-400 font-semibold"
                            : "text-gray-400 dark:text-zinc-500"
                        }`}
                      >
                        {formatConversationTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                      className={`text-[12px] truncate flex-1 ${
                        hasUnread
                          ? "font-semibold text-gray-700 dark:text-zinc-200"
                          : "text-gray-400 dark:text-zinc-500"
                      }`}
                    >
                      {lastMsg
                        ? formatLastMessage(lastMsg, true)
                        : `${g.memberCount} thành viên`}
                    </p>
                    {groupConversationId && groupConversation && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        {g.channels && g.channels.length > 0 && (
                          <button
                            type="button"
                            className="p-1.5 shrink-0 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroupExpand(g.id, e);
                            }}
                            title={isGroupExpanded ? "Thu gọn" : "Mở rộng"}
                          >
                            {isGroupExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {(g.ownerId === user?.id ||
                          ["OWNER", "LEADER", "ADMIN"].includes(
                            g.members?.find((m) => m.userId === user?.id)
                              ?.role || "",
                          )) && (
                          <button
                            type="button"
                            className="p-1.5 shrink-0 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            title="Tạo kênh mới"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenConversationMenuId((current) =>
                                current === groupConversationId
                                  ? null
                                  : groupConversationId,
                              );
                            }}
                            className={`rounded-md p-1.5 transition ${
                              openConversationMenuId === groupConversationId
                                ? "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-200"
                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            }`}
                            title="Tùy chọn hội thoại"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {openConversationMenuId === groupConversationId && (
                            <div
                              className="absolute right-0 top-8 z-30 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleConversationPin(
                                    groupConversationId,
                                    groupConversation.pinned,
                                  )
                                }
                                disabled={
                                  conversationActionId ===
                                  `pin-${groupConversationId}`
                                }
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                              >
                                {conversationActionId ===
                                `pin-${groupConversationId}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                ) : groupConversation.pinned ? (
                                  <PinOff className="h-4 w-4 text-indigo-500" />
                                ) : (
                                  <Pin className="h-4 w-4 text-gray-500" />
                                )}
                                <span>
                                  {groupConversation.pinned
                                    ? "Bỏ ghim hội thoại"
                                    : "Ghim hội thoại"}
                                </span>
                              </button>
                              <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                              <button
                                type="button"
                                onClick={() =>
                                  handleHideClick(groupConversationId)
                                }
                                disabled={
                                  conversationActionId ===
                                  `hide-${groupConversationId}`
                                }
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                              >
                                {conversationActionId ===
                                `hide-${groupConversationId}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                ) : (
                                  <Lock className="h-4 w-4 text-gray-500" />
                                )}
                                <span>Ẩn trò chuyện</span>
                              </button>
                              <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteConversation(groupConversationId)
                                }
                                disabled={
                                  conversationActionId ===
                                  `delete-${groupConversationId}`
                                }
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-500/10"
                              >
                                {conversationActionId ===
                                `delete-${groupConversationId}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                <span>Xóa hội thoại</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {hasUnread && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-blue-600 dark:bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Render channels if expanded */}
              {isGroupExpanded && g.channels && g.channels.length > 0 && (
                <div className="flex flex-col ml-14 mr-3 my-1 gap-0.5 border-l-2 border-gray-100 dark:border-zinc-800/50 pl-2">
                  {g.channels.map((ch) => {
                    const isChannelSelected =
                      activeConversation?.id === ch.conversationId;
                    const channelNotifs = notifications.filter(
                      (n) =>
                        n.referenceId === ch.conversationId &&
                        !n.read &&
                        n.type === "NEW_MESSAGE",
                    );
                    const channelUnreadCount = channelNotifs.length;
                    const channelHasUnread = channelUnreadCount > 0;

                    const isMemberOfChannel = conversations.some((c: any) => c.id === ch.conversationId);
                    const channelIsPrivate = Boolean(ch.isPrivate ?? (ch as any).private);

                    let Icon = Hash;
                    if (ch.type === "VOICE") Icon = Volume2;
                    if (channelIsPrivate && !isMemberOfChannel) Icon = Lock;

                    return (
                      <div
                        key={ch.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (channelIsPrivate && !isMemberOfChannel) return;
                          selectConversation(ch.conversationId);
                        }}
                        className={`group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                          channelIsPrivate && !isMemberOfChannel 
                            ? "cursor-not-allowed opacity-60" 
                            : "cursor-pointer"
                        } ${
                          isChannelSelected
                            ? "bg-indigo-50/80 dark:bg-indigo-500/15"
                            : "hover:bg-gray-100/80 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="relative">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${channelHasUnread ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-zinc-500"}`}
                          />
                          {channelIsPrivate && isMemberOfChannel && (
                            <Lock className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-indigo-500 dark:text-indigo-400" />
                          )}
                        </div>
                        <span
                          className={`text-[13px] truncate flex-1 ${
                            channelHasUnread
                              ? "font-bold text-gray-900 dark:text-white"
                              : isChannelSelected
                                ? "font-bold text-indigo-700 dark:text-indigo-300"
                                : "font-medium text-gray-600 dark:text-zinc-400"
                          }`}
                        >
                          {ch.name}
                        </span>
                        {channelHasUnread && (
                          <span className="shrink-0 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                            {channelUnreadCount > 99
                              ? "99+"
                              : channelUnreadCount}
                          </span>
                        )}
                        {(g.ownerId === user?.id ||
                          ["ADMIN", "LEADER", "DEPUTY"].includes(
                            g.members?.find((m) => m.userId === user?.id)
                              ?.role || "",
                          )) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChannelSettingsData({
                                groupId: g.id,
                                channel: ch,
                              });
                            }}
                            className={`shrink-0 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-all ${isChannelSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                            title="Cài đặt kênh"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
