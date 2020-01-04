import { INITIALIZING, MIDIFILE_LOADED, MUSICXML_LOADED, SCORE_READY, SONG_READY, INIT_DATA_LOADED, UPDATE_SONG_ACTION, noteMapping } from './actions';
import { Observable } from 'rxjs';
import { AppState } from './store';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay/build/dist/src';
import { TypeGraphicalNoteData } from '../util/osmd-notes';
import { TypeNoteMapping } from 'src/util/osmd-heartbeat';
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
  observable: null | Observable<AppState>
  currentXMLDoc: null | XMLDocument,
  currentMIDIFile: null | Heartbeat.MIDIFileJSON,
  osmd: null | OpenSheetMusicDisplay
  song: null | Heartbeat.Song
  songAction: string
  songIsPlaying: boolean
  graphicalNotesPerBar: TypeGraphicalNoteData[][]
  noteMapping: TypeNoteMapping
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
  observable: null,
  currentXMLDoc: null,
  currentMIDIFile: null,
  song: null,
  osmd: null,
  songAction: '',
  songIsPlaying: false,
  graphicalNotesPerBar: [],
  noteMapping: {}
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
    };
  } else if (action.type === SONG_READY) {
    return {
      ...state,
      song: action.payload.song,
    };
  } else if (action.type === UPDATE_SONG_ACTION) {
    return {
      ...state,
      songAction: action.payload.action,
      songIsPlaying: action.payload.action === SongActions.PLAY
    };
  }

  return state;
}
