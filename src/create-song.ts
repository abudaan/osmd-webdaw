import 'jzz';
import sequencer from 'heartbeat-sequencer';
import { addAssetPack, loadJSON, createSongFromMIDIFile } from './util/heartbeat-utils';
import { setStaveNoteColor } from './util/osmd-stavenote-color';
import { TypeNoteMapping } from './util/osmd-heartbeat';
import { AppState } from './redux/store';
import { Observable } from 'rxjs';
import { Store } from 'redux';
import { distinctUntilChanged, pluck, tap, map, filter } from 'rxjs/operators';
import { SongState } from './redux/song-reducer';

const createSong2 = async (store: Store<AppState>, state$: Observable<AppState>) => {
  state$.pipe(
    pluck('song'),
    filter((state) => { return state.midiFiles.length > 0 && state.xmlDocs.length > 0 }),
    distinctUntilChanged((a, b) => {
      // console.log(a.midiFiles.length, b.midiFiles.length)
      return a.midiFiles.length === b.midiFiles.length && a.xmlDocs.length === b.xmlDocs.length;
    }),
    map((state: SongState) => {
      return [state.midiFiles[0], state.instrument];
    })
  ).subscribe(val => {
    console.log(val);

  });
}

const createSong = (midiFileName: string, instrumentName: string): Heartbeat.Song => {
  const midifile = sequencer.getMidiFile(midiFileName);
  const song = sequencer.createSong(midifile);
  song.tracks.forEach((t: Heartbeat.Track) => { t.setInstrument(instrumentName); });
  return song;
}

const setupSongListeners = (song: Heartbeat.Song, noteMapping: TypeNoteMapping) => {
  let scrollPos = 0;
  let currentY = 0;
  let reference = -1;

  song.addEventListener('event', 'type = NOTE_ON', (event: Heartbeat.MIDIEvent) => {
    const mapping = noteMapping[event.id];
    if (mapping) {
      const el = mapping.vfnote.attrs.el;
      setStaveNoteColor(el, 'red');

      const tmp = mapping.musicSystem.graphicalMeasures[0][0].stave.y;
      if (currentY !== tmp) {
        currentY = tmp;
        const bbox = el.getBoundingClientRect();
        // console.log(bbox.y, window.pageYOffset);
        if (reference === -1) {
          reference = bbox.y;
        } else {
          scrollPos = (bbox.y + window.pageYOffset) - reference;
          window.scroll({
            top: scrollPos,
            behavior: 'smooth'
          });
        }
      }
    }
  });

  song.addEventListener('event', 'type = NOTE_OFF', (event) => {
    const noteOn = event.midiNote.noteOn;
    const mapping = noteMapping[noteOn.id];
    if (mapping) {
      const el = mapping.vfnote.attrs.el;
      setStaveNoteColor(el, 'black');
    }
  });

}

export {
  createSong,
  setupSongListeners,
}