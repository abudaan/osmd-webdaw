import { Dispatch, Action, AnyAction } from "redux";
import { UPLOAD_XMLDOC, MUSICXML_LOADED } from "../../constants";
import { ThunkAction } from "redux-thunk";
import { AppState } from "../../types";
import { parseMusicXML } from "../../webdaw/musicxml/mxml_parser";
import { Song, Track } from "../../webdaw/types";
import { outputs } from "../../media";
import { addBarNumber } from "../../webdaw/addBarNumber";

export const uploadXMLDoc = (
  file: File
): ThunkAction<void, AppState, unknown, Action<string>> => async (dispatch: Dispatch) => {
  dispatch({
    type: UPLOAD_XMLDOC,
  });
  const s = await file.text();
  const mxml = new DOMParser().parseFromString(s, "application/xml");
  const {
    events,
    notes,
    tracks,
    repeats,
    initialTempo,
    initialNumerator,
    initialDenominator,
  } = parseMusicXML(mxml, 960);

  const song: Song = {
    ppq: 960,
    latency: 17, // value in milliseconds -> the length of a single frame @ 60Hz refresh rate
    bufferTime: 100, // value in milliseconds
    tracks,
    tracksById: tracks.reduce((acc: { [id: string]: Track }, value) => {
      acc[value.id] = value;
      return acc;
    }, {}),
    events,
    notes,
    initialTempo,
    numerator: initialNumerator,
    denominator: initialDenominator,
  };
  song.tracks.forEach(track => {
    track.outputs.push(...outputs.map(o => o.id));
    // track.outputs = outputs.map(o => o.id);
  });
  addBarNumber(song.events, song.ppq, song.numerator, song.denominator);
  song.numBars = song.events[song.events.length - 1].bar;

  console.log(song);

  dispatch({
    type: MUSICXML_LOADED,
    payload: {
      score: {
        name: file.name,
        file: mxml,
        repeats,
        // parts,
      },
      interpretation: {
        name: `${file.name} (mxml)`,
        file: song,
      },
    },
  });
};
