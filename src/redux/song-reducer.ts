import {
  INITIALIZING,
  MIDIFILE_LOADED,
  MUSICXML_LOADED,
  SCORE_READY,
  SONG_READY, INIT_DATA_LOADED, UPDATE_SONG_ACTION, POSITION_SLIDER_CHANGED, UPDATE_NOTE_MAPPING, PLAYHEAD_SEEKING, UPDATE_PLAYHEAD_MILLIS
} from './actions';
import { Observable } from 'rxjs';
import { AppState } from './store';
import { OpenSheetMusicDisplay, PlaybackSettings } from 'opensheetmusicdisplay/build/dist/src';
import { TypeGraphicalNoteData } from '../util/osmd-notes';
import { NoteMapping } from 'src/util/osmd-heartbeat';
export const SongActions = {
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  STOP: 'STOP',
}

export type SongState = {
  initUrls: {
    xmlDoc: string,
    midiFile: string,
    instrument: string,
  }
  instrumentName: string,
  midiFiles: Heartbeat.MIDIFileJSON[],
  xmlDocs: XMLDocument[],
  songPosition: string,
  songPositionMillis: number,
  songPositionPercentage: number,
  sliderPositionPercentage: number,
  observable: null | Observable<AppState>
  currentXMLDoc: null | XMLDocument,
  currentMIDIFile: null | Heartbeat.MIDIFileJSON,
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

const instrumentName = 'TP00-PianoStereo';

export const initialState = {
  initUrls: {
    xmlDoc: './assets/mozk545a_musescore.musicxml',
    midiFile: './assets/mozk545a_musescore.mid',
    instrument: `./assets/${instrumentName}.mp3.json`,
  },
  instrumentName: '',
  xmlDocs: [],
  midiFiles: [],
  songPosition: '',
  songPositionMillis: 0,
  songPositionPercentage: 0,
  sliderPositionPercentage: 0,
  observable: null,
  currentXMLDoc: null,
  currentMIDIFile: null,
  song: null,
  keyEditor: null,
  osmd: null,
  songAction: '',
  songIsPlaying: false,
  graphicalNotesPerBar: [],
  noteMapping: null,
  songAndScoreReady: false,
  playheadSeeking: false,
  scoreContainer: null,
  scoreContainerOffsetY: 0,
}

export const song = (state: SongState = initialState, action: any) => {
  if (action.type === INITIALIZING) {
    return {
      ...state,
      observable: action.payload.observable,
    }
  } else if (action.type === INIT_DATA_LOADED) {
    const { xmlDoc, midiFile, instrumentName } = action.payload;
    return {
      ...state,
      xmlDocs: [xmlDoc],
      midiFiles: [midiFile],
      instrumentName: instrumentName,
      currentXMLDoc: xmlDoc,
      currentMIDIFile: midiFile,
    }
  } else if (action.type === MIDIFILE_LOADED) {
    return {
      ...state,
      midiFiles: [...state.midiFiles, action.payload.midiFile],
    }
  } else if (action.type === MUSICXML_LOADED) {
    return {
      ...state,
      xmlDocs: [...state.xmlDocs, action.payload.xmlDoc],
    }
  } else if (action.type === SCORE_READY) {
    return {
      ...state,
      osmd: action.payload.osmd,
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
