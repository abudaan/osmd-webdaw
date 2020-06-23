import { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";
import { PartData } from "./webdaw/musicxml/parser";
import { Song, MIDINote } from "./webdaw/types";
import { MIDIEvent } from "./webdaw/midi_events";
import { GraphicalNoteData } from "./util/osmd-notes";
import { NoteMapping } from "./util/note_mapping";

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
  indexScheduler: number;
  indexHighlighter: number;
  activeNotes: MIDINote[];
  passiveNotes: MIDINote[];
  inLoop: boolean;
  scheduled: MIDIEvent[];
};

export type RefScore = {
  notesPerBar: GraphicalNoteData[][];
  // scoreContainer: HTMLDivElement;
  scoreContainer: any;
  scoreContainerOffsetY: number;
  noteMapping: NoteMapping;
};

export type AppState = {
  scores: Score[];
  interpretations: Interpretation[];
  selectedScoreIndex: number;
  selectedInterpretationIndex: number;
  transport: Transport;
  playheadMillis: number;
  currentInterpretation: RefMIDI;
  currentScore: RefScore;
  durationTimeline: number;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
};
