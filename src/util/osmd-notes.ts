/*
  This method parses the SVG document as rendered by OSMD and stores the graphical representations of the notes
  in an array; notes are stored per measure (bar) in a sub-array so we end up with an array the size of the number
  of bars, containing array that contain the notes in that bar.

  I use the following paths: 
  - openSheetMusicDisplay.GraphicSheet.MeasureList[0][0].staffEntries[0].graphicalVoiceEntries[0].notes[0];
  - openSheetMusicDisplay.GraphicSheet.MeasureList[0][0].parentMusicSystem

  More info: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/issues/549
*/

import { from } from 'rxjs';
import { map, reduce } from 'rxjs/operators';
import { OpenSheetMusicDisplay, GraphicalStaffEntry, GraphicalNote, VexFlowGraphicalNote, MusicSystem } from 'opensheetmusicdisplay'

type TypeStave = {
  staffEntries: GraphicalStaffEntry[]
}

export type TypeGraphicalNoteData = {
  vfnote: Vex.Flow.Note
  ticks: number
  noteNumber: number,
  bar: number,
  parentMusicSystem: MusicSystem
}

const getGraphicalNotesPerBar = (osmd: OpenSheetMusicDisplay, ppq: number): Promise<TypeGraphicalNoteData[][]> =>
  from(osmd.graphic.measureList)
    .pipe(
      // tap(m => { console.log(m); }),
      map((staves: any, i) => {
        return staves.map((s: TypeStave) => {
          const parentMusicSystem = staves[0].parentMusicSystem;
          return s.staffEntries.map(se => {
            return se.graphicalVoiceEntries.map(ve => {
              // return ve.notes;
              return ve.notes
                .map((n: GraphicalNote) => {
                  const relPosInMeasure = n.sourceNote.voiceEntry.timestamp.realValue;
                  const vfnote = (n as VexFlowGraphicalNote).vfnote[0];
                  return {
                    vfnote,
                    ticks: (i * ppq * 4) + (relPosInMeasure * ppq * 4),
                    noteNumber: n.sourceNote.halfTone + 12, // heartbeat uses a different MIDI note number mapping
                    bar: i + 1,
                    parentMusicSystem, // necessary to get the y-position if the note in the score
                  };
                })
                .sort((a, b) => {
                  console.log(a, b);
                  if (a.ticks < b.ticks) {
                    return -1;
                  } else if (a.ticks > b.ticks) {
                    return 1;
                  }
                  return 0;
                });
            });
          });
        });
      }),
      reduce((acc: any[], val) => {
        acc.push(val.flat(3));
        return acc;
      }, []),
    ).toPromise();

export { getGraphicalNotesPerBar };