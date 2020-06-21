import { Dispatch, Action, AnyAction } from "redux";
import { UPLOAD_XMLDOC, MUSICXML_LOADED } from "../../constants";
import { ThunkAction } from "redux-thunk";
import { AppState } from "../../types";
import { parseMusicXML } from "../../webdaw/musicxml";
import { MIDIEvent, TimeSignatureEvent, TempoEvent, NoteOnEvent } from "../../webdaw/midi_events";
import { Song, Track } from "../../webdaw/types";
import { outputs } from "../../media";
import { sortMIDIEvents } from "../../webdaw/midi_utils";
import { createNotes } from "../../webdaw/create_notes";
import { addBarNumber } from "../../webdaw/addBarNumber";

export const uploadXMLDoc = (
  file: File
): ThunkAction<void, AppState, unknown, Action<string>> => async (dispatch: Dispatch) => {
  dispatch({
    type: UPLOAD_XMLDOC,
  });
  const s = await file.text();
  const mxml = new DOMParser().parseFromString(s, "application/xml");
  const { parts, repeats, timeEvents } = parseMusicXML(mxml);
  // console.log(parts);
  let i = timeEvents.findIndex((event: TempoEvent | TimeSignatureEvent) => event.subType === 0x51);
  const firstTempoEvent = timeEvents[i];
  let bpm = 120;
  if (firstTempoEvent) {
    bpm = ((firstTempoEvent as unknown) as TempoEvent).bpm;
  }

  i = timeEvents.findIndex((event: TempoEvent | TimeSignatureEvent) => event.subType === 0x58);
  const firstSignatureEvent = timeEvents[i];
  const { denominator, numerator } = firstSignatureEvent as TimeSignatureEvent;
  const { tracks, events }: { tracks: Track[]; events: MIDIEvent[] } = parts.reduce(
    (acc, val, i) => {
      const id = `T-${i++}`;
      acc.events.push(
        ...val.events.map(e => {
          e.trackId = id;
          return e;
        })
      );
      const t: Track = {
        id,
        name: val.name,
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
    notes: createNotes(events),
    initialTempo: bpm,
    numerator,
    denominator,
    // timeTrack,
    // tracks: tracks.map(track => ({ events: [...track] })),
  };
  addBarNumber(song.events, song.ppq, song.numerator, song.denominator);
  // console.log(song.events);
  song.numBars = song.events[song.events.length - 1].bar;

  // console.log(song);

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
