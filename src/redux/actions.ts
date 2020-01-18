export const INITIALIZING = 'INITIALIZING';
export const LOAD_INIT_DATA = 'LOAD_INIT_DATA';
export const INIT_DATA_LOADED = 'INIT_DATA_LOADED';
export const SCORE_READY = 'SCORE_READY';
export const SONG_READY = 'SONG_READY';
export const UPDATE_SONG_ACTION = 'UPDATE_SONG_ACTION';
export const MUSICXML_LOADED = 'MUSICXML_LOADED';
export const MIDIFILE_LOADED = 'MIDIFILE_LOADED';
export const SELECT_XMLDOC = 'SELECT_XMLDOC';
export const SELECT_MIDIFILE = 'SELECT_MIDIFILE';
export const UPLOAD_XMLDOC = 'UPLOAD_XMLDOC';
export const UPLOAD_MIDIFILE = 'UPLOAD_MIDIFILE';
export const XMLDOC_UPLOADED = 'XMLDOC_UPLOADED';
export const MIDIFILE_UPLOADED = 'MIDIFILE_UPLOADED';
export const UPDATE_NOTE_MAPPING = 'UPDATE_NOTE_MAPPING';
export const POSITION_SLIDER_CHANGED = 'POSITION_SLIDER_CHANGED';
export const PLAYHEAD_SEEKING = 'PLAYHEAD_SEEKING';
export const UPDATE_PLAYHEAD_MILLIS = 'UPDATE_PLAYHEAD_MILLIS';

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { Dispatch, AnyAction } from 'redux'
import { loadXML, addMIDIFile, loadJSON, addAssetPack } from '../util/heartbeat-utils';
import { Observable } from 'rxjs';
import { AppState } from './store';
import { NoteMapping } from 'src/util/osmd-heartbeat';

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
    const midiFile = await addMIDIFile({ url: midiFileUrl });
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

export const songReady = (song: Heartbeat.Song, keyEditor: Heartbeat.KeyEditor) => ({
  type: SONG_READY,
  payload: { song, keyEditor },
});

export const scoreReady = (osmd: OpenSheetMusicDisplay) => {
  const scoreContainer = (osmd['container'] as HTMLDivElement).parentElement;
  let scoreContainerOffsetY = 0;
  if (!!scoreContainer) {
    scoreContainerOffsetY = scoreContainer.offsetTop;
  }

  return {
    type: SCORE_READY,
    payload: { osmd, scoreContainerOffsetY, scoreContainer },
  }

};
export const updateNoteMapping = (noteMapping: NoteMapping) => {
  return {
    type: UPDATE_NOTE_MAPPING,
    payload: { noteMapping },
  }
};

export const updatePlayheadSeeking = (flag: boolean) => ({
  type: PLAYHEAD_SEEKING,
  payload: { flag },
})

export const updatePositionSlider = (position: number) => ({
  type: POSITION_SLIDER_CHANGED,
  payload: { position },
})

export const updateSongAction = (action: string) => ({
  type: UPDATE_SONG_ACTION,
  payload: { action },
})

export const updatePlayheadMillis = (millis: number) => ({
  type: UPDATE_PLAYHEAD_MILLIS,
  payload: { millis },
})

export const selectXMLDoc = (index: number) => ({
  type: SELECT_XMLDOC,
  payload: { index },
})

export const selectMIDIFile = (index: number) => ({
  type: UPLOAD_MIDIFILE,
  payload: { index },
})

let fileReader: FileReader;
const fileReaderPromise = (file: File): Promise<ProgressEvent<FileReader>> => {
  if (!fileReader) {
    fileReader = new FileReader()
  }
  const type = file.type;
  return new Promise((resolve, reject) => {
    fileReader.onload = (evt) => {
      resolve(evt);
    }
    fileReader.onerror = (evt) => {
      reject(evt);
    }
    if (type.indexOf('xml') !== -1) {
      fileReader.readAsText(file);
    } else if (type.indexOf('mid') !== -1) {
      fileReader.readAsArrayBuffer(file);
    }
  })
}

export const uploadXMLDoc = (file: File) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: UPLOAD_XMLDOC,
    });
    const evt = await fileReaderPromise(file);
    if (evt && evt.target) {
      dispatch({
        type: XMLDOC_UPLOADED,
        payload: { file: new DOMParser().parseFromString(evt.target.result as string, 'application/xml') },
      });
    };
  }
}

export const uploadMIDIFile = (file: File) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: UPLOAD_MIDIFILE,
    });
    const evt = await fileReaderPromise(file);
    if (evt && evt.target && evt.target.result) {
      const arraybuffer = evt.target.result as ArrayBuffer;
      const file = await addMIDIFile({ arraybuffer });
      dispatch({
        type: MIDIFILE_UPLOADED,
        payload: { file },
      });
    };
  }
}

