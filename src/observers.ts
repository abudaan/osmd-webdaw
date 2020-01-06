import 'jzz';
import sequencer from 'heartbeat-sequencer';
import { setStaveNoteColor } from './util/osmd-stavenote-color';
import { TypeNoteMapping, mapOSMDToSequencer } from './util/osmd-heartbeat';
import { AppState } from './redux/store';
import { Observable, animationFrameScheduler, defer, of, never, Subject, merge, combineLatest } from 'rxjs';
import { distinctUntilChanged, pluck, tap, map, filter, distinctUntilKeyChanged, takeWhile, timeInterval, repeat, takeUntil, repeatWhen, mapTo, switchMap, take, multicast } from 'rxjs/operators';
import { SongState, SongActions } from './redux/song-reducer';
import { Dispatch } from 'redux';
import { songReady, updateNoteMapping } from './redux/actions';
import { parseMusicXML } from './util/musicxml';
import { getGraphicalNotesPerBar } from './util/osmd-notes';
import { isNil } from 'ramda';

export const manageSong = async (state$: Observable<AppState>, dispatch: Dispatch) => {
  // const requestAnimationFrame$ = defer(() =>
  //   of(animationFrameScheduler.now(), animationFrameScheduler)
  //     .pipe(
  //       repeat(),
  //       map((start: number) => animationFrameScheduler.now() - start)
  //     )
  // );

  const notNull = <T>(value: T | null): value is T => value !== null;

  const requestAnimationFrame$ = of(null, animationFrameScheduler)
    .pipe(
      repeat(),
    )

  const midiFile$ = state$.pipe(
    pluck('song'),
    map(state => state.currentMIDIFile),
    filter(notNull),
    // tap(console.log),
    distinctUntilChanged((a, b) => {
      return a.id === b.id;
    })
  );

  const xmlDoc$ = state$.pipe(
    pluck('song'),
    map(state => state.currentXMLDoc),
    filter(notNull),
    // tap(console.log),
    // distinctUntilChanged((a, b) => {
    //   return a.id === b.id;
    // })
  );

  const osmd$ = state$.pipe(
    pluck('song'),
    map(state => state.osmd),
    filter(notNull),
    // tap(console.log),
    // distinctUntilChanged((a, b) => {
    //   return a.id === b.id;
    // })
  );

  const song$: Observable<Heartbeat.Song> = state$.pipe(
    pluck('song'),
    map(state => state.song),
    filter(notNull),
    // tap(console.log),
    distinctUntilChanged((a, b) => {
      return a.id === b.id;
    }),
  )
  // .pipe(
  //   multicast(() => new Subject<Heartbeat.Song>()),
  // )

  const songIsPlaying$ = state$.pipe(
    map((state: AppState) => state.song.songIsPlaying),
    // tap(val => { console.log('PLAY', val); })
  )
  //.subscribe(val => { console.log('PLAY', val) })

  const noteMapping$: Observable<null | TypeNoteMapping> = state$.pipe(
    pluck('song'),
    map(state => state.noteMapping),
    // filter(notNull),
    // // tap(console.log),
    // distinctUntilChanged((a, b) => {
    //   return a == b;
    // })
  );

  const instrumentName$: Observable<string> = state$.pipe(
    pluck('song'),
    map(state => state.instrumentName),
    filter(notNull),
    distinctUntilChanged((a, b) => {
      return a == b;
    })
  );

  // create a heartbeat song
  combineLatest(midiFile$, osmd$, instrumentName$)
    .pipe(take(1))
    .subscribe(([midiFile, osmd, instrumentName]) => {
      console.log('create song');
      const song = sequencer.createSong(sequencer.getMidiFile(midiFile.name));
      song.tracks.forEach((t: Heartbeat.Track) => {
        t.setInstrument(instrumentName);
      });
      // setupPositionListener(state$, song);
      dispatch(songReady(song));
    });

  combineLatest(song$, osmd$, xmlDoc$, noteMapping$)
    .pipe(
      filter(([, , , mapping]) => mapping === null),
      distinctUntilChanged((a, b) => {
        // console.log('song', a[0].id !== b[0].id)
        // console.log('osmd', a[1] !== b[1])
        // console.log('xml', a[2] !== b[2])
        return a[0].id === b[0].id && a[1] == b[1] && a[2] == b[2];
      }),
      // tap(([song, osmd, xml, mapping]) => { console.log(song === null, osmd === null, xml === null, mapping === null); }),
    )
    .subscribe(async ([song, osmd, xml, mapping]) => {
      console.log('setup notemapping');
      const [, , repeats] = parseMusicXML(xml, song.ppq);
      const notesPerBar = await getGraphicalNotesPerBar(osmd, song.ppq);
      const noteMapping = mapOSMDToSequencer(notesPerBar, repeats as number[][], song);
      // setupSongListeners(song, noteMapping);
      dispatch(updateNoteMapping(noteMapping));
    });

  combineLatest(song$, songIsPlaying$)
    .pipe(
      distinctUntilChanged((a, b) => {
        // return a[0].id === b[0].id && a[1] === b[1];
        // return a[1] === b[1];
        return a[1] === b[1];
      }),
      switchMap(([song, playing]) => {
        if (playing === true) {
          return of(null, animationFrameScheduler).pipe(
            repeat(),
            map(() => song.playhead.data.barsAsString),
          );
        }
        return never();
      })
    )
    .subscribe((pos) => {
      console.log('POS', pos);
    })

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

  // const timer$ = timer();

  // const updatePosition$ = state$.pipe(
  //   map((state: AppState) => state.song.song),
  //   filter((song) => song !== null),
  //   interval(),
  //   map(song => song.playhead.data.barsAsString)
  // )

  // song$.connect();
}

const setupPositionListener = (state$: Observable<AppState>, song: Heartbeat.Song) => {
  const getPosition$ = of(null, animationFrameScheduler).pipe(
    repeat(),
    map(() => {
      if (song === null) {
        return '';
      }
      return song.playhead.data.barsAsString;
    })
  );

  const pauser = new Subject();
  state$.pipe(
    map((state: AppState) => {
      const song = state.song.song;
      if (song === null) {
        return false;
      }
      return song.playing;
    }),
  ).subscribe(playing => {
    pauser.next(!playing);
  })

  pauser.pipe(
    switchMap(paused => paused ? never() : getPosition$),
  ).subscribe(val => console.log(val));
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

