export interface BaseEvent {
  ticks: number;
  descr: string;
  type: number;
  channel?: number;
  subType?: number;
  millis?: number;
  trackId?: string;
  part?: string;
}

export interface NoteOnEvent extends BaseEvent {
  type: 0x80;
  // type: number;
  descr: "note on";
  // descr: string;
  // ticks: number;
  channel: number;
  noteNumber: number;
  velocity: number;
}

export interface NoteOffEvent extends BaseEvent {
  // type: 0x90;
  // type: number;
  // descr: "note off";
  // descr: string;
  // ticks: number;
  // trackId: string;
  channel: number;
  // millis?: number;
  noteNumber: number;
  // velocity: 0;
  velocity: number;
}

export type AftertouchEvent = {
  type: 0xa0;
  descr: "note aftertouch";
  ticks: number;
  trackId: string;
  channel: number;
  millis: number;
  noteNumber: number;
  amount: number;
};

export type ControllerEvent = {
  type: 0xb0;
  descr: "controller";
  ticks: number;
  trackId: string;
  channel: number;
  millis: number;
  value: number;
  controllerNumber: number;
};

export type ProgramChangeEvent = {
  type: 0xc0;
  descr: "program change";
  ticks: number;
  trackId: string;
  channel: number;
  millis: number;
  programNumber: number;
};

export type ChannelAftertouchEvent = {
  type: 0xd0;
  descr: "channel aftertouch";
  ticks: number;
  trackId: string;
  channel: number;
  millis: number;
  noteNumber: number;
  amount: number;
};

export type PitchBendEvent = {
  type: 0xe0;
  descr: "pitch bend";
  ticks: number;
  trackId: string;
  channel: number;
  millis: number;
  noteNumber: number;
  value: number;
};

// META

export type SequenceNumberEvent = {
  type: 0xff;
  subType: 0x00;
  descr: "sequence number";
  number: number;
  trackId: string;
  ticks: 0;
  millis: 0;
};

export type TextEvent = {
  type: 0xff;
  subType: 0x01;
  descr: "text";
  text: string;
  ticks: number;
  trackId: string;
  millis: number;
};

export type CopyrightEvent = {
  type: 0xff;
  subType: 0x02;
  descr: "copyright notice";
  text: string;
  ticks: 0;
  trackId: string;
  millis: 0;
};

export type TrackNameEvent = {
  type: 0xff;
  subType: 0x03;
  descr: "track name";
  text: string;
  ticks: 0;
  trackId: string;
  millis: 0;
};

export type InstrumentNameEvent = {
  type: 0xff;
  subType: 0x04;
  descr: "instrument name";
  text: string;
  ticks: number;
  trackId: string;
  millis: number;
};

export type LyricsEvent = {
  type: 0xff;
  subType: 0x05;
  descr: "lyrics";
  text: string;
  ticks: number;
  trackId: string;
  millis: number;
};

export type MarkerEvent = {
  type: 0xff;
  subType: 0x06;
  descr: "marker";
  text: string;
  ticks: number;
  trackId: string;
  millis: number;
};

export type CuePointEvent = {
  type: 0xff;
  subType: 0x07;
  descr: "cue point";
  text: string;
  ticks: number;
  trackId: string;
  millis: number;
};

export type ChannelPrefixEvent = {
  type: 0xff;
  subType: 0x20;
  descr: "channel prefix";
  channel: number;
  ticks: number;
  trackId: string;
  millis: number;
};

export type EndOfTrackEvent = {
  type: 0xff;
  subType: 0x2f;
  descr: "end of track";
  channel: number;
  trackId: string;
  ticks: number;
  millis: number;
};

export interface TempoEvent extends BaseEvent {
  type: 0xff;
  subType: 0x51;
  descr: "tempo";
  bpm: number;
  millisPerTick: number;
}

export type SMPTEOffsetEvent = {
  type: 0xff;
  subType: 0x54;
  descr: "smpte offset";
  ticks: number;
  trackId: string;
  millis: number;
  frameRate: number;
  hour: number;
  min: number;
  sec: number;
  frame: number;
  subFrame: number;
};

export interface TimeSignatureEvent extends BaseEvent {
  type: 0xff;
  subType: 0x58;
  descr: "time signature";
  numerator: number;
  denominator: number;
  metronome: number;
  thirtySeconds: number;
}

export type KeySignatureEvent = {
  type: 0xff;
  subType: 0x59;
  descr: "key signature";
  ticks: number;
  trackId: string;
  millis: number;
  key: number;
  scale: number;
};

export type SequenceSpecificEvent = {
  type: 0xff;
  subType: 0x7f;
  descr: "sequencer specific";
  ticks: number;
  trackId: string;
  millis: number;
  key: number;
  scale: number;
};

export type SysexEvent = {
  type: 0xf0;
  descr: "system exclusive";
  ticks: number;
  trackId: string;
  millis: number;
  data: number;
};

export type DividedSysexEvent = {
  type: 0xf7;
  descr: "divided system exclusive";
  ticks: number;
  trackId: string;
  millis: number;
  data: number;
};

// like in Java
export type ShortMessage =
  // midi
  | NoteOnEvent
  | NoteOffEvent
  | AftertouchEvent
  | ControllerEvent
  | ProgramChangeEvent
  | ChannelAftertouchEvent
  | PitchBendEvent;

export type MetaMessage =
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
  | SequenceSpecificEvent;

export type SystemMessage =
  // sysex
  SysexEvent | DividedSysexEvent;

export type MIDIEvent =
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
  | DividedSysexEvent;
