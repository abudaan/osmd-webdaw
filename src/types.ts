import { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";
import { Song, MIDINote } from "./webdaw/types";
import { MIDIEvent } from "./webdaw/midi_events";
import { GraphicalNoteData } from "./webdaw/osmd/getGraphicalNotesPerBar";
import { NoteMapping } from "./webdaw/osmd/mapMIDINoteIdToGraphicalNote";

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
  // parts: PartData[];
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
  // notesPerBar: GraphicalNoteData[][];
  notesPerBar: Array<Array<GraphicalNoteData>>;
  // scoreContainer: HTMLDivElement;
  scoreContainer: any;
  scoreContainerOffsetY: number;
  noteMapping: NoteMapping | null;
};

export type AppState = {
  scores: Score[];
  interpretations: Interpretation[];
  selectedScoreIndex: number;
  selectedInterpretationIndex: number;
  transport: Transport;
  playheadMillis: number;
  currentInterpretation: RefMIDI | null;
  currentScore: RefScore | null;
  durationTimeline: number;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  selectedNoteData: { bar: number; ticks: number; noteNumber: number } | null;
};
