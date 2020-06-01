import { AppState } from "./store";
import { MUSICXML_LOADED } from "./actions1";

export const rootReducer = (state: AppState, action: any) => {
  if (action.type === MUSICXML_LOADED) {
    return {
      ...state,
      scores: [...state.scores, action.payload],
    };
  }
  return state;
};
