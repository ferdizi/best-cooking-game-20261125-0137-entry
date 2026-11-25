// WOK HEI — all sound is synthesized with WebAudio. No audio files exist,
// so the game loads nothing over the network and every sound is original.
export function createAudio() {
  let ctx = null;
  let master = null;
  let sizzleNodes = null;
  let muted = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ensure() || muted) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol || 0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      // Sound is garnish; a failure never breaks the game.
    }
  }

  function noise(dur, vol, filterFreq) {
    if (!ensure() || muted) return;
    try {
      const t = ctx.currentTime;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq || 1800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol || 0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(master);
      src.start(t);
    } catch {
      // Sound is garnish; a failure never breaks the game.
    }
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.sizzleStop();
      return muted;
    },
    pickup() {
      tone(520, 0.09, 'triangle', 0.18, 760);
    },
    chop() {
      noise(0.08, 0.3, 2400);
    },
    chopDone() {
      tone(660, 0.08, 'triangle', 0.18);
      tone(880, 0.12, 'triangle', 0.15);
    },
    wokIn() {
      noise(0.25, 0.3, 900);
    },
    ding() {
      tone(880, 0.18, 'sine', 0.22);
      tone(1318, 0.3, 'sine', 0.18);
    },
    error() {
      tone(180, 0.22, 'sawtooth', 0.14, 120);
    },
    order() {
      tone(740, 0.1, 'triangle', 0.16);
      tone(988, 0.14, 'triangle', 0.14);
    },
    serve() {
      tone(523, 0.1, 'triangle', 0.2);
      tone(659, 0.1, 'triangle', 0.2);
      tone(784, 0.22, 'triangle', 0.2);
    },
    over() {
      tone(392, 0.25, 'triangle', 0.2);
      tone(330, 0.25, 'triangle', 0.2);
      tone(262, 0.5, 'triangle', 0.2);
    },
    sizzleStart() {
      if (!ensure() || muted || sizzleNodes) return;
      try {
        const len = ctx.sampleRate;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2800;
        const g = ctx.createGain();
        g.gain.value = 0.06;
        src.connect(filter);
        filter.connect(g);
        g.connect(master);
        src.start();
        sizzleNodes = { src, g };
      } catch {
        sizzleNodes = null;
      }
    },
    sizzleStop() {
      if (!sizzleNodes) return;
      try {
        sizzleNodes.src.stop();
      } catch {
        // Already stopped.
      }
      sizzleNodes = null;
    },
  };
}
