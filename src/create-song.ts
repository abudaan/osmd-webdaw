import 'jzz';
import sequencer from 'heartbeat-sequencer';
import { addAssetPack, loadJSON, createSongFromMIDIFile } from './util/heartbeat-utils';
import { setStaveNoteColor } from './util/osmd-stavenote-color';
import { TypeNoteMapping } from './util/osmd-heartbeat';
import { AppState } from './redux/store';
import { Observable } from 'rxjs';
import { Store } from 'redux';
import { distinctUntilChanged, pluck, tap, map, filter } from 'rxjs/operators';
import { SongState, SongActions } from './redux/song-reducer';
import { Dispatch } from 'redux';
import { songReady } from './redux/actions';

export const createSong = async (state$: Observable<AppState>, dispatch: Dispatch) => {
  state$.pipe(
    pluck('song'),
    filter((state) => { return state.currentMIDIFileIndex !== -1 }),
    distinctUntilChanged((a, b) => {
      return a.currentMIDIFileIndex === b.currentMIDIFileIndex;
    }),
    map((state: SongState) => {
      return [state.midiFiles[state.currentMIDIFileIndex].name, state.instrumentName];
    })
  ).subscribe(([midiFileName, instrumentName]) => {
    const song = sequencer.createSong(sequencer.getMidiFile(midiFileName));
    song.tracks.forEach((t: Heartbeat.Track) => {
      t.setInstrument(instrumentName);
    });
    dispatch(songReady(song));
  });

  state$.pipe(
    map(state => ({ songAction: state.song.songAction, song: state.song.song })),
    filter(({ songAction, song }) => { return songAction !== '' && song !== null }),
    // tap(val => { console.log(val); }),
    distinctUntilChanged((a, b) => {
      return a.songAction === b.songAction;
    }),
  ).subscribe(({ songAction, song }) => {
    if (song !== null) {
      if (songAction === SongActions.PLAY) {
        song.play();
      } else if (songAction === SongActions.PAUSE) {
        song.pause();
      } else if (songAction === SongActions.STOP) {
        song.stop();
      }
    }
  });
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

