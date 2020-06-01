import { Dispatch } from "redux";
import { UPLOAD_MIDIFILE, MIDIFILE_LOADED } from "../actions1";
import { fileReaderPromise } from "../fileReaderPromise";
// import { addMIDIFile } from "src/util/heartbeat-utils";

export const uploadMIDIFile = (file: File) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: UPLOAD_MIDIFILE,
    });
    const evt = await fileReaderPromise(file);
    if (evt && evt.target && evt.target.result) {
      const arraybuffer = evt.target.result as ArrayBuffer;
      // const file1 = await addMIDIFile({ arraybuffer });
      const file1 = "";
      dispatch({
        type: MIDIFILE_LOADED,
        payload: { name: file.name, file: file1 },
      });
    }
  };
};
