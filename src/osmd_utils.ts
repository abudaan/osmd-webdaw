import { from, Observable } from 'rxjs';
import { map, reduce } from 'rxjs/operators';
import { OpenSheetMusicDisplay, GraphicalStaffEntry, GraphicalNote, VexFlowGraphicalNote } from 'opensheetmusicdisplay'

type TypeStave = {
  staffEntries: GraphicalStaffEntry[]
}

type TypeNoteData = {
  vfnote: Vex.Flow.Note
}

// path: openSheetMusicDisplay.GraphicSheet.MeasureList[0][0].staffEntries[0].graphicalVoiceEntries[0].notes[0];
// path: openSheetMusicDisplay.GraphicSheet.MeasureList[0][0].parentMusicSystem

const getNoteData = (osmd: OpenSheetMusicDisplay, ppq: number): Promise<TypeNoteData[]> => from(osmd.graphic.measureList)
  .pipe(
    // tap(m => { console.log(m); }),
    map((staves: any, i) => {
      return staves.map((s: TypeStave) => {
        const parentMusicSystem = staves[0].parentMusicSystem;
        return s.staffEntries.map(se => {
          return se.graphicalVoiceEntries.map(ve => {
            // return ve.notes;
            return ve.notes.map((n: GraphicalNote) => {
              const relPosInMeasure = n.sourceNote.voiceEntry.timestamp.realValue;
              const vfnote = (n as VexFlowGraphicalNote).vfnote[0];
              return {
                vfnote,
                ticks: (i * ppq * 4) + (relPosInMeasure * ppq * 4),
                noteNumber: n.sourceNote.halfTone + 12, // this is weird!
                bar: i + 1,
                parentMusicSystem,
              };
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

export { getNoteData };