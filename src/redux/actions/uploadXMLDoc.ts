import { Dispatch, Action, AnyAction } from "redux";
import { UPLOAD_XMLDOC, MUSICXML_LOADED } from "../../constants";
import { ThunkAction } from "redux-thunk";
import { AppState } from "../../types";
import { parseMusicXML } from "../../webdaw/musicxml";
import { MIDIEvent, TimeSignatureEvent, TempoEvent, NoteOnEvent } from "../../webdaw/midi_events";
import { Song, Track } from "../../webdaw/types";
import { outputs } from "../../media";
import { sortMIDIEvents, calculateMillis } from "../../webdaw/midi_utils";
import { createNotes } from "../../webdaw/create_notes";
import { download } from "../../util/general";
import { createKeyEditorView } from "../../webdaw/create_key_editor_view";

export const uploadXMLDoc = (
  file: File
): ThunkAction<void, AppState, unknown, Action<string>> => async (dispatch: Dispatch) => {
  dispatch({
    type: UPLOAD_XMLDOC,
  });
  const s = await file.text();
  const mxml = new DOMParser().parseFromString(s, "application/xml");
  const { parts, repeats, bpm, numerator, denominator } = parseMusicXML(mxml);
  const { tracks, events }: { tracks: Track[]; events: MIDIEvent[] } = parts.reduce(
    (acc, val, i) => {
      const id = `Track ${i++} (${val.name})`;
      acc.events.push(
        ...val.events.map(e => {
          e.trackId = id;
          return e;
        })
      );
      const t: Track = {
        id,
        latency: 0,
        inputs: [],
        // outputs: [...outputs.map(o => o.id)],
        outputs: outputs.map(o => o.id),
      };

      acc.tracks.push(t);
      return acc;
    },
    { tracks: [], events: [] }
  );

  // events.forEach((e: MIDIEvent) => {
  //   const n = e as NoteOnEvent;
  //   console.log(n.ticks, n.noteNumber, n.descr, n.millis);
  // });
  sortMIDIEvents(events);
  // download(new Blob([JSON.stringify(events)], { type: "application/json" }));
  const notes = createNotes(events);
  const song: Song = {
    ppq: 960,
    latency: 17, // value in milliseconds -> the length of a single frame @ 60Hz refresh rate
    bufferTime: 100, // value in milliseconds
    tracks,
    tracksById: tracks.reduce((acc: { [id: string]: Track }, value) => {
      acc[value.id] = value;
      return acc;
    }, {}),
    events: calculateMillis(events, 960, bpm),
    notes,
    initialTempo: bpm,
    numerator,
    denominator,
    // timeTrack,
    // tracks: tracks.map(track => ({ events: [...track] })),
  };
  createKeyEditorView(song);
  console.log(song);

  dispatch({
    type: MUSICXML_LOADED,
    payload: {
      score: {
        name: file.name,
        file: mxml,
        repeats,
        parts,
      },
      interpretation: {
        name: `${file.name} (mxml)`,
        file: song,
      },
    },
  });
};
