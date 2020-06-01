import { Dispatch, Action, AnyAction } from "redux";
import { UPLOAD_XMLDOC, MUSICXML_LOADED } from "../actions1";
import { ThunkAction } from "redux-thunk";
import { AppState } from "../store";
import { parseMusicXML } from "../../webdaw/musicxml";
import { MIDIEvent, TimeSignatureEvent, TempoEvent } from "../../webdaw/midi_events";
import { Song, Track } from "../../webdaw/types";

export const uploadXMLDoc = (
  file: File
): ThunkAction<void, AppState, unknown, Action<string>> => async (dispatch: Dispatch) => {
  dispatch({
    type: UPLOAD_XMLDOC,
  });
  const s = await file.text();
  const mxml = new DOMParser().parseFromString(s, "application/xml");
  const { parts, repeats, timeEvents } = parseMusicXML(mxml);

  let i = timeEvents.findIndex((event: TempoEvent | TimeSignatureEvent) => event.subType === 0x51);
  const firstTempoEvent = timeEvents[i];
  let bpm = 120;
  if (firstTempoEvent) {
    bpm = ((firstTempoEvent as unknown) as TempoEvent).bpm;
  }

  i = timeEvents.findIndex((event: TempoEvent | TimeSignatureEvent) => event.subType === 0x58);
  const firstSignatureEvent = timeEvents[i];
  const { denominator, numerator: nominator } = firstSignatureEvent as TimeSignatureEvent;
  const { tracks, events }: { tracks: Track[]; events: MIDIEvent[] } = parts.reduce(
    (acc, val) => {
      acc.events.push(...val.events);
      const t: Track = {
        id: val.name,
        latency: 0,
        inputs: [],
        outputs: [],
      };
      acc.tracks.push(t);
      return acc;
    },
    { tracks: [], events: [] }
  );

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
    initialTempo: bpm,
    // timeTrack,
    // tracks: tracks.map(track => ({ events: [...track] })),
  };

  dispatch({
    type: MUSICXML_LOADED,
    payload: {
      file: mxml,
      name: file.name,
      repeats,
      parts,
    },
  });
};
