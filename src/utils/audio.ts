let audioCtx: AudioContext | null = null;

export const playSubtleClick = () => {
  try {
    // Check if browser supports AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    // Lazy initialize to bypass autoplay restrictions until a user action occurs
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Subtle, high-quality wooden/metallic tactile click
    osc.type = 'sine';
    
    // High frequency falling rapidly to simulate a physical mechanical toggle click
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.03);

    // Fade out extremely fast to prevent popping or distortion
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (error) {
    console.warn("AudioContext feedback failed:", error);
  }
};

export const playMachineStart = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    
    // Play an ascending positive arpeggio: C5 -> E5 -> G5 (523.25Hz, 659.25Hz, 783.99Hz)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = audioCtx!.createOscillator();
      const gainNode = audioCtx!.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx!.destination);
      
      osc.type = 'triangle'; // warmer than sine wave
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.26);
    });
  } catch (error) {
    console.warn("playMachineStart failed:", error);
  }
};

export const playMachineSuccess = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    
    // Celebratory harmonic major chord (C5 - E5 - G5 - C6) with rich ambient decay
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = audioCtx!.createOscillator();
      const subOsc = audioCtx!.createOscillator();
      const gainNode = audioCtx!.createGain();
      
      osc.connect(gainNode);
      subOsc.connect(gainNode);
      gainNode.connect(audioCtx!.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(freq / 2, now + idx * 0.06); // warm suboctave
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08 / notes.length, now + idx * 0.06 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.8);
      
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.9);
      
      subOsc.start(now + idx * 0.06);
      subOsc.stop(now + idx * 0.06 + 0.9);
    });
  } catch (error) {
    console.warn("playMachineSuccess failed:", error);
  }
};

export const playMachineFailure = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    
    // Low, dark descending caution tone with slightly buzzy sound filtering
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(220, now); // A3
    osc1.frequency.linearRampToValueAtTime(110, now + 0.4); // Slide down to A2
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(223, now); // slightly detuned for chorus fatness
    osc2.frequency.linearRampToValueAtTime(111.5, now + 0.4);
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc1.start(now);
    osc1.stop(now + 0.5);
    
    osc2.start(now);
    osc2.stop(now + 0.5);
  } catch (error) {
    console.warn("playMachineFailure failed:", error);
  }
};
