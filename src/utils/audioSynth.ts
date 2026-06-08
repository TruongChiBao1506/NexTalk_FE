class AudioSynth {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;

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

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const audioSynth = new AudioSynth();
