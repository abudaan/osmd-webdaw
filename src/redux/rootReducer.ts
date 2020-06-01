import { AppState } from "./store";
import { MUSICXML_LOADED, MIDIFILE_LOADED } from "../contants";

export const rootReducer = (state: AppState, action: any) => {
  if (action.type === MUSICXML_LOADED) {
    return {
      ...state,
      scores: [...state.scores, action.payload],
    };
  } else if (action.type === MIDIFILE_LOADED) {
    return {
      ...state,
      interpretations: [...state.interpretations, action.payload],
    };
  }

  return state;
};
