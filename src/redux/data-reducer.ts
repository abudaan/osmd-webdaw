import {
  INITIALIZING,
  MIDIFILE_LOADED,
  MUSICXML_LOADED,
  INIT_DATA_LOADED,
} from './actions';
import { baseName } from '../util/general';

export type DataState = {
  initUrls: {
    xmlDoc: string,
    midiFile: string,
    instrument: string,
  }
  instrumentName: string,
  midiFiles: Heartbeat.MIDIFileJSON[],
  midiFileNames: string[],
  xmlDocs: XMLDocument[],
  xmlDocNames: string[],
  currentXMLDoc: null | XMLDocument,
  currentMIDIFile: null | Heartbeat.MIDIFileJSON,
};

const instrumentName = 'TP00-PianoStereo';

export const initialState = {
  initUrls: {
    xmlDoc: './assets/mozk545a_musescore.musicxml',
    midiFile: './assets/mozk545a_musescore.mid',
    instrument: `./assets/${instrumentName}.mp3.json`,
  },
  instrumentName,
  xmlDocs: [],
  xmlDocNames: [],
  midiFiles: [],
  midiFileNames: [],
  currentXMLDoc: null,
  currentMIDIFile: null,
}

export const data = (state: DataState = initialState, action: any) => {
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
      xmlDocNames: [baseName(state.initUrls.xmlDoc)],
      midiFileNames: [baseName(state.initUrls.midiFile)],
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
  }

  return state;
}
