export type AudioEvent = {
  audioBuffer: AudioBuffer;
  audioNode: AudioBufferSourceNode;
  gainNode: GainNode;
  pannerNode: StereoPannerNode;
  // todo: more effects can be added such as reverb
  start: number;
  offset: number;
  duration: number;
  volume: number;
  panning: number;
};

export const startAudioEvent = (audioContext: AudioContext, audioEvent: AudioEvent): AudioEvent => {
  // console.log("create audio node");
  const audioNode = audioContext.createBufferSource();
  audioNode.buffer = audioEvent.audioBuffer;
  audioEvent.gainNode.gain.setValueAtTime(audioEvent.volume, audioContext.currentTime);
  audioEvent.pannerNode.pan.setValueAtTime(audioEvent.panning, audioContext.currentTime);
  audioNode
    .connect(audioEvent.gainNode)
    .connect(audioEvent.pannerNode)
    .connect(audioContext.destination);

  audioNode.start(audioEvent.start, audioEvent.offset, audioEvent.duration);

  return {
    ...audioEvent,
    audioNode,
  };
};

export const stopAudioEvent = (audioEvent: AudioEvent, stopParams?: any): AudioEvent => {
  // todo: add stop params such as when to stop and fade out
  audioEvent.audioNode.stop();
  return {
    ...audioEvent,
    audioNode: null,
  };
};
