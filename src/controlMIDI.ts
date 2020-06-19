import { RefMIDI } from "./types";
import { getCurrentEventIndex, schedule } from "./webdaw/scheduler";
import { midiAccess } from "./media";
import { unschedule } from "./webdaw/unschedule";
import { getActiveEvents } from "./webdaw/getActiveEvents";

export const startMIDI = (reference: RefMIDI, position: number): RefMIDI => {
  reference.timestamp = performance.now();
  reference.millis = position;
  const i = getCurrentEventIndex(reference.song, position);
  reference.indexScheduler = i;
  reference.indexHighlighter = i;
  // console.log("START", reference.millis, position);
  return reference;
};

export const playMIDI = (
  reference: RefMIDI,
  millis: number,
  resetIndex: boolean = false
): RefMIDI => {
  let idx = -1;
  if (resetIndex) {
    idx = getCurrentEventIndex(reference.song, millis);
  }
  const { index: indexScheduler, scheduled } = schedule({
    song: reference.song,
    millis,
    index: resetIndex ? idx : reference.indexScheduler,
    outputs: midiAccess?.outputs,
  });
  const { index: indexHighlighter, activeEvents, passiveEvents } = getActiveEvents({
    song: reference.song,
    millis,
    index: resetIndex ? idx : reference.indexHighlighter,
  });

  // const ts = performance.now();
  // reference.millis += ts - reference.timestamp;
  // console.log("MIDI", ts - reference.timestamp);
  // reference.timestamp = ts;
  // console.log(index);
  return {
    ...reference,
    indexScheduler,
    indexHighlighter,
    scheduled,
    activeEvents,
    passiveEvents,
  };
};

export const stopMIDI = (reference: RefMIDI): RefMIDI => {
  // unschedule(reference.song, reference.scheduled, midiAccess?.outputs);
  unschedule(reference.song, midiAccess?.outputs);
  reference.indexScheduler = 0;
  reference.millis = 0;
  reference.scheduled = [];
  return reference;
};
