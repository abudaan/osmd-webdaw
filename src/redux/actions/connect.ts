import { mapNotes } from "../../util/note_mapping";
import { AppState } from "../../types";
import { store } from "../store";
import { SET_NOTEMAPPING } from "../../constants";

export const connectScoreAndInterpretation = () => {
  const state = store.getState() as AppState;
  const { scores, selectedScoreIndex, currentInterpretation, currentScore } = state;
  const score = scores[selectedScoreIndex - 1];
  let mapping = {};
  // console.log(currentScore.notesPerBar[0]);
  if (currentInterpretation && currentScore) {
    mapping = mapNotes(currentScore.notesPerBar, score.repeats, currentInterpretation.song);
    // console.log(currentInterpretation.song.notes);
    Object.keys(mapping).forEach(key => {
      const { vfnote } = mapping[key];
      vfnote["attrs"].el.addEventListener("click", (e: Event) => {
        const index = currentInterpretation.song.notes.findIndex(note => note.id === key);
        // const event: NoteOnEvent = currentInterpretation.song.notes[index].noteOn;
        const { ticks, noteNumber, channel, bar } = currentInterpretation.song.notes[index].noteOn;
        console.log(key, ticks, noteNumber, bar, channel);
      });
    });
  }
  return {
    type: SET_NOTEMAPPING,
    payload: {
      mapping,
    },
  };
};
