export const INITIALIZING = 'INITIALIZING';
export const INIT_FILES_LOADED = 'INIT_FILES_LOADED';

import { Dispatch } from 'redux'
import { loadXML, addMIDIFile } from '../util/heartbeat-utils';

export const init = (xmlDocUrl: string, midiFileUrl: string) => async (dispatch: Dispatch) => {
  dispatch({
    type: INITIALIZING
  });
  console.log(xmlDocUrl, midiFileUrl);
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