import { mapNotes } from "../../util/note_mapping";
import { AppState } from "../../types";
import { store } from "../store";
import { setStaveNoteColor } from "../../util/osmd-stavenote-color";

export const resetScore = () => {
  const state = store.getState() as AppState;
  const { currentScore } = state;
  const { noteMapping } = currentScore;
  // console.log(noteMapping);
  Object.keys(noteMapping).forEach((key: string) => {
    const { vfnote } = noteMapping[key];
    setStaveNoteColor(vfnote["attrs"].el, "black");
  });
  return {
    type: "",
    payload: {
      // mapping,
    },
  };
};
