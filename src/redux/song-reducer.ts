import {
  SCORE_READY,
  SONG_READY,
  UPDATE_SONG_ACTION,
  POSITION_SLIDER_CHANGED,
  UPDATE_NOTE_MAPPING,
  PLAYHEAD_SEEKING,
  UPDATE_PLAYHEAD_MILLIS,
  XMLDOC_UPLOADED,
} from './actions';

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay/build/dist/src';
import { TypeGraphicalNoteData } from '../util/osmd-notes';
import { NoteMapping } from 'src/util/osmd-heartbeat';

export const SongActions = {
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  STOP: 'STOP',
}

export type SongState = {
  songPosition: string,
  songPositionMillis: number,
  songPositionPercentage: number,
  sliderPositionPercentage: number,
  notesPerBar: TypeGraphicalNoteData[][],
  osmd: null | OpenSheetMusicDisplay
  song: null | Heartbeat.Song
  keyEditor: null | Heartbeat.KeyEditor
  songAction: string
  songIsPlaying: boolean
  graphicalNotesPerBar: TypeGraphicalNoteData[][]
  noteMapping: null | NoteMapping
  songAndScoreReady: boolean
  playheadSeeking: boolean
  scoreContainer: null | HTMLDivElement
  scoreContainerOffsetY: number
};


export const initialState = {
  song: null,
  osmd: null,
  keyEditor: null,
  noteMapping: null,
  notesPerBar: [],
  songPosition: '',
  songPositionMillis: 0,
  songPositionPercentage: 0,
  sliderPositionPercentage: 0,
  songAction: '',
  songIsPlaying: false,
  graphicalNotesPerBar: [],
  songAndScoreReady: false,
  playheadSeeking: false,
  scoreContainer: null,
  scoreContainerOffsetY: 0,
}

export const song = (state: SongState = initialState, action: any) => {
  if (action.type === SCORE_READY) {
    // console.log(action.payload.notesPerBar);
    return {
      ...state,
      // osmd: action.payload.osmd,
      notesPerBar: action.payload.notesPerBar,
      scoreContainer: action.payload.scoreContainer,
      scoreContainerOffsetY: action.payload.scoreContainerOffsetY,
    };
  } else if (action.type === SONG_READY) {
    return {
      ...state,
      song: action.payload.song,
      keyEditor: action.payload.keyEditor,
    };
  } else if (action.type === UPDATE_SONG_ACTION) {
    return {
      ...state,
      songAction: action.payload.action,
      songIsPlaying: action.payload.action === SongActions.PLAY
    };
  } else if (action.type === PLAYHEAD_SEEKING) {
    return {
      ...state,
      playheadSeeking: action.payload.flag,
    };
  } else if (action.type === POSITION_SLIDER_CHANGED) {
    return {
      ...state,
      sliderPositionPercentage: action.payload.position,
    };
  } else if (action.type === UPDATE_PLAYHEAD_MILLIS) {
    const millis = action.payload.millis;
    const duration = state.song ? state.song.durationMillis : 1;
    return {
      ...state,
      sliderPositionPercentage: millis / duration,
    };
  } else if (action.type === UPDATE_NOTE_MAPPING) {
    return {
      ...state,
      noteMapping: action.payload.noteMapping,
      songAndScoreReady: true,
    };
  }

  return state;
}
