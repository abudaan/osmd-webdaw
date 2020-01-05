export const INITIALIZING = 'INITIALIZING';
export const LOAD_INIT_DATA = 'LOAD_INIT_DATA';
export const INIT_DATA_LOADED = 'INIT_DATA_LOADED';
export const SCORE_READY = 'SCORE_READY';
export const SONG_READY = 'SONG_READY';
export const UPDATE_SONG_ACTION = 'UPDATE_SONG_ACTION';
export const MUSICXML_LOADED = 'MUSICXML_LOADED';
export const MIDIFILE_LOADED = 'MIDIFILE_LOADED';
export const UPDATE_NOTE_MAPPING = 'UPDATE_NOTE_MAPPING';
export const UPDATE_POSITION_SLIDER = 'UPDATE_POSITION_SLIDER';

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { Dispatch, AnyAction } from 'redux'
import { loadXML, addMIDIFile, loadJSON, addAssetPack } from '../util/heartbeat-utils';
import { Observable } from 'rxjs';
import { AppState } from './store';
import { TypeNoteMapping } from 'src/util/osmd-heartbeat';

export const init = (observable: Observable<AppState>) => ({
  type: INITIALIZING,
  payload: {
    observable,
  }
})

export const loadInitData = (xmlDocUrl: string, midiFileUrl: string, instrumentUrl: string) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: LOAD_INIT_DATA
    });
    const xmlDoc = await loadXML(xmlDocUrl);
    const midiFile = await addMIDIFile(midiFileUrl);
    const assetPack = await loadJSON(instrumentUrl);
    await addAssetPack(assetPack);
    dispatch({
      type: INIT_DATA_LOADED,
      payload: {
        xmlDoc,
        midiFile,
        instrumentName: assetPack.instruments[0].name,
      }
    });
  };
}

export const songReady = (song: Heartbeat.Song) => ({
  type: SONG_READY,
  payload: { song },
});

export const scoreReady = (osmd: OpenSheetMusicDisplay) => {
  return {
    type: SCORE_READY,
    payload: { osmd },
  }

};
export const updateNoteMapping = (noteMapping: TypeNoteMapping) => {
  return {
    type: UPDATE_NOTE_MAPPING,
    payload: { noteMapping },
  }
};

export const updatePositionSlider = (position: number) => ({
  type: UPDATE_POSITION_SLIDER,
  payload: { position },
})

export const updateSongAction = (action: string) => ({
  type: UPDATE_SONG_ACTION,
  payload: { action },
})
