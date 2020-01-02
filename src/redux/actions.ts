export const INITIALIZING = 'INITIALIZING';
export const INIT_FILES_LOADED = 'INIT_FILES_LOADED';
export const SCORE_RENDERED = 'SCORE_RENDERED';
export const UPDATE_POSTION_SLIDER = 'UPDATE_POSTION_SLIDER';

import { Dispatch } from 'redux'
import { loadXML, addMIDIFile } from '../util/heartbeat-utils';

export const init = (xmlDocUrl: string, midiFileUrl: string) => async (dispatch: Dispatch) => {
  dispatch({
    type: INITIALIZING
  });
  const xmlDoc = await loadXML(xmlDocUrl);
  const midiFile = await addMIDIFile(midiFileUrl);

  dispatch({
    type: INIT_FILES_LOADED,
    payload: {
      xmlDoc,
      midiFile,
    }
  })
}

export const scoreRendered = () => ({ type: SCORE_RENDERED });

export const updatePositionSlider = (position: number) => ({
  type: UPDATE_POSTION_SLIDER,
  payload: {
    position,
  }
})
