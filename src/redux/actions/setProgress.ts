import { store } from "../store";
import { AppState } from "../../types";
import { SET_PROGRESS } from "../../constants";
import { playMIDI } from "../../controlMIDI";

export const setProgress = (progress: number) => {
  const state = store.getState() as AppState;
  const {
    playheadMillis,
    currentInterpretation,
    durationTimeline,
    loop,
    loopStart,
    loopEnd,
  } = state;

  let millis = playheadMillis + progress;

  if (millis >= durationTimeline) {
    return {
      type: SET_PROGRESS,
      payload: {
        progress,
        playheadMillis: durationTimeline,
        currentInterpretation,
      },
    };
  }

  let resetIndex = false;

  if (loop === true) {
    if (millis >= loopEnd) {
      const diff = loopEnd - millis;
      millis = loopStart + diff;
      resetIndex = true;
    }
  }

  // console.log("PROGRESS", progress);
  const clone = playMIDI(currentInterpretation, millis, resetIndex);

  return {
    type: SET_PROGRESS,
    payload: {
      progress,
      playheadMillis: millis,
      currentInterpretation: clone,
    },
  };
};
