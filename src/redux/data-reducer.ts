import {
  INITIALIZING,
  MIDIFILE_LOADED,
  MUSICXML_LOADED,
  INIT_DATA_LOADED,
  SELECT_XMLDOC,
  SELECT_MIDIFILE,
  UPLOAD_MIDIFILE,
  UPLOAD_XMLDOC,
} from "./actions1";
import { baseName } from "../util/general";
import { PartData } from "src/util/musicxml";

export type DataState = {
  initUrls: {
    xmlDoc: string;
    midiFile: string;
    instrument: string;
  };
  instrumentName: string;
  midiFiles: { name: string; file: Heartbeat.MIDIFileJSON }[];
  xmlDocs: {
    name: string;
    file: XMLDocument;
    repeats: number[][];
    parts: PartData;
    interpretations: Heartbeat.MIDIFileJSON[];
  }[];
  currentXMLDoc: null | XMLDocument;
  currentMIDIFile: null | Heartbeat.MIDIFileJSON;
  xmlDocCurrentIndex: number;
  midiFileCurrentIndex: number;
  interpretationsCurrentIndex: number;
};

const instrumentName = "TP00-PianoStereo";

export const initialState = {
  initUrls: {
    // xmlDoc: './assets/mozk545a_musescore.musicxml',
    xmlDoc: "./assets/score.xml",
    // midiFile: './assets/mozk545a_musescore.mid',
    midiFile: "./assets/minute_waltz.mid",
    instrument: `./assets/${instrumentName}.mp3.json`,
  },
  instrumentName,
  xmlDocs: [],
  midiFiles: [],
  currentXMLDoc: null,
  currentMIDIFile: null,
  xmlDocCurrentIndex: 0,
  midiFileCurrentIndex: 0,
};

export const data = (state: DataState = initialState, action: any) => {
  if (action.type === INITIALIZING) {
    return {
      ...state,
      observable: action.payload.observable,
    };
  } else if (action.type === INIT_DATA_LOADED) {
    const { xmlDoc, midiFile, instrumentName } = action.payload;
    return {
      ...state,
      xmlDocs: [{ name: baseName(state.initUrls.xmlDoc), file: xmlDoc }],
      midiFiles: [{ name: baseName(state.initUrls.midiFile), file: midiFile }],
      instrumentName: instrumentName,
      currentXMLDoc: xmlDoc,
      currentMIDIFile: midiFile,
    };
  } else if (action.type === SELECT_XMLDOC) {
    const index = action.payload.index;
    return {
      ...state,
      xmlDocCurrentIndex: index,
      currentXMLDoc: state.xmlDocs[index],
    };
  } else if (action.type === SELECT_MIDIFILE) {
    const index = action.payload.index;
    return {
      ...state,
      midiFileCurrentIndex: index,
      currentMIDIFile: state.midiFiles[index],
    };
  } else if (action.type === MIDIFILE_LOADED) {
    const name = action.payload.name;
    const file = action.payload.file;
    const index = state.midiFiles.length;
    return {
      ...state,
      currentMIDIFile: file,
      midiFileCurrentIndex: index,
      midiFiles: [...state.midiFiles, { name, file }],
    };
  } else if (action.type === MUSICXML_LOADED) {
    const file = action.payload.file;
    const name = action.payload.name;
    const parts = action.payload.parts;
    const repeats = action.payload.repeats;
    const index = state.xmlDocs.length;
    // console.log('XML', file);
    return {
      ...state,
      // currentXMLDoc: file,
      // xmlDocCurrentIndex: index,
      xmlDocs: [...state.xmlDocs, { name, file, repeats, parts }],
      // xmlDocNames: [baseName(state.initUrls.xmlDoc)],
    };
  }

  return state;
};
