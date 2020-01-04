import { INITIALIZING, SONG_LOADED, SCORE_RENDERED, SONG_READY, INIT_SONG_LOADED } from './actions';
import { Observable } from 'rxjs';
import { AppState } from "./store";

export type SongState = {
  initUrls: {
    xmlDoc: string,
    midiFile: string,
    instrument: string,
  }
  instrument: null | Heartbeat.InstrumentMapping,
  midiFiles: Heartbeat.MIDIFileJSON[],
  xmlDocs: XMLDocument[],
  songPosition: string,
  observable: null | Observable<AppState>
  currentXMLDocIndex: number,
  currentMIDIFileIndex: number,
};

const instrumentName = 'TP00-PianoStereo';

export const initialState = {
  initUrls: {
    xmlDoc: './assets/mozk545a_musescore.musicxml',
    midiFile: './assets/mozk545a_musescore.mid',
    instrument: `./assets/${instrumentName}.mp3.json`,
  },
  instrument: null,
  xmlDocs: [],
  midiFiles: [],
  songPosition: '',
  observable: null,
  currentXMLDocIndex: -1,
  currentMIDIFileIndex: -1,
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
      xmlDocs: [action.payload.xmlDoc],
      midiFiles: [action.payload.midiFile],
      instrument: action.payload.instrument,
      // currentXMLDocIndex: 0,
      // currentMIDIFileIndex: 0,
    }
  } else if (action.type === INIT_SONG_LOADED) {
    return {
      ...state,
      xmlDocs: [action.payload.xmlDoc],
      midiFiles: [action.payload.midiFile],
      instrument: action.payload.instrument,
      currentXMLDocIndex: 0,
      currentMIDIFileIndex: 0,
    }
  } else if (action.type === SCORE_RENDERED) {
    return state;
  } else if (action.type === SONG_READY) {
    return state;
  }

  return state;
}
