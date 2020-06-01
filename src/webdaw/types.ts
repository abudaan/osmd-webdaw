/// <reference types="webmidi" />

import { MIDIEvent } from "./midi_events";

enum NOTE {
  NOTE_ON,
  NOTE_OFF,
}

export interface Song {
  ppq: number;
  latency: number;
  bufferTime: number;
  initialTempo: number;
  tracks: Track[];
  tracksById: { [id: string]: Track };
  events: MIDIEvent[];
  durationTicks?: number;
  durationMillis?: number;
  numBars?: number;
  numerator?: number;
  denominator?: number;
  // timeTrack: MIDIEvent[]
  // tracks: Track[]
  // useMetronome?: boolean;
  // loop?: boolean;
  // loops?: {
  //   start: number;
  //   end: number;
  // }[];
}

export interface Track {
  id: string;
  latency: number;
  name?: string;
  inputs: string[]; // ids of MIDI inputs
  outputs: string[]; // ids of MIDI outputs
  instrument?: string;
  processor?: (event: MIDIEvent | WebMidi.MIDIMessageEvent) => void; // a function that processes an event into sound or something else
}

export type NoteEvent = {
  command: NOTE;
  channel: number;
  ticks: number;
  millis: number;
  velocity: number;
  noteNumber: number;
  octave: number;
  noteName: string;
};
