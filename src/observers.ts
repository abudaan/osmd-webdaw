import 'jzz';
import sequencer from 'heartbeat-sequencer';
import { setStaveNoteColor } from './util/osmd-stavenote-color';
import { TypeNoteMapping, mapOSMDToSequencer } from './util/osmd-heartbeat';
import { AppState } from './redux/store';
import { Observable, animationFrameScheduler, defer, of, never, Subject, merge, combineLatest, interval } from 'rxjs';
import { distinctUntilChanged, pluck, tap, map, filter, distinctUntilKeyChanged, takeWhile, timeInterval, repeat, takeUntil, repeatWhen, mapTo, switchMap, take, multicast, share } from 'rxjs/operators';
import { SongState, SongActions } from './redux/song-reducer';
import { Dispatch } from 'redux';
import { songReady, updateNoteMapping } from './redux/actions';
import { parseMusicXML } from './util/musicxml';
import { getGraphicalNotesPerBar } from './util/osmd-notes';
import { isNil } from 'ramda';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay/build/dist/src';

export const manageSong = async (state$: Observable<AppState>, dispatch: Dispatch) => {
  const requestAnimationFrame$ = defer(() =>
    of(animationFrameScheduler.now(), animationFrameScheduler)
      .pipe(
        repeat(),
        map((start: number) => animationFrameScheduler.now() - start)
      )
  );

  const notNull = <T>(value: T | null): value is T => value !== null;

  const midiFile$ = state$.pipe(
    pluck('song'),
    map(state => state.currentMIDIFile),
    filter(notNull),
    // tap(console.log),
    distinctUntilChanged((a, b) => {
      return a.id === b.id;
    }),
    share(),
  );

  const xmlDoc$ = state$.pipe(
    pluck('song'),
    map(state => state.currentXMLDoc),
    filter(notNull),
    distinctUntilChanged(),
    // tap(console.log),
    share(),
  );

  const osmd$ = state$.pipe(
    pluck('song'),
    map(state => state.osmd),
    filter(notNull),
    distinctUntilChanged(),
    // tap(console.log),
    share(),
  );

  const song$: Observable<Heartbeat.Song> = state$.pipe(
    pluck('song'),
    map(state => state.song),
    filter(notNull),
    // tap(console.log),
    distinctUntilChanged((a, b) => {
      return a.id === b.id;
    }),
    share(),
  )

  const songIsPlaying$ = state$.pipe(
    map((state: AppState) => state.song.songIsPlaying),
    share(),
  )

  const songAction$ = state$.pipe(
    map((state: AppState) => state.song.songAction),
    share(),
  )

  const songPositionPercentage$ = state$.pipe(
    map((state: AppState) => state.song.songPositionPercentage),
    share(),
  )

  const noteMapping$: Observable<null | TypeNoteMapping> = state$.pipe(
    pluck('song'),
    map(state => state.noteMapping),
    // filter(notNull), -> don't filter null values because we check on a null value, see below
    distinctUntilChanged(),
    share(),
  );

  const instrumentName$: Observable<string> = state$.pipe(
    pluck('song'),
    map(state => state.instrumentName),
    filter(notNull),
    distinctUntilChanged(),
    share(),
  );

  // create a heartbeat song when both the MIDI file has loaded and the MusicXML file has been
  // loaded and rendered to VefFlow (this is why we subscribe to osmd$)
  combineLatest(midiFile$, osmd$, instrumentName$)
    .pipe(take(1))
    .subscribe(([midiFile, osmd, instrumentName]) => {
      console.log('create song');
      const song = sequencer.createSong(sequencer.getMidiFile(midiFile.name));
      song.tracks.forEach((t: Heartbeat.Track) => {
        t.setInstrument(instrumentName);
      });
      dispatch(songReady(song));
    });

  // setup note mapping between the graphical notes of the score and the MIDI events
  // of the heartbeat song
  combineLatest(song$, osmd$, xmlDoc$, noteMapping$)
    .pipe(
      filter(([, , , mapping]) => mapping === null),
    )
    .subscribe(async ([song, osmd, xml]) => {
      console.log('setup notemapping');
      const [, , repeats] = parseMusicXML(xml, song.ppq);
      const notesPerBar = await getGraphicalNotesPerBar(osmd, song.ppq);
      const noteMapping = mapOSMDToSequencer(notesPerBar, repeats as number[][], song);
      setupSongListeners(song, noteMapping, osmd);
      dispatch(updateNoteMapping(noteMapping));
      // we need to skip a cycle here because, well actually I don't know why this is
      // setTimeout(() => {
      // }, 0);
    });

  // get the position in bars and beat while the song is playing
  combineLatest(song$, songIsPlaying$)
    .pipe(
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
      // console.log('POS', pos);
    })

  // update the transport controls
  combineLatest(song$, songAction$).subscribe(([song, action]) => {
    if (action === SongActions.PLAY) {
      song.play();
    } else if (action === SongActions.PAUSE) {
      song.pause();
    } else if (action === SongActions.STOP) {
      song.stop();
    }
  });

  combineLatest(song$, songPositionPercentage$).subscribe(([song, percentage]) => {
    song.setPlayhead('percentage', percentage);
    // console.log(song.playhead.activeNotes);
  })

  // const timer$ = timer();

  // const updatePosition$ = state$.pipe(
  //   map((state: AppState) => state.song.song),
  //   filter((song) => song !== null),
  //   interval(),
  //   map(song => song.playhead.data.barsAsString)
  // )
}


// @TODO; use song.playhead.activeNotes here instead of eventlisteners!!

const setupSongListeners = (song: Heartbeat.Song, noteMapping: TypeNoteMapping, osmd: OpenSheetMusicDisplay) => {
  let scrollPos = 0;
  let currentY = 0;
  const scoreContainer = (osmd['container'] as HTMLDivElement).parentElement;
  if (!scoreContainer) {
    return;
  }
  const controlsHeight = scoreContainer.offsetTop;
  // this is the initial distance from the top of the score to the first system (title, composer, etc.)
  const distanceToFirstSystem = noteMapping[Object.keys(noteMapping)[0]].musicSystem.graphicalMeasures[0][0].stave.y;
  // scoreContainer.onscroll = (e) => {
  //   console.log(scoreContainer.scrollTop);
  // }

  song.addEventListener('event', 'type = NOTE_ON', (event: Heartbeat.MIDIEvent) => {
    const mapping = noteMapping[event.id];
    if (mapping) {
      const el: SVGGElement = mapping.vfnote.attrs.el;
      setStaveNoteColor(el, 'red');

      const tmp = mapping.musicSystem.graphicalMeasures[0][0].stave.y;
      // console.log(tmp, currentY);
      // if (currentY !== tmp) {
      const systemOffset = 0;//currentY === 0 ? 0 : ((tmp - currentY) / 2);
      console.log('SCROLL', tmp, currentY, systemOffset);
      scrollPos = (tmp + scoreContainer.offsetTop) - distanceToFirstSystem - controlsHeight + systemOffset;
      currentY = tmp;
      scoreContainer.scroll({
        top: scrollPos,
        behavior: 'smooth'
      });
      // }
    }
  });

  song.addEventListener('event', 'type = NOTE_OFF', (event) => {
    const noteOn = event.midiNote.noteOn;
    const mapping = noteMapping[noteOn.id];
    if (mapping) {
      const el: SVGGElement = mapping.vfnote.attrs.el;
      setStaveNoteColor(el, 'black');
    }
  });
}

