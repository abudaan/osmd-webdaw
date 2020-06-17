import { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";
import { PartData } from "../webdaw/musicxml";
import { Song } from "../webdaw/types";
import { MIDIEvent } from "../webdaw/midi_events";

export enum Transport {
  PLAY = "play",
  PAUSE = "pause",
  STOP = "stop",
  RECORD = "record",
}

export type AppDispatch = ThunkDispatch<AppState, any, AnyAction>;

export type Score = {
  name: string;
  // file: XMLDocument;
  file: any;
  repeats: number[][];
  parts: PartData[];
  interpretations?: string[];
};

export type Interpretation = {
  name: string;
  file: Song;
};

export type RefMIDI = {
  id: string;
  song: Song;
  timestamp: number;
  millis: number;
  index: number;
  scheduled: MIDIEvent[];
};

export type AppState = {
  scores: Score[];
  interpretations: Interpretation[];
  selectedScoreIndex: number;
  selectedInterpretationIndex: number;
  transport: Transport;
  playheadMillis: number;
  currentInterpretation: RefMIDI;
};
