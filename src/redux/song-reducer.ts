import { INITIALIZING, SONG_LOADED, SCORE_RENDERED, SONG_READY, INIT_SONG_LOADED, UPDATE_SONG_ACTION } from './actions';
import { Observable } from 'rxjs';
import { AppState } from './store';
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
  currentXMLDocIndex: number,
  currentMIDIFileIndex: number,
  song: null | Heartbeat.Song
  songAction: string
  songIsPlaying: boolean
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
  currentXMLDocIndex: -1,
  currentMIDIFileIndex: -1,
  song: null,
  songAction: '',
  songIsPlaying: false,
}

export const song = (state: SongState = initialState, action: any) => {
  if (action.type === INITIALIZING) {
    return {
      ...state,
      observable: action.payload.observable,
    }
  } else if (action.type === SONG_LOADED) {
    return {
      ...state,
      // xmlDocs: [action.payload.xmlDoc],
      // midiFiles: [action.payload.midiFile],
      // instrumentName: action.payload.instrumentName,
      // currentXMLDocIndex: 0,
      // currentMIDIFileIndex: 0,
    }
  } else if (action.type === INIT_SONG_LOADED) {
    return {
      ...state,
      xmlDocs: [action.payload.xmlDoc],
      midiFiles: [action.payload.midiFile],
      instrumentName: action.payload.instrumentName,
      currentXMLDocIndex: 0,
      currentMIDIFileIndex: 0,
    }
  } else if (action.type === SCORE_RENDERED) {
    return state;
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
