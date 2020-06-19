import { RefMIDI } from "./types";
import { getSchedulerIndex, schedule } from "./webdaw/scheduler";
import { midiAccess } from "./media";
import { unschedule } from "./webdaw/unschedule";

export const startMIDI = (reference: RefMIDI, position: number): RefMIDI => {
  reference.timestamp = performance.now();
  reference.millis = position;
  reference.index = getSchedulerIndex(reference.song, position);
  // console.log("START", reference.millis, position);
  return reference;
};

export const playMIDI = (
  reference: RefMIDI,
  millis: number,
  resetIndex: boolean = false
): RefMIDI => {
  let idx = resetIndex ? getSchedulerIndex(reference.song, millis) : reference.index;
  const { index, scheduled } = schedule({
    song: reference.song,
    // millis: reference.millis,
    millis,
    index: idx,
    outputs: midiAccess?.outputs,
  });
  const ts = performance.now();
  reference.millis += ts - reference.timestamp;
  // console.log("MIDI", ts - reference.timestamp);
  reference.timestamp = ts;
  reference.index = index;
  reference.scheduled = scheduled;
  // console.log(index);
  return reference;
};

export const stopMIDI = (reference: RefMIDI): RefMIDI => {
  // unschedule(reference.song, reference.scheduled, midiAccess?.outputs);
  unschedule(reference.song, midiAccess?.outputs);
  reference.index = 0;
  reference.millis = 0;
  reference.scheduled = [];
  return reference;
};
