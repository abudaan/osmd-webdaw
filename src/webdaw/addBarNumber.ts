import { MIDIEvent } from "./midi_events";

// @TODO: fix this for signature changes!
export const addBarNumber = (
  events: MIDIEvent[],
  ppq: number,
  numerator: number,
  denominator: number
): MIDIEvent[] => {
  let ticks = 0;
  //   const ticksPerBar = (ppq / (denominator / 4)) * numerator;
  const ticksPerBar = ppq * (numerator * (4 / denominator));
  //   console.log(ticksPerBar);
  events.forEach(e => {
    const bar = Math.floor(e.ticks / ticksPerBar);
    e.bar = bar;
    // console.log(bar);
  });

  return events;
};
