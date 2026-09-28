/**
 * audio.ts — Web Audio API sounds for the train game.
 * Generates satisfying train horn and crashing sounds synthetically.
 */

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export function playTrainHorn() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  // A satisfying train horn is a chord (e.g. minor 7th)
  // Base frequencies for a typical train horn (e.g., Nathan AirChime K3LA: ~311Hz, 370Hz, 494Hz)
  const freqs = [311.13, 369.99, 415.30, 493.88]; 
  
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05); // quick attack
  masterGain.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.3); // sustain
  masterGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8); // fade out
  masterGain.connect(audioCtx.destination);

  freqs.forEach(freq => {
    const osc = audioCtx.createOscillator();
    osc.type = "sawtooth"; // Rich harmonics for horn
    osc.frequency.value = freq;
    
    // Add a slight lowpass filter to make it less harsh
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2000;
    
    osc.connect(filter);
    filter.connect(masterGain);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.9);
  });
}

export function playCrashSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  // Crashing sound: noise burst + low thud
  const dur = 0.5;
  const masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  
  // 1. Thud (low frequency sine sweeping down)
  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.2);
  
  const oscGain = audioCtx.createGain();
  oscGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  
  osc.connect(oscGain);
  oscGain.connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
  
  // 2. Crunch (filtered white noise)
  const bufferSize = audioCtx.sampleRate * dur;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 1000;
  noiseFilter.Q.value = 0.5;
  
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
  
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  
  noiseSource.start();
}

export function playWinSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const notes = [523.25, 659.25, 783.99, 1046.50];
  const now = audioCtx.currentTime;
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + i * 0.15);
    gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.7);
  });
}

export function playLoseSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const notes = [311.13, 277.18, 233.08, 155.56];
  const now = audioCtx.currentTime;
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + i * 0.3);
    if (i === notes.length - 1) {
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + i * 0.3 + 1.5);
    }
    gain.gain.setValueAtTime(0, now + i * 0.3);
    gain.gain.linearRampToValueAtTime(0.3, now + i * 0.3 + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 1.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.3);
    osc.stop(now + i * 0.3 + 1.5);
  });
}
