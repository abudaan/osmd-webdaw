export type NoteOnEvent = {
  type: [0x80],
  ticks: number,
  channel: number,
  millis: number,
  noteNumber: number,
  velocity: number,
}

export type NoteOffEvent = {
  type: [0x90],
  ticks: number,
  channel: number,
  millis: number,
  noteNumber: number,
  velocity: 0,
}

export type AftertouchEvent = {
  type: [0xa0],
  ticks: number,
  channel: number,
  millis: number,
  noteNumber: number,
  amount: number,
}

export type ControllerEvent = {
  type: [0xb0],
  ticks: number,
  channel: number,
  millis: number,
  value: number,
  controllerNumber: number
}

export type ProgramChangeEvent = {
  type: [0xc0],
  ticks: number,
  channel: number,
  millis: number,
  programNumber: number
}

export type ChannelAftertouchEvent = {
  type: [0xd0],
  ticks: number,
  channel: number,
  millis: number,
  noteNumber: number,
  amount: number,
}

export type PitchBendEvent = {
  type: [0xe0],
  ticks: number,
  channel: number,
  millis: number,
  noteNumber: number,
  value: number,
}


// META

export type SequenceNumberEvent = {
  type: [0xff, 0x00],
  number: number,
  ticks: 0,
  millis: 0,
}

export type TextEvent = {
  type: [0xff, 0x01],
  text: string,
  ticks: number,
  millis: number,
}

export type CopyrightEvent = {
  type: [0xff, 0x02],
  text: string,
  ticks: 0,
  millis: 0,
}

export type TrackNameEvent = {
  type: [0xff, 0x03],
  text: string,
  ticks: 0,
  millis: 0,
}

export type InstrumentNameEvent = {
  type: [0xff, 0x04],
  text: string,
  ticks: number,
  millis: number,
}

export type LyricsEvent = {
  type: [0xff, 0x05],
  text: string,
  ticks: number,
  millis: number,
}

export type MarkerEvent = {
  type: [0xff, 0x06],
  text: string,
  ticks: number,
  millis: number,
}

export type CuePointEvent = {
  type: [0xff, 0x07],
  text: string,
  ticks: number,
  millis: number,
}

export type ChannelPrefixEvent = {
  type: [0xff, 0x20],
  channel: number,
  ticks: number,
  millis: number,
}

export type EndOfTrackEvent = {
  type: [0xff, 0x2f],
  channel: number,
  ticks: number,
  millis: number,
}

export type TempoEvent = {
  type: [0xff, 0x51],
  ticks: number,
  millis: number,
  bpm: number,
}

export type SMPTEOffsetEvent = {
  type: [0xff, 0x54],
  ticks: number,
  millis: number,
  frameRate: number,
  hour: number,
  min: number,
  sec: number,
  frame: number,
  subFrame: number,
}

export type TimeSignatureEvent = {
  type: [0xff, 0x58],
  ticks: number,
  millis: number,
  numerator: number,
  denominator: number,
  metronome: number,
  thirtySeconds: number,
}

export type KeySignatureEvent = {
  type: [0xff, 0x59],
  ticks: number,
  millis: number,
  key: number,
  scale: number,
}

export type SequenceSpecificEvent = {
  type: [0xff, 0x7f],
  ticks: number,
  millis: number,
  key: number,
  scale: number,
}

export type SysexEvent = {
  type: [0xf0],
  ticks: number,
  millis: number,
  data: number,
}

export type DividedSysexEvent = {
  type: [0xf7],
  ticks: number,
  millis: number,
  data: number,
}


export type MidiEvent =
  // midi
  | NoteOnEvent
  | NoteOffEvent
  | AftertouchEvent
  | ControllerEvent
  | ProgramChangeEvent
  | ChannelAftertouchEvent
  | PitchBendEvent
  // meta
  | SequenceNumberEvent
  | TextEvent
  | CopyrightEvent
  | TrackNameEvent
  | InstrumentNameEvent
  | LyricsEvent
  | MarkerEvent
  | CuePointEvent
  | ChannelPrefixEvent
  | EndOfTrackEvent
  | TempoEvent
  | SMPTEOffsetEvent
  | TimeSignatureEvent
  | KeySignatureEvent
  | SequenceSpecificEvent
  // sysex
  | SysexEvent
  | DividedSysexEvent
  ;




