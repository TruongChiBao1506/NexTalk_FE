import { create } from 'zustand';
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type ILocalVideoTrack,
  type ILocalAudioTrack,
  type IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';
import { useChatStore } from './chatStore';
import { useAuthStore } from './authStore';
import { apiClient } from '../api/apiClient';
import { audioSynth } from '../utils/audioSynth';

type CallState = 'idle' | 'ringing_incoming' | 'ringing_outgoing' | 'connected';
type CallType = 'voice' | 'video';

type CallNotice = {
  id: string;
  message: string;
};

const javaStringHashUid = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return String(hash & 0x7fffffff);
};

interface CallStore {
  callState: CallState;
  callType: CallType;
  callId: string | null;
  isGroupCall: boolean;
  callTitle: string | null;
  callMemberCount: number | null;
  conversationId: string | null;
  caller: { id: string; username: string; avatarUrl?: string } | null;
  receiver: { id: string; username: string; avatarUrl?: string } | null;

  isMicMuted: boolean;
  isCameraMuted: boolean;
  isScreenSharing: boolean;
  isSpeakerOn: boolean;

  remoteUsers: IAgoraRTCRemoteUser[];
  remoteAudioPlaybackBlocked: boolean;
  activeSpeakerUids: string[];
  localAgoraUid: number | null;
  callNotices: CallNotice[];
  outgoingRingTimeoutId: number | null;
  incomingRingTimeoutId: number | null;
  groupAloneTimeoutId: number | null;

  activeVoiceChannelId: string | null;
  voiceChannelMembers: Record<string, string[]>; // channelId -> array of userIds
  isViewingVoiceGrid: boolean;

  agoraClient: IAgoraRTCClient | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  localVideoTrack: ICameraVideoTrack | null;
  screenVideoTrack: ILocalVideoTrack | null;
  screenAudioTrack: ILocalAudioTrack | null;
  isChannelSoundEnabled: boolean;

  initiateCall: (conversationId: string, callType: CallType, partner: any) => void;
  receiveCall: (signal: any) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  cancelCall: (reason?: 'timeout' | 'canceled') => void;
  hangupCall: () => void;

  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleSpeaker: () => void;
  toggleChannelSound: () => void;
  switchCamera: () => Promise<void>;
  startVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  handleIncomingSignal: (signal: any) => void;
  clearTracks: () => void;
  addCallNotice: (message: string) => void;
  removeCallNotice: (noticeId: string) => void;
  clearOutgoingRingTimeout: () => void;
  clearIncomingRingTimeout: () => void;
  clearGroupAloneTimeout: () => void;
  scheduleGroupAloneTimeout: () => void;
  joinAgoraChannel: () => Promise<void>;
  resumeRemoteAudio: () => Promise<void>;
  
  joinVoiceChannel: (channelId: string, channelName: string, groupId: string) => Promise<void>;
  updateVoiceChannelMembers: (channelId: string, members: string[]) => void;
  handleVoiceChannelEvent: (event: any) => void;
  setIsViewingVoiceGrid: (isViewing: boolean) => void;
}

