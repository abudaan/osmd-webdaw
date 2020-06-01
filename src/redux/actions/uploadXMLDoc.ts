import { Dispatch, Action, AnyAction } from "redux";
import { UPLOAD_XMLDOC, MUSICXML_LOADED } from "../actions1";
// import { parseMusicXML, SignatureEvent } from "src/util/musicxml";
import { find } from "rxjs/operators";
// import { TempoEvent } from "src/midi_events";
import { fileReaderPromise } from "../fileReaderPromise";
import { ThunkAction } from "redux-thunk";
import { AppState } from "../store";

export const uploadXMLDoc = (
  file: File
): ThunkAction<void, AppState, unknown, Action<string>> => async (dispatch: Dispatch) => {
  dispatch({
    type: UPLOAD_XMLDOC,
  });
  /*
  const evt = await fileReaderPromise(file);
    if (evt && evt.target) {
      const file1 = new DOMParser().parseFromString(evt.target.result as string, "application/xml");
      const parsed = parseMusicXML(file1);
      if (parsed === null) {
        throw new Error("not a valid XML file");
      }
      const { repeats, parts, timeEvents } = parsed;
      const firstTempoEvent = find((event: TempoEvent | SignatureEvent) => event.command === 0x51)(
        timeEvents
      );
      let bpm = 120;
      if (firstTempoEvent) {
        bpm = ((firstTempoEvent as unknown) as TempoEvent).bpm;
      }
      const firstSignatureEvent = find(
        (event: TempoEvent | SignatureEvent) => event.command === 0x58
      )(timeEvents);
      const {
        denominator,
        numerator: nominator,
      } = (firstSignatureEvent as unknown) as SignatureEvent;
      const tracks = parts.map(part => {
        const midiEvents: Heartbeat.MIDIEvent[] = part.events.map(event => {
          const { command, ticks, noteNumber, velocity } = event;
          return sequencer.createMidiEvent(ticks, command, noteNumber, velocity);
        });
        const t = sequencer.createTrack(part.name);
        const p = sequencer.createPart();
        p.addEvents(midiEvents);
      });
      const json = {
        id: file.name,
        name: file.name,
        ppq: 960,
        bpm,
        nominator,
        denominator,
        tracks,
        timeEvents,
      };
      dispatch({
        type: MUSICXML_LOADED,
        payload: {
          file: file1,
          name: file.name,
          repeats,
          parts,
        },
      });
    }
    */
};
