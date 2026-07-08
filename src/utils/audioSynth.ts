class AudioSynth {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;
  private lastMessageNotificationAt = 0;

  private initCtx() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playIncomingRing() {
    this.stop();
    this.initCtx();
    const playPattern = () => {
      if (!this.audioCtx) return;
      
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.frequency.setValueAtTime(400, this.audioCtx.currentTime);
      osc2.frequency.setValueAtTime(450, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      // Fade in
      gain.gain.linearRampToValueAtTime(0.15, this.audioCtx.currentTime + 0.1);
      // Ring first part
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime + 0.6);
      gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.7);

      // Ring second part
      gain.gain.linearRampToValueAtTime(0.15, this.audioCtx.currentTime + 0.9);
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime + 1.4);
      gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.5);

      osc1.start();
      osc2.start();
      osc1.stop(this.audioCtx.currentTime + 1.6);
      osc2.stop(this.audioCtx.currentTime + 1.6);
    };

    playPattern();
    this.intervalId = setInterval(playPattern, 3000);
  }

  playOutgoingRing() {
    this.stop();
    this.initCtx();
    const playPattern = () => {
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime + 1.1);
      gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.2);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 1.3);
    };

    playPattern();
    this.intervalId = setInterval(playPattern, 2500);
  }

  playEndCall() {
    this.stop();
    this.initCtx();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.3);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.35);
  }

  playMessageNotification() {
    const now = Date.now();
    if (now - this.lastMessageNotificationAt < 600) return;
    this.lastMessageNotificationAt = now;

    this.initCtx();
    if (!this.audioCtx) return;

    const playTone = (frequency: number, startOffset: number, duration: number, volume: number) => {
      if (!this.audioCtx) return;

      const startAt = this.audioCtx.currentTime + startOffset;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startAt);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      gain.gain.setValueAtTime(0.001, startAt);
      gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

      osc.start(startAt);
      osc.stop(startAt + duration + 0.03);
    };

    playTone(880, 0, 0.16, 0.09);
    playTone(1175, 0.11, 0.18, 0.075);
  }

  playUserJoin() {
    this.initCtx();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    // A pleasant "ding" sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
  }

  playUserLeave() {
    this.initCtx();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    // A subtle "pop" down sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.2);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const audioSynth = new AudioSynth();
