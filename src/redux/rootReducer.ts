import { AppState } from "../types";
import {
  MUSICXML_LOADED,
  MIDIFILE_LOADED,
  MUSICXML_SELECTED,
  MIDIFILE_SELECTED,
  SET_TRANSPORT,
  SET_PROGRESS,
} from "../constants";

export const rootReducer = (state: AppState, action: any): AppState => {
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
      currentInterpretation: action.payload.currentInterpretation,
      durationTimeline: action.payload.durationTimeline,
    };
  } else if (action.type === SET_TRANSPORT) {
    return {
      ...state,
      transport: action.payload.transport,
      playheadMillis: action.payload.playheadMillis,
      currentInterpretation: action.payload.currentInterpretation,
    };
  } else if (action.type === SET_PROGRESS) {
    const { progress, playheadMillis, currentInterpretation } = action.payload;
    return {
      ...state,
      // progress,
      playheadMillis,
      currentInterpretation,
    };
  }

  return state;
};
