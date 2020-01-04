export const INITIALIZING = 'INITIALIZING';
export const LOAD_INIT_SONG = 'LOAD_INIT_SONG';
export const INIT_SONG_LOADED = 'INIT_SONG_LOADED';
export const SONG_LOADED = 'SONG_LOADED';
export const SCORE_RENDERED = 'SCORE_RENDERED';
export const SONG_READY = 'SONG_READY';
export const UPDATE_POSTION_SLIDER = 'UPDATE_POSTION_SLIDER';
export const UPDATE_SONG_ACTION = 'UPDATE_SONG_ACTION';

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { Dispatch, AnyAction } from 'redux'
import { loadXML, addMIDIFile, loadJSON, addAssetPack } from '../util/heartbeat-utils';
import { Observable } from 'rxjs';
import { AppState } from './store';
import { createSong } from '../create-song';

export const init = (observable: Observable<AppState>) => ({
  type: INITIALIZING,
  payload: {
    observable,
  }
})

export const loadInitSong = (xmlDocUrl: string, midiFileUrl: string, instrumentUrl: string) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: LOAD_INIT_SONG
    });
    const xmlDoc = await loadXML(xmlDocUrl);
    const midiFile = await addMIDIFile(midiFileUrl);
    const assetPack = await loadJSON(instrumentUrl);
    await addAssetPack(assetPack);
    dispatch({
      type: INIT_SONG_LOADED,
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

export const scoreRendered = (osmd: OpenSheetMusicDisplay) => ({
  type: SCORE_RENDERED,
  payload: { osmd },
});

export const updatePositionSlider = (position: number) => ({
  type: UPDATE_POSTION_SLIDER,
  payload: { position },
})

export const updateSongAction = (action: string) => ({
  type: UPDATE_SONG_ACTION,
  payload: { action },
})
