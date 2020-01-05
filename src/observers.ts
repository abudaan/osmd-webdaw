import 'jzz';
import sequencer from 'heartbeat-sequencer';
import { setStaveNoteColor } from './util/osmd-stavenote-color';
import { TypeNoteMapping, mapOSMDToSequencer } from './util/osmd-heartbeat';
import { AppState } from './redux/store';
import { Observable } from 'rxjs';
import { distinctUntilChanged, pluck, tap, map, filter, distinctUntilKeyChanged } from 'rxjs/operators';
import { SongState, SongActions } from './redux/song-reducer';
import { Dispatch } from 'redux';
import { songReady, updateNoteMapping } from './redux/actions';
import { parseMusicXML } from './util/musicxml';
import { getGraphicalNotesPerBar } from './util/osmd-notes';
import { isNil } from 'ramda';

export const manageSong = async (state$: Observable<AppState>, dispatch: Dispatch) => {
  state$.pipe(
    pluck('song'),
    filter((state) => { return state.currentMIDIFile !== null }),
    distinctUntilChanged((a, b) => {
      if (a.currentMIDIFile === null || b.currentMIDIFile === null) {
        return true;
      }
      return a.currentMIDIFile.id === b.currentMIDIFile.id;
    }),
    map((state: SongState) => {
      if (state.currentMIDIFile !== null) { // extra check for eslint
        return [state.currentMIDIFile.name, state.instrumentName];
      }
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

  state$.pipe(
    map(state => ({ osmd: state.song.osmd, song: state.song.song, xml: state.song.currentXMLDoc })),
    filter(({ osmd, song, xml }) => { return osmd !== null && song !== null && xml !== null }),
    // tap(val => { console.log(val); }),
    distinctUntilChanged((a, b) => {
      return a.osmd == b.osmd;
    }),
  ).subscribe(async ({ osmd, song, xml }) => {
    if (osmd !== null && song !== null && xml !== null) { // extra check for eslint because it doesn't understand rxjs
      console.log('setup notemapping', osmd);
      const [, , repeats] = parseMusicXML(xml, song.ppq);
      const notesPerBar = await getGraphicalNotesPerBar(osmd, song.ppq);
      const noteMapping = mapOSMDToSequencer(notesPerBar, repeats as number[][], song);
      setupSongListeners(song, noteMapping);
      dispatch(updateNoteMapping(noteMapping));
    }
  });

  state$.pipe(
    map((state: AppState) => ({ song: state.song.song, percentage: state.song.songPositionPercentage })),
    distinctUntilChanged((a, b) => {
      return a.percentage === b.percentage
    })
  ).subscribe(({ percentage, song }) => {
    if (song !== null) {
      song.setPlayhead('percentage', percentage)
    }
  })

}

const setupSongListeners = (song: Heartbeat.Song, noteMapping: TypeNoteMapping) => {
  let scrollPos = 0;
  let currentY = 0;
  let reference = -1;
  const scoreContainer = document.getElementById('score-container');
  if (!scoreContainer) {
    return;
  }
  const controlsHeight = scoreContainer.offsetTop;
  // scoreContainer.onscroll = (e) => {
  //   console.log(scoreContainer.scrollTop);
  // }

  song.addEventListener('event', 'type = NOTE_ON', (event: Heartbeat.MIDIEvent) => {
    const mapping = noteMapping[event.id];
    if (mapping) {
      const el = mapping.vfnote.attrs.el;
      setStaveNoteColor(el, 'red');

      const tmp = mapping.musicSystem.graphicalMeasures[0][0].stave.y;
      // console.log(tmp, currentY);
      if (currentY !== tmp) {
        if (reference === -1) {
          reference = tmp; // this is the initial distance from the top of the score to the first system (title, composer, etc.)
        } else if (currentY !== tmp) {
          const systemOffset = currentY === 0 ? 0 : ((tmp - currentY) / 2);
          console.log('SCROLL', tmp, currentY, systemOffset);
          scrollPos = (tmp + scoreContainer.offsetTop) - reference - controlsHeight + systemOffset;
          currentY = tmp;
          scoreContainer.scroll({
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

