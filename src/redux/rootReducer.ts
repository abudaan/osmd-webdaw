import { AppState } from "./store";
import {
  MUSICXML_LOADED,
  MIDIFILE_LOADED,
  MUSICXML_SELECTED,
  MIDIFILE_SELECTED,
} from "../contants";

export const rootReducer = (state: AppState, action: any) => {
  if (action.type === MUSICXML_LOADED) {
    return {
      ...state,
      scores: [...state.scores, action.payload.score],
      interpretations: [...state.interpretations, action.payload.interpretation],
    };
  } else if (action.type === MIDIFILE_LOADED) {
    return {
      ...state,
      interpretations: [...state.interpretations, action.payload.interpretation],
    };
  } else if (action.type === MUSICXML_SELECTED) {
    return {
      ...state,
      selectedScoreIndex: action.payload.index,
    };
  } else if (action.type === MIDIFILE_SELECTED) {
    return {
      ...state,
      selectedInterpretationIndex: action.payload.index,
    };
  }

  return state;
};
