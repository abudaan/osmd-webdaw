import { AppState } from "../types";
import {
  MUSICXML_LOADED,
  MIDIFILE_LOADED,
  MUSICXML_SELECTED,
  MIDIFILE_SELECTED,
  SET_TRANSPORT,
  SET_PROGRESS,
  SCORE_READY,
  SET_NOTEMAPPING,
  SELECTED_NOTE,
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
      // currentScore
    };
  } else if (action.type === MIDIFILE_SELECTED) {
    return {
      ...state,
      selectedInterpretationIndex: action.payload.index,
      currentInterpretation: action.payload.currentInterpretation,
      durationTimeline: action.payload.durationTimeline,
    };
  } else if (action.type === SCORE_READY) {
    return {
      ...state,
      currentScore: {
        noteMapping: null,
        notesPerBar: action.payload.notesPerBar,
        scoreContainer: action.payload.scoreContainer,
        scoreContainerOffsetY: action.payload.scoreContainerOffsetY,
      },
    };
  } else if (action.type === SET_NOTEMAPPING) {
    return {
      ...state,
      currentScore: {
        ...state.currentScore,
        noteMapping: action.payload.mapping,
      },
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
  } else if (action.type === SELECTED_NOTE) {
    let data = null;
    const { id } = action.payload;
    if (state.currentInterpretation && state.currentInterpretation.song) {
      console.log(state.currentInterpretation.song.notes);
      const index = state.currentInterpretation.song.notes.findIndex(note => note.id === id);
      if (index !== -1) {
        const { bar, ticks, noteNumber } = state.currentInterpretation.song.notes[index].noteOn;
        data = { bar, ticks, noteNumber };
      }
    }
    return {
      ...state,
      selectedNoteData: data,
    };
  }

  return state;
};
