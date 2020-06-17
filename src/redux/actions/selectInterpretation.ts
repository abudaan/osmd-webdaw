import { MIDIFILE_SELECTED } from "../../constants";
import { store } from "../store";
import { AppState } from "../../types";

export const selectInterpretation = (index: number) => {
  const state = store.getState() as AppState;
  const { interpretations } = state;
  const { file, name } = interpretations[index - 1];
  const currentInterpretation = {
    id: name,
    song: file,
    timestamp: 0,
    millis: 0,
    index: 0,
    scheduled: [],
  };
  return {
    type: MIDIFILE_SELECTED,
    payload: {
      index,
      currentInterpretation,
    },
  };
};
