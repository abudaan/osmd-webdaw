import { mapNotes } from "../../util/note_mapping";
import { AppState } from "../../types";
import { store } from "../store";

export const connectScoreAndInterpretation = () => {
  const state = store.getState() as AppState;
  const { scores, selectedScoreIndex, currentInterpretation, currentScore } = state;
  const score = scores[selectedScoreIndex - 1];
  let mapping = {};
  // console.log(currentScore.notesPerBar[0]);
  if (currentInterpretation && currentScore) {
    mapping = mapNotes(currentScore.notesPerBar, score.repeats, currentInterpretation.song);
    console.log(mapping);
  }
  return {
    type: "NO_ACTION_REQUIRED",
  };
};
