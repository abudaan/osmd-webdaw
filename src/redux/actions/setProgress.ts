import { store } from "../store";
import { AppState } from "../../types";
import { SET_PROGRESS } from "../../constants";
import { playMIDI } from "../../controlMIDI";

export const setProgress = (progress: number) => {
  const state = store.getState() as AppState;
  const { playheadMillis, currentInterpretation } = state;

  const millis = playheadMillis + progress;
  const { song } = currentInterpretation;
  const duration = song.events[song.events.length - 1].millis;

  if (millis >= duration) {
    return {
      type: SET_PROGRESS,
      payload: {
        progress,
        playheadMillis: duration,
        currentInterpretation,
      },
    };
  }

  const clone = playMIDI(currentInterpretation);

  return {
    type: SET_PROGRESS,
    payload: {
      progress,
      playheadMillis: millis,
      currentInterpretation: clone,
    },
  };
};
