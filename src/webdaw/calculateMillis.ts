import { MIDIEvent, TempoEvent } from "./midi_events";

export const calculateMillis = (
  events: MIDIEvent[],
  data: {
    ppq: number;
    bpm: number;
    playbackSpeed?: number;
  }
): MIDIEvent[] => {
  let millisPerTick = 0;
  let ticks = 0;
  let millis = 0;
  let { ppq, bpm, playbackSpeed = 1 } = data;
  return events.map(event => {
    if ((event as TempoEvent).bpm) {
      ({ bpm } = event as TempoEvent);
      millisPerTick = (((1 / playbackSpeed) * 60) / bpm / ppq) * 1000;
    }
    const diffTicks = event.ticks - ticks;
    millis += diffTicks * millisPerTick;
    event.millis = millis;
    ticks = event.ticks;
    return event;
  });
};