export const useCallStore = create<CallStore>((set, get) => ({
  callState: 'idle',
  callType: 'voice',
  callId: null,
  isGroupCall: false,
  callTitle: null,
  callMemberCount: null,
  conversationId: null,
  caller: null,
  receiver: null,

  isMicMuted: false,
  isCameraMuted: false,
  isScreenSharing: false,
  isSpeakerOn: true,
  isChannelSoundEnabled: true,

  activeVoiceChannelId: null,
  voiceChannelMembers: {},
  isViewingVoiceGrid: false,

  remoteUsers: [],
  remoteAudioPlaybackBlocked: false,
  activeSpeakerUids: [],
  localAgoraUid: null,
  callNotices: [],
  outgoingRingTimeoutId: null,
  incomingRingTimeoutId: null,
  groupAloneTimeoutId: null,

  agoraClient: null,
  localAudioTrack: null,
  localVideoTrack: null,
  screenVideoTrack: null,
  screenAudioTrack: null,

  initiateCall: (conversationId, callType, partner) => {
    const currentUser = useAuthStore.getState().user;
    const stompClient = useChatStore.getState().stompClient;
    if (!currentUser || !stompClient || !stompClient.connected) return;
    const isGroupCall = Boolean(partner?.isGroupCall);
    const callId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Set call states
    set({
      callState: 'ringing_outgoing',
      callType,
      callId,
      isGroupCall,
      callTitle: partner?.username ?? null,
      callMemberCount: partner?.memberCount ?? null,
      conversationId,
      receiver: partner,
      caller: {
        id: currentUser.id,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl ?? undefined
      },
      isMicMuted: false,
      isCameraMuted: false,
      isScreenSharing: false,
      isSpeakerOn: true,
      remoteUsers: [],
      remoteAudioPlaybackBlocked: false,
      activeSpeakerUids: [],
      localAgoraUid: null,
      callNotices: []
    });

    audioSynth.playOutgoingRing();

    // Send INVITE WebSocket signal
    const signalPayload = {
      callId,
      conversationId,
      callerId: currentUser.id,
      receiverId: isGroupCall ? undefined : partner.id,
      groupName: isGroupCall ? partner.username : undefined,
      groupMemberCount: isGroupCall ? partner.memberCount : undefined,
      type: callType.toUpperCase(),
      signalType: 'INVITE'
    };

    stompClient.publish({
      destination: '/app/call.invite',
      body: JSON.stringify(signalPayload)
    });

    const ringTimeoutId = window.setTimeout(() => {
      const state = get();
      if (state.callState === 'ringing_outgoing' && state.callId === callId) {
        state.cancelCall('timeout');
      }
    }, 60000);
    set({ outgoingRingTimeoutId: ringTimeoutId });
  },

  receiveCall: (signal) => {
    const currentCallState = get().callState;
    const stompClient = useChatStore.getState().stompClient;

    if (currentCallState !== 'idle') {
      const { callId, conversationId, caller } = get();
      const isDuplicateIncomingCall =
        currentCallState === 'ringing_incoming' &&
        signal.conversationId === conversationId &&
        signal.callerId === caller?.id &&
        (!signal.callId || !callId || signal.callId === callId);

      if (isDuplicateIncomingCall) {
        return;
      }

      // Send BUSY response if already in a call
      if (stompClient && stompClient.connected) {
        stompClient.publish({
          destination: '/app/call.answer',
          body: JSON.stringify({
            callId: signal.callId,
            conversationId: signal.conversationId,
            callerId: signal.callerId,
            receiverId: signal.receiverId,
            type: signal.type,
            signalType: 'ANSWER',
            accept: false,
            reason: 'busy'
          })
        });
      }
      return;
    }

    set({
      callState: 'ringing_incoming',
      callType: signal.type.toLowerCase() === 'video' ? 'video' : 'voice',
      callId: signal.callId ?? null,
      isGroupCall: !signal.receiverId,
      callTitle: !signal.receiverId
        ? signal.groupName ?? useChatStore.getState().conversations.find((conversation) => conversation.id === signal.conversationId)?.name ?? 'Group call'
        : null,
      callMemberCount: !signal.receiverId
        ? signal.groupMemberCount ?? useChatStore.getState().conversations.find((conversation) => conversation.id === signal.conversationId)?.members.length ?? null
        : null,
      conversationId: signal.conversationId,
      caller: {
        id: signal.callerId,
        username: signal.callerName,
        avatarUrl: signal.callerAvatar
      },
      isMicMuted: false,
      isCameraMuted: false,
      isScreenSharing: false,
      isSpeakerOn: true,
      remoteUsers: [],
      remoteAudioPlaybackBlocked: false,
      activeSpeakerUids: [],
      localAgoraUid: null,
      callNotices: []
    });

    audioSynth.playIncomingRing();

    const ringTimeoutId = window.setTimeout(() => {
      const state = get();
      if (state.callState === 'ringing_incoming' && state.callId === signal.callId) {
        state.rejectCall();
      }
    }, 60000);
    set({ incomingRingTimeoutId: ringTimeoutId });
  },

  acceptCall: async () => {
    const { conversationId, caller, callType } = get();
    const stompClient = useChatStore.getState().stompClient;
    const currentUser = useAuthStore.getState().user;

    if (!conversationId || !caller || !currentUser || !stompClient || !stompClient.connected) return;

    audioSynth.stop();
    get().clearOutgoingRingTimeout();
    get().clearIncomingRingTimeout();

    // Set callState immediately to connected to prevent receiving other calls
    set({
      callState: 'connected',
      receiver: {
        id: currentUser.id,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl ?? undefined
      }
    });

    // Send ANSWER signal with accept = true
    const signalPayload = {
      callId: get().callId,
      conversationId,
      callerId: caller.id,
      receiverId: currentUser.id,
      type: callType.toUpperCase(),
      signalType: 'ANSWER',
      accept: true
    };

    stompClient.publish({
      destination: '/app/call.answer',
      body: JSON.stringify(signalPayload)
    });

    // Join Agora RTC channel
    try {
      await get().joinAgoraChannel();
    } catch (err) {
      console.error('Failed to join Agora channel:', err);
      get().hangupCall();
    }
  },

  rejectCall: () => {
    const { conversationId, caller } = get();
    const stompClient = useChatStore.getState().stompClient;
    const currentUser = useAuthStore.getState().user;

    audioSynth.stop();
    get().clearOutgoingRingTimeout();
    get().clearIncomingRingTimeout();

    if (conversationId && caller && currentUser && stompClient && stompClient.connected) {
      try {
        // Send ANSWER signal with accept = false
        const signalPayload = {
          callId: get().callId,
          conversationId,
          callerId: caller.id,
          receiverId: currentUser.id,
          type: get().callType.toUpperCase(),
          signalType: 'ANSWER',
          accept: false,
          reason: 'rejected'
        };

        stompClient.publish({
          destination: '/app/call.answer',
          body: JSON.stringify(signalPayload)
        });
      } catch (err) {
        console.error('Failed to send reject call signal:', err);
      }
    }

    audioSynth.playEndCall();
    set({
      callState: 'idle',
      callId: null,
      isGroupCall: false,
      callTitle: null,
      callMemberCount: null,
      conversationId: null,
      caller: null,
      receiver: null,
      remoteUsers: [],
      remoteAudioPlaybackBlocked: false,
      activeSpeakerUids: [],
      localAgoraUid: null,
      callNotices: []
    });
  },

  cancelCall: (reason = 'canceled') => {
    const { conversationId, receiver, isGroupCall } = get();
    const stompClient = useChatStore.getState().stompClient;
    const currentUser = useAuthStore.getState().user;

    audioSynth.stop();
    get().clearOutgoingRingTimeout();

    const cleanReason = typeof reason === 'string' ? reason : 'canceled';

    if (conversationId && (isGroupCall || receiver) && currentUser && stompClient && stompClient.connected) {
      try {
        // Send CANCEL WebSocket signal
        const signalPayload = {
          callId: get().callId,
          conversationId,
          callerId: currentUser.id,
          receiverId: isGroupCall ? undefined : receiver?.id,
          type: get().callType.toUpperCase(),
          signalType: 'CANCEL',
          reason: cleanReason
        };

        stompClient.publish({
          destination: '/app/call.cancel',
          body: JSON.stringify(signalPayload)
        });
      } catch (err) {
        console.error('Failed to send cancel call signal:', err);
      }
    }

    audioSynth.playEndCall();
    set({
      callState: 'idle',
      callId: null,
      isGroupCall: false,
      callTitle: null,
      callMemberCount: null,
      conversationId: null,
      caller: null,
      receiver: null,
      remoteUsers: [],
      remoteAudioPlaybackBlocked: false,
      activeSpeakerUids: [],
      localAgoraUid: null,
      callNotices: []
    });
  },

  hangupCall: () => {
    const { conversationId, caller, receiver, activeVoiceChannelId } = get();
    const stompClient = useChatStore.getState().stompClient;
    const currentUser = useAuthStore.getState().user;

    audioSynth.stop();
    get().clearOutgoingRingTimeout();
    get().clearIncomingRingTimeout();
    get().clearTracks();

    if (activeVoiceChannelId && stompClient && stompClient.connected && currentUser) {
      // Handle Voice Channel leave
      stompClient.publish({
        destination: '/app/voice.leave',
        body: JSON.stringify({
          type: 'LEAVE',
          channelId: activeVoiceChannelId,
          userId: currentUser.id
        })
      });
      set((state) => ({
        callState: 'idle',
        activeVoiceChannelId: null,
        isViewingVoiceGrid: false,
        voiceChannelMembers: {
          ...state.voiceChannelMembers,
          [activeVoiceChannelId]: (state.voiceChannelMembers[activeVoiceChannelId] ?? []).filter((id) => id !== currentUser.id)
        }
      }));
      return;
    }

    if (conversationId && stompClient && stompClient.connected && currentUser) {
      try {
        const isGroupCall = get().isGroupCall;
        // Target is caller if we are receiver, or receiver if we are caller
        const targetId = isGroupCall ? undefined : currentUser.id === caller?.id ? receiver?.id : caller?.id;

        // Send HANGUP signal
        const signalPayload = {
          callId: get().callId,
          conversationId,
          callerId: currentUser.id,
          callerName: currentUser.username,
          callerAvatar: currentUser.avatarUrl,
          receiverId: targetId,
          type: get().callType.toUpperCase(),
          signalType: isGroupCall ? 'LEAVE' : 'HANGUP'
        };

        stompClient.publish({
          destination: '/app/call.hangup',
          body: JSON.stringify(signalPayload)
        });

      } catch (err) {
        console.error('Failed to send hangup call signal:', err);
      }
    }

    audioSynth.playEndCall();
    set({
      callState: 'idle',
      callId: null,
      isGroupCall: false,
      callTitle: null,
      callMemberCount: null,
      conversationId: null,
      caller: null,
      receiver: null,
      remoteUsers: [],
      remoteAudioPlaybackBlocked: false,
      activeSpeakerUids: [],
      localAgoraUid: null,
      callNotices: []
    });
  },

  toggleMic: async () => {
    const { localAudioTrack, isMicMuted } = get();
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMicMuted);
      set({ isMicMuted: !isMicMuted });
    }
  },

  toggleCamera: async () => {
    const { localVideoTrack, isCameraMuted, agoraClient, isScreenSharing } = get();

    if (localVideoTrack) {
      await localVideoTrack.setEnabled(isCameraMuted);
      set({ isCameraMuted: !isCameraMuted });
      return;
    }

    if (!agoraClient) return;

    try {
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      set({ localVideoTrack: videoTrack, isCameraMuted: false });
      if (!isScreenSharing) {
        await agoraClient.publish(videoTrack);
      }
    } catch (error) {
      console.warn('Failed to start camera:', error);
    }
  },

  toggleSpeaker: () => {
    const nextSpeakerState = !get().isSpeakerOn;
    get().remoteUsers.forEach((user) => {
      const audioTrack = user.audioTrack as any;
      if (audioTrack?.setVolume) {
        audioTrack.setVolume(nextSpeakerState ? 100 : 0);
      } else if (nextSpeakerState) {
        user.audioTrack?.play();
      } else {
        user.audioTrack?.stop();
      }
    });
    set({ isSpeakerOn: nextSpeakerState });
  },

  toggleChannelSound: () => {
    set({ isChannelSoundEnabled: !get().isChannelSoundEnabled });
  },

  switchCamera: async () => {
    const { localVideoTrack } = get();
    if (!localVideoTrack) return;

    const cameras = await AgoraRTC.getCameras();
    if (cameras.length < 2) return;

    const currentLabel = localVideoTrack.getTrackLabel();
    const currentIndex = cameras.findIndex((camera) => camera.label === currentLabel);
    const nextCamera = cameras[(currentIndex + 1 + cameras.length) % cameras.length] ?? cameras[0];
    await localVideoTrack.setDevice(nextCamera.deviceId);
  },

  startVideo: async () => {
    const { agoraClient, localVideoTrack } = get();
    if (!agoraClient) return;

    set({ callType: 'video' });
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(true);
      set({ isCameraMuted: false });
      return;
    }

    try {
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      set({ localVideoTrack: videoTrack, isCameraMuted: false });
      await agoraClient.publish(videoTrack);
    } catch (error) {
      console.warn('Failed to start video:', error);
    }
  },

  toggleScreenShare: async () => {
    const { isScreenSharing, agoraClient } = get();
    if (!agoraClient) return;

    if (!isScreenSharing) {
      try {
        const screenTrackResult = await AgoraRTC.createScreenVideoTrack({}, 'auto');
        const screenTrack = Array.isArray(screenTrackResult) ? screenTrackResult[0] : screenTrackResult;
        const screenAudio = Array.isArray(screenTrackResult) ? screenTrackResult[1] : null;

        // unpublish local camera track if any
        const { localVideoTrack } = get();
        if (localVideoTrack) {
          await agoraClient.unpublish(localVideoTrack);
        }

        await agoraClient.publish(screenTrackResult);

        // Listen to native "Stop sharing" browser banner button click
        screenTrack.on('track-ended', () => {
          get().stopScreenShare();
        });

        set({
          screenVideoTrack: screenTrack,
          screenAudioTrack: screenAudio,
          isScreenSharing: true
        });
      } catch (err) {
        console.error('Failed to start screen sharing:', err);
      }
    } else {
      await get().stopScreenShare();
    }
  },

  stopScreenShare: async () => {
    const { screenVideoTrack, screenAudioTrack, agoraClient, localVideoTrack, isCameraMuted } = get();
    if (!agoraClient || !screenVideoTrack) return;

    try {
      const tracksToUnpublish: any[] = [screenVideoTrack];
      if (screenAudioTrack) {
        tracksToUnpublish.push(screenAudioTrack);
      }
      await agoraClient.unpublish(tracksToUnpublish);
      screenVideoTrack.close();
      if (screenAudioTrack) {
        screenAudioTrack.close();
      }

      // Republish camera track
      if (localVideoTrack) {
        await agoraClient.publish(localVideoTrack);
        if (isCameraMuted) {
          await localVideoTrack.setEnabled(false);
        }
      }

      set({
        screenVideoTrack: null,
        screenAudioTrack: null,
        isScreenSharing: false
      });
    } catch (err) {
      console.error('Failed to stop screen sharing:', err);
    }
  },

  handleIncomingSignal: (signal) => {
    const signalType = signal.signalType;
    console.info('[STOMP Call Signal]:', signalType, signal);
    const currentUser = useAuthStore.getState().user;
    const { callState, conversationId, caller, receiver, isGroupCall } = get();
    const isSameConversation = Boolean(conversationId && signal.conversationId === conversationId);
    const currentCallId = get().callId;
    const isSameCall = !currentCallId || signal.callId === currentCallId;

    const resetCall = () => {
      get().clearOutgoingRingTimeout();
      get().clearIncomingRingTimeout();
      get().clearGroupAloneTimeout();
      set({
        callState: 'idle',
        callId: null,
        isGroupCall: false,
        callTitle: null,
        callMemberCount: null,
        conversationId: null,
        caller: null,
        receiver: null,
        remoteUsers: [],
        remoteAudioPlaybackBlocked: false,
        activeSpeakerUids: [],
        localAgoraUid: null,
        callNotices: []
      });
    };

    switch (signalType) {
      case 'INVITE':
        if (!currentUser || signal.callerId === currentUser.id) return;
        if (signal.receiverId && signal.receiverId !== currentUser.id) return;
        get().receiveCall(signal);
        break;
      case 'CALL_HANDLED':
        if (
          callState !== 'ringing_incoming' ||
          !isSameConversation ||
          !isSameCall ||
          signal.receiverId !== currentUser?.id
        ) return;
        audioSynth.stop();
        get().clearTracks();
        resetCall();
        break;
      case 'ANSWER':
        if (
          !currentUser ||
          callState !== 'ringing_outgoing' ||
          !isSameConversation ||
          !isSameCall ||
          signal.callerId !== currentUser.id ||
          (!isGroupCall && receiver?.id && signal.receiverId && signal.receiverId !== receiver.id && signal.receiverId !== currentUser.id)
        ) {
          console.info('[STOMP Call Signal]: ignored stale ANSWER', signal);
          return;
        }

        if (signal.accept) {
          audioSynth.stop();
          get().clearOutgoingRingTimeout();
          set({ callState: 'connected' });
          get().joinAgoraChannel().catch((err: any) => {
            console.error('Failed to join Agora channel after accepted answer:', err);
            get().hangupCall();
          });
        } else {
          if (isGroupCall || signal.reason !== 'rejected') {
            console.info('[STOMP Call Signal]: ignored negative ANSWER while outgoing call is ringing', signal);
            return;
          }
          audioSynth.stop();
          audioSynth.playEndCall();
          resetCall();
        }
        break;
      case 'CANCEL':
        if (
          !currentUser ||
          callState !== 'ringing_incoming' ||
          !isSameConversation ||
          !isSameCall ||
          signal.callerId !== caller?.id
        ) {
          console.info('[STOMP Call Signal]: ignored stale CANCEL', signal);
          return;
        }
        audioSynth.stop();
        get().clearTracks();
        audioSynth.playEndCall();
        resetCall();
        break;
      case 'LEAVE':
        if (
          !currentUser ||
          callState !== 'connected' ||
          !isGroupCall ||
          !isSameConversation ||
          !isSameCall ||
          signal.callerId === currentUser.id
        ) {
          console.info('[STOMP Call Signal]: ignored stale LEAVE', signal);
          return;
        }
        get().addCallNotice(`${signal.callerName ?? 'Mot thanh vien'} da roi cuoc goi`);
        break;
      case 'HANGUP':
        if (
          !currentUser ||
          callState !== 'connected' ||
          !isSameConversation ||
          !isSameCall ||
          (signal.receiverId && signal.receiverId !== currentUser.id)
        ) {
          console.info('[STOMP Call Signal]: ignored stale HANGUP', signal);
          return;
        }
        audioSynth.stop();
        get().clearTracks();
        audioSynth.playEndCall();
        resetCall();
        break;
      default:
        break;
    }
  },

  clearTracks: () => {
    const { localAudioTrack, localVideoTrack, screenVideoTrack, agoraClient } = get();
    get().clearGroupAloneTimeout();

    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    if (screenVideoTrack) {
      screenVideoTrack.stop();
      screenVideoTrack.close();
    }
    if (agoraClient) {
      agoraClient.leave().catch((e) => console.warn('Failed to leave Agora channel:', e));
    }

    set({
      localAudioTrack: null,
      localVideoTrack: null,
      screenVideoTrack: null,
      agoraClient: null,
      remoteAudioPlaybackBlocked: false,
      activeSpeakerUids: [],
      localAgoraUid: null
    });
  },

  addCallNotice: (message) => {
    const noticeId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({
      callNotices: [
        ...state.callNotices.filter((notice) => notice.message !== message),
        { id: noticeId, message }
      ].slice(-3)
    }));

    window.setTimeout(() => {
      get().removeCallNotice(noticeId);
    }, 4500);
  },

  removeCallNotice: (noticeId) => {
    set((state) => ({
      callNotices: state.callNotices.filter((notice) => notice.id !== noticeId)
    }));
  },

  clearOutgoingRingTimeout: () => {
    const { outgoingRingTimeoutId } = get();
    if (outgoingRingTimeoutId) {
      window.clearTimeout(outgoingRingTimeoutId);
      set({ outgoingRingTimeoutId: null });
    }
  },

  clearIncomingRingTimeout: () => {
    const { incomingRingTimeoutId } = get();
    if (incomingRingTimeoutId) {
      window.clearTimeout(incomingRingTimeoutId);
      set({ incomingRingTimeoutId: null });
    }
  },

  clearGroupAloneTimeout: () => {
    const timeoutId = get().groupAloneTimeoutId;
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      set({ groupAloneTimeoutId: null });
    }
  },

  scheduleGroupAloneTimeout: () => {
    if (get().groupAloneTimeoutId !== null) return;

    const timeoutId = window.setTimeout(() => {
      const { callState, isGroupCall, remoteUsers } = get();
      if (callState === 'connected' && isGroupCall && remoteUsers.length === 0) {
        get().hangupCall();
      } else {
        set({ groupAloneTimeoutId: null });
      }
    }, 45000);

    set({ groupAloneTimeoutId: timeoutId });
    get().addCallNotice('Chỉ còn bạn trong cuộc gọi. Cuộc gọi sẽ tự kết thúc sau 45s nếu không có ai quay lại.');
  },

  joinAgoraChannel: async () => {
    const { conversationId, callType } = get();
    if (!conversationId) return;

    AgoraRTC.onAutoplayFailed = () => {
      set({ remoteAudioPlaybackBlocked: true });
    };

    // Create Agora RTC client
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    set({ agoraClient: client });

    const playRemoteAudio = (user: IAgoraRTCRemoteUser) => {
      try {
        user.audioTrack?.play();
        set({ remoteAudioPlaybackBlocked: false });
      } catch (error) {
        console.warn('Remote audio playback was blocked by the browser:', error);
        set({ remoteAudioPlaybackBlocked: true });
      }
    };

    const subscribeRemoteUser = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'audio') {
        playRemoteAudio(user);
      }
      set({ remoteUsers: [...client.remoteUsers] });
    };

    // Register listeners before joining/publishing so we do not miss early remote tracks.
    client.on('user-published', (user, mediaType) => {
      if (get().agoraClient !== client) return;
      if (mediaType !== 'audio' && mediaType !== 'video') return;
      get().clearGroupAloneTimeout();
      subscribeRemoteUser(user, mediaType).catch((error) => {
        console.error(`Failed to subscribe remote ${mediaType} track:`, error);
      });
    });

    client.on('user-unpublished', () => {
      if (get().agoraClient !== client) return;
      set({ remoteUsers: [...client.remoteUsers] });
    });

    client.on('user-joined', () => {
      if (get().isChannelSoundEnabled) {
        audioSynth.playUserJoin();
      }
    });

    client.on('user-left', (user) => {
      if (get().isChannelSoundEnabled) {
        audioSynth.playUserLeave();
      }
      if (get().agoraClient !== client) return;
      set({ remoteUsers: [...client.remoteUsers] });

      const { callState, conversationId, isGroupCall } = get();
      if (callState !== 'connected') return;

      if (isGroupCall) {
        const conversation = useChatStore.getState().activeConversation?.id === conversationId
          ? useChatStore.getState().activeConversation
          : useChatStore.getState().conversations.find((item) => item.id === conversationId);
        const member = conversation?.members.find((item) => javaStringHashUid(item.id) === String(user.uid));
        get().addCallNotice(`${member?.username ?? 'Mot thanh vien'} da roi cuoc goi`);

        if (client.remoteUsers.length === 0) {
          get().scheduleGroupAloneTimeout();
        } else {
          get().clearGroupAloneTimeout();
        }
        return;
      }

      // If no remote users are left in a 1-1 call, end the call immediately.
      if (client.remoteUsers.length === 0) {
        get().hangupCall();
      }
    });

    client.on('volume-indicator', (volumes) => {
      if (get().agoraClient !== client) return;
      const activeSpeakerUids = volumes
        .filter((volume) => volume.level > 35)
        .map((volume) => String(volume.uid));
      set({ activeSpeakerUids });
    });

    let token: string;
    let uid: number;
    let channelName: string;

    try {
      // apiClient already prefixes requests with /api.
      const response = await apiClient.get('/calls/token', {
        params: { conversationId }
      });
      ({ token, uid, channelName } = response.data.data);

      await client.join(import.meta.env.VITE_AGORA_APP_ID, channelName, token, uid);
      client.enableAudioVolumeIndicator();
      set({ localAgoraUid: uid });
    } catch (error) {
      set({ agoraClient: null });
      await client.leave().catch(() => undefined);
      throw error;
    }

    // Create local audio and video tracks
    let audioTrack: IMicrophoneAudioTrack | null = null;
    let videoTrack: ICameraVideoTrack | null = null;

    try {
      audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true,
        ANS: true,
        AGC: true
      });
      await audioTrack.setEnabled(true);
      set({ localAudioTrack: audioTrack });
      await client.publish(audioTrack);
    } catch (e) {
      console.warn('Microphone permission denied or not available:', e);
    }

    if (callType === 'video') {
      try {
        videoTrack = await AgoraRTC.createCameraVideoTrack();
        set({ localVideoTrack: videoTrack });
        await client.publish(videoTrack);
      } catch (e) {
        console.warn('Camera permission denied or not available:', e);
      }
    }

    for (const user of client.remoteUsers) {
      if (user.hasAudio) {
        await subscribeRemoteUser(user, 'audio').catch((error) => {
          console.error('Failed to subscribe existing remote audio track:', error);
        });
      }
      if (user.hasVideo) {
        await subscribeRemoteUser(user, 'video').catch((error) => {
          console.error('Failed to subscribe existing remote video track:', error);
        });
      }
    }

    set({ remoteUsers: [...client.remoteUsers] });
  },

  resumeRemoteAudio: async () => {
    const { remoteUsers } = get();
    remoteUsers.forEach((user) => {
      try {
        user.audioTrack?.play();
      } catch (error) {
        console.warn('Failed to resume remote audio:', error);
      }
    });
    set({ remoteAudioPlaybackBlocked: false });
  },

  joinVoiceChannel: async (channelId: string, channelName: string, groupId: string) => {
    if (get().callState !== 'idle') return;

    set({
      callState: 'connected',
      callType: 'voice',
      isGroupCall: true,
      callTitle: channelName,
      activeVoiceChannelId: channelId,
      conversationId: groupId, // Set conversation ID to groupId
      caller: null,
      receiver: null,
      callId: null,
      isViewingVoiceGrid: true,
      isCameraMuted: true // Initialize camera as muted (off) in Voice Channel
    });

    const stompClient = useChatStore.getState().stompClient;
    const currentUser = useAuthStore.getState().user;

    AgoraRTC.onAutoplayFailed = () => {
      set({ remoteAudioPlaybackBlocked: true });
    };

    if (currentUser) {
      set((state) => ({
        voiceChannelMembers: {
          ...state.voiceChannelMembers,
          [channelId]: Array.from(new Set([...(state.voiceChannelMembers[channelId] ?? []), currentUser.id]))
        }
      }));
    }

    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    set({ agoraClient: client });

    const playRemoteAudio = (user: IAgoraRTCRemoteUser) => {
      try {
        user.audioTrack?.play();
        set({ remoteAudioPlaybackBlocked: false });
      } catch (error) {
        set({ remoteAudioPlaybackBlocked: true });
      }
    };

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      const remoteUsers = Array.from(client.remoteUsers);
      set({ remoteUsers });
      if (mediaType === 'audio') playRemoteAudio(user);
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') user.audioTrack?.stop();
      const remoteUsers = Array.from(client.remoteUsers);
      set({ remoteUsers });
    });

    client.on('user-joined', () => {
      if (get().isChannelSoundEnabled) {
        audioSynth.playUserJoin();
      }
      const remoteUsers = Array.from(client.remoteUsers);
      set({ remoteUsers });
    });

    client.on('user-left', () => {
      if (get().isChannelSoundEnabled) {
        audioSynth.playUserLeave();
      }
      const remoteUsers = Array.from(client.remoteUsers);
      set({ remoteUsers });
    });

    client.on('volume-indicator', (volumes) => {
      if (get().agoraClient !== client) return;
      const activeSpeakerUids = volumes
        .filter((volume) => volume.level > 35)
        .map((volume) => String(volume.uid));
      set({ activeSpeakerUids });
    });

    let token: string;
    let uid: number;

    try {
      const response = await apiClient.get('/calls/channel-token', {
        params: { channelId, groupId }
      });
      ({ token, uid } = response.data.data);

      await client.join(import.meta.env.VITE_AGORA_APP_ID, channelId, token, uid);
      client.enableAudioVolumeIndicator();
      set({ localAgoraUid: uid });
      
      // Create local audio track
      try {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: true,
          ANS: true,
          AGC: true
        });
        await audioTrack.setEnabled(true);
        set({ localAudioTrack: audioTrack, isMicMuted: false });
        await client.publish(audioTrack);
      } catch (e) {
        console.warn('Microphone permission denied or not available:', e);
      }

      if (stompClient && stompClient.connected && currentUser) {
        stompClient.publish({
          destination: '/app/voice.join',
          body: JSON.stringify({
            type: 'JOIN',
            channelId,
            groupId,
            userId: currentUser.id
          })
        });
      }
    } catch (error) {
      set((state) => ({
        agoraClient: null,
        callState: 'idle',
        activeVoiceChannelId: null,
        voiceChannelMembers: currentUser ? {
          ...state.voiceChannelMembers,
          [channelId]: (state.voiceChannelMembers[channelId] ?? []).filter((id) => id !== currentUser.id)
        } : state.voiceChannelMembers
      }));
      await client.leave().catch(() => undefined);
      throw error;
    }
  },

  updateVoiceChannelMembers: (channelId: string, members: string[]) => {
    set((state) => ({
      voiceChannelMembers: {
        ...state.voiceChannelMembers,
        [channelId]: members
      }
    }));
  },

  handleVoiceChannelEvent: (event: any) => {
    if (event.type === 'JOIN' || event.type === 'LEAVE') {
      get().updateVoiceChannelMembers(event.channelId, event.currentMembers || []);
    }
  },

  setIsViewingVoiceGrid: (isViewing: boolean) => {
    set({ isViewingVoiceGrid: isViewing });
  }
}));
