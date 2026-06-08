import { create } from 'zustand';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';
import { useChatStore } from './chatStore';
import { useAuthStore } from './authStore';
import { apiClient } from '../api/apiClient';
import { audioSynth } from '../utils/audioSynth';

type CallState = 'idle' | 'ringing_incoming' | 'ringing_outgoing' | 'connected';
type CallType = 'voice' | 'video';

interface CallStore {
  callState: CallState;
  callType: CallType;
  conversationId: string | null;
  caller: { id: string; username: string; avatarUrl?: string } | null;
  receiver: { id: string; username: string; avatarUrl?: string } | null;
  
  isMicMuted: boolean;
  isCameraMuted: boolean;
  isScreenSharing: boolean;
  
  remoteUsers: IAgoraRTCRemoteUser[];
  
  agoraClient: IAgoraRTCClient | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  localVideoTrack: ICameraVideoTrack | null;
  screenVideoTrack: ILocalVideoTrack | null;

  initiateCall: (conversationId: string, callType: CallType, partner: any) => void;
  receiveCall: (signal: any) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  cancelCall: () => void;
  hangupCall: () => void;
  
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  handleIncomingSignal: (signal: any) => void;
  clearTracks: () => void;
}

export const useCallStore = create<CallStore>((set, get) => ({
  callState: 'idle',
  callType: 'voice',
  conversationId: null,
  caller: null,
  receiver: null,
  
  isMicMuted: false,
  isCameraMuted: false,
  isScreenSharing: false,
  
  remoteUsers: [],
  
  agoraClient: null,
  localAudioTrack: null,
  localVideoTrack: null,
  screenVideoTrack: null,

  initiateCall: (conversationId, callType, partner) => {
    const currentUser = useAuthStore.getState().user;
    const stompClient = useChatStore.getState().stompClient;
    if (!currentUser || !stompClient || !stompClient.connected) return;

    // Set call states
    set({
      callState: 'ringing_outgoing',
      callType,
      conversationId,
      receiver: partner,
      caller: {
        id: currentUser.id,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl
      },
      isMicMuted: false,
      isCameraMuted: false,
      isScreenSharing: false,
      remoteUsers: []
    });

    audioSynth.playOutgoingRing();

    // Send INVITE WebSocket signal
    const signalPayload = {
      conversationId,
      callerId: currentUser.id,
      receiverId: partner.id,
      type: callType.toUpperCase(),
      signalType: 'INVITE'
    };

    stompClient.publish({
      destination: '/app/call.invite',
      body: JSON.stringify(signalPayload)
    });
  },

  receiveCall: (signal) => {
    const currentCallState = get().callState;
    const stompClient = useChatStore.getState().stompClient;

    if (currentCallState !== 'idle') {
      // Send BUSY response if already in a call
      if (stompClient && stompClient.connected) {
        stompClient.publish({
          destination: '/app/call.answer',
          body: JSON.stringify({
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
      conversationId: signal.conversationId,
      caller: {
        id: signal.callerId,
        username: signal.callerName,
        avatarUrl: signal.callerAvatar
      },
      isMicMuted: false,
      isCameraMuted: false,
      isScreenSharing: false,
      remoteUsers: []
    });

    audioSynth.playIncomingRing();
  },

  acceptCall: async () => {
    const { conversationId, caller, receiver, callType } = get();
    const stompClient = useChatStore.getState().stompClient;
    const currentUser = useAuthStore.getState().user;
    if (!conversationId || !caller || !currentUser || !stompClient || !stompClient.connected) return;

    audioSynth.stop();

    // Set callState immediately to connected to prevent receiving other calls
    set({ callState: 'connected' });

    // Send ANSWER signal with accept = true
    const signalPayload = {
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
    if (!conversationId || !caller || !currentUser || !stompClient || !stompClient.connected) return;

    audioSynth.stop();

    // Send ANSWER signal with accept = false
    const signalPayload = {
      conversationId,
      callerId: caller.id,
      receiverId: currentUser.id,
      type: get().callType.toUpperCase(),
      signalType: 'ANSWER',
      accept: false
    };

    stompClient.publish({
      destination: '/app/call.answer',
      body: JSON.stringify(signalPayload)
    });

    audioSynth.playEndCall();
    set({
      callState: 'idle',
      conversationId: null,
      caller: null,
      receiver: null,
      remoteUsers: []
    });
  },

  cancelCall: () => {
    const { conversationId, receiver } = get();
    const stompClient = useChatStore.getState().stompClient;
    const currentUser = useAuthStore.getState().user;
    if (!conversationId || !receiver || !currentUser || !stompClient || !stompClient.connected) return;

    audioSynth.stop();

    // Send CANCEL WebSocket signal
    const signalPayload = {
      conversationId,
      callerId: currentUser.id,
      receiverId: receiver.id,
      type: get().callType.toUpperCase(),
      signalType: 'CANCEL'
    };

    stompClient.publish({
      destination: '/app/call.cancel',
      body: JSON.stringify(signalPayload)
    });

    audioSynth.playEndCall();
    set({
      callState: 'idle',
      conversationId: null,
      caller: null,
      receiver: null,
      remoteUsers: []
    });
  },

  hangupCall: () => {
    const { conversationId, caller, receiver } = get();
    const stompClient = useChatStore.getState().stompClient;
    const currentUser = useAuthStore.getState().user;
    
    audioSynth.stop();
    get().clearTracks();

    if (conversationId && stompClient && stompClient.connected && currentUser) {
      // Target is caller if we are receiver, or receiver if we are caller
      const targetId = currentUser.id === caller?.id ? receiver?.id : caller?.id;

      // Send HANGUP signal
      const signalPayload = {
        conversationId,
        callerId: currentUser.id,
        receiverId: targetId,
        type: get().callType.toUpperCase(),
        signalType: 'HANGUP'
      };

      stompClient.publish({
        destination: '/app/call.hangup',
        body: JSON.stringify(signalPayload)
      });
    }

    audioSynth.playEndCall();
    set({
      callState: 'idle',
      conversationId: null,
      caller: null,
      receiver: null,
      remoteUsers: []
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
    const { localVideoTrack, isCameraMuted, callType } = get();
    if (callType !== 'video') return;

    if (localVideoTrack) {
      await localVideoTrack.setEnabled(isCameraMuted);
      set({ isCameraMuted: !isCameraMuted });
    }
  },

  toggleScreenShare: async () => {
    const { isScreenSharing, screenVideoTrack, agoraClient } = get();
    if (!agoraClient) return;

    if (!isScreenSharing) {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, 'auto');
        
        // unpublish local camera track if any
        const { localVideoTrack } = get();
        if (localVideoTrack) {
          await agoraClient.unpublish(localVideoTrack);
        }

        await agoraClient.publish(screenTrack);
        
        // Listen to native "Stop sharing" browser banner button click
        screenTrack.on('track-ended', () => {
          get().stopScreenShare();
        });

        set({
          screenVideoTrack: screenTrack,
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
    const { screenVideoTrack, agoraClient, localVideoTrack, isCameraMuted } = get();
    if (!agoraClient || !screenVideoTrack) return;

    try {
      await agoraClient.unpublish(screenVideoTrack);
      screenVideoTrack.close();

      // Republish camera track
      if (localVideoTrack) {
        await agoraClient.publish(localVideoTrack);
        if (isCameraMuted) {
          await localVideoTrack.setEnabled(false);
        }
      }

      set({
        screenVideoTrack: null,
        isScreenSharing: false
      });
    } catch (err) {
      console.error('Failed to stop screen sharing:', err);
    }
  },

  handleIncomingSignal: (signal) => {
    const signalType = signal.signalType;
    console.info('[STOMP Call Signal]:', signalType, signal);

    switch (signalType) {
      case 'INVITE':
        get().receiveCall(signal);
        break;
      case 'ANSWER':
        if (signal.accept) {
          audioSynth.stop();
          set({ callState: 'connected' });
          get().joinAgoraChannel().catch((err) => {
            console.error('Failed to join Agora channel after accepted answer:', err);
            get().hangupCall();
          });
        } else {
          audioSynth.stop();
          audioSynth.playEndCall();
          set({
            callState: 'idle',
            conversationId: null,
            caller: null,
            receiver: null,
            remoteUsers: []
          });
        }
        break;
      case 'CANCEL':
      case 'HANGUP':
        audioSynth.stop();
        get().clearTracks();
        audioSynth.playEndCall();
        set({
          callState: 'idle',
          conversationId: null,
          caller: null,
          receiver: null,
          remoteUsers: []
        });
        break;
      default:
        break;
    }
  },

  clearTracks: () => {
    const { localAudioTrack, localVideoTrack, screenVideoTrack, agoraClient } = get();
    
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
      agoraClient: null
    });
  },

  joinAgoraChannel: async () => {
    const { conversationId, callType } = get();
    if (!conversationId) return;

    // Create Agora RTC client
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    set({ agoraClient: client });

    // Request token & numeric UID from backend API
    const response = await apiClient.get(`/api/calls/token?conversationId=${conversationId}`);
    const { token, uid, channelName } = response.data.data;
    
    // Join Agora channel
    await client.join('01771010db7946528839c48bdabe28f5', channelName, token, uid);

    // Create local audio and video tracks
    let audioTrack: IMicrophoneAudioTrack | null = null;
    let videoTrack: ICameraVideoTrack | null = null;

    try {
      audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
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

    // Set up remote user publish events
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        set({ remoteUsers: [...client.remoteUsers] });
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        set({ remoteUsers: [...client.remoteUsers] });
      }
    });

    client.on('user-left', (user) => {
      set({ remoteUsers: [...client.remoteUsers] });
      // If no remote users are left in a 1-1 call, end the call
      if (client.remoteUsers.length === 0) {
        get().hangupCall();
      }
    });

    set({ remoteUsers: [...client.remoteUsers] });
  }
}));
