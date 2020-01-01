import { INIT_FILES_LOADED, SCORE_RENDERED } from "./actions";

type SongState = {
  midiFileUrl: string,
  xmlDocUrl: string,
  midiFile: null,
  xmlDoc: null | XMLDocument,
};

export const initialState = {
  midiFileUrl: './assets/mozk545a_musescore.mid',
  xmlDocUrl: './assets/mozk545a_musescore.musicxml',
  midiFile: null,
  xmlDoc: null,
}

export const song = (state: SongState = initialState, action: any) => {
  if (action.type === INIT_FILES_LOADED) {
    console.log(action.payload);
    return {
      ...state,
      xmlDoc: action.payload.xmlDoc,
    }
  } else if (action.type === SCORE_RENDERED) {
    return state;
  }

  return state;
}
