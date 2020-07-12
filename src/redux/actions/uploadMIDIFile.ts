import { Dispatch } from "redux";
import { UPLOAD_MIDIFILE, MIDIFILE_LOADED } from "../../constants";
import { createSongFromMIDIFile } from "../../webdaw/sugar_coating";
import { outputs } from "../../media";
import { addBarNumber } from "../../webdaw/addBarNumber";
import { createNotes } from "../../webdaw/create_notes";

export const uploadMIDIFile = (file: File) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: UPLOAD_MIDIFILE,
    });
    const ab = await file.arrayBuffer();
    const song = await createSongFromMIDIFile(ab);
    // console.log(song);
    song.tracks.forEach(track => {
      track.outputs.push(...outputs.map(o => o.id));
      // track.outputs = outputs.map(o => o.id);
    });
    addBarNumber(song.events, song.ppq, song.numerator, song.denominator);
    song.numBars = song.events[song.events.length - 1].bar;
    // song.notes = createNotes(song.events);
    dispatch({
      type: MIDIFILE_LOADED,
      payload: { interpretation: { name: file.name, file: song } },
    });
  };
};
