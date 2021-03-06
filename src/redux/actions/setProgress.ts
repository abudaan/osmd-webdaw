import { store } from "../store";
import { AppState } from "../../types";
import { SET_PROGRESS } from "../../constants";
import { playMIDI } from "../../controlMIDI";
import { setStaveNoteColor } from "../../webdaw/osmd/setGraphicalNoteColor";

export const setProgress = (progress: number) => {
  const state = store.getState() as AppState;
  const {
    playheadMillis,
    currentInterpretation,
    durationTimeline,
    loop,
    loopStart,
    loopEnd,
    currentScore,
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
  if (currentScore) {
    const { noteMapping } = currentScore;
    if (noteMapping) {
      const { activeNotes, passiveNotes, song } = clone;
      // console.log(song.notes);
      // console.log(noteMapping);
      try {
        activeNotes.forEach(n => {
          // console.log(n, noteMapping);
          const { element, musicSystem } = noteMapping[n.id];
          setStaveNoteColor(element, "red");
        });
        passiveNotes.forEach(n => {
          const { element, musicSystem } = noteMapping[n.id];
          // console.log("passive", n.id);
          console.log(musicSystem);
          setStaveNoteColor(element, "black");
        });
      } catch (e) {
        // console.warn("no match");
      }
    }
  }

  return {
    type: SET_PROGRESS,
    payload: {
      progress,
      playheadMillis: millis,
      currentInterpretation: clone,
    },
  };
};
