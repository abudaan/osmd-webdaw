import { MusicSystem } from "opensheetmusicdisplay";
import { GraphicalNoteData } from "./osmd-notes";
import { Song } from "../webdaw/types";

/*
  This method maps the notes in the SVG document of the score to MIDI notes in the sequencer
*/

export type NoteMapping = {
  [index: string]: {
    vfnote: Vex.Flow.Note;
    musicSystem: MusicSystem;
  };
};

export const mapNotes = (
  graphicalNotesPerBar: GraphicalNoteData[][],
  repeats: number[][],
  song: Song
): NoteMapping => {
  let barIndex = -1;
  let barOffset = 0;
  let ticksOffset = 0; // not used, keep for reference
  let repeatIndex: number = 0;
  const hasRepeated: { [index: number]: boolean } = {};
  const events = song.events.filter(event => event.type === 144);
  // console.log(events);
  const { bars: numBars, ppq } = song;
  const mapping: NoteMapping = {};

  while (true) {
    barIndex++;
    // console.log(barIndex, repeatIndex, hasRepeated[repeatIndex], repeats[repeatIndex][1]);
    if (barIndex === repeats[repeatIndex][1]) {
      if (hasRepeated[repeatIndex] !== true) {
        barIndex = repeats[repeatIndex][0] - 1;
        // console.log('REPEAT START', barIndex)
        hasRepeated[repeatIndex] = true;
        barOffset += repeats[repeatIndex][1] - repeats[repeatIndex][0] + 1;
        ticksOffset += (repeats[repeatIndex][1] - repeats[repeatIndex][0]) * song.nominator * ppq;
      } else {
        // console.log('REPEAT END', barIndex, repeatIndex);
        repeatIndex++;
        if (repeatIndex === repeats.length || barIndex === numBars) {
          break;
        }
      }
    } else {
      // console.log('CONTINUE', barIndex)
      if (barIndex === numBars) {
        break;
      }
    }

    // get all sequencer MIDI events in this bar
    const filtered = events.filter(e => e.bar === barIndex + 1 + barOffset);
    // console.log(barIndex + 1 + barOffset, filtered.length);

    graphicalNotesPerBar[barIndex]
      .sort((a, b) => {
        if (a.ticks < b.ticks) {
          return -1;
        } else if (a.ticks > b.ticks) {
          return 1;
        }
        return 0;
      })
      .forEach(bd => {
        const { vfnote, noteNumber, bar, parentMusicSystem } = bd;
        for (let j = 0; j < filtered.length; j++) {
          const event = filtered[j];
          if (
            !mapping[event.id] &&
            event.bar == bar + barOffset &&
            event.noteNumber == noteNumber
          ) {
            mapping[event.id] = { vfnote, musicSystem: parentMusicSystem };
            // filtered.splice(j, 1);
            break;
          }
        }
      });
  }

  return mapping;
};
