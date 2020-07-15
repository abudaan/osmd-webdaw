import "jzz";
import sequencer from "heartbeat-sequencer";
import { setStaveNoteColor } from "./webdaw/osmd/osmd-stavenote-color";
import { NoteMapping, mapOSMDToSequencer } from "./webdaw/osmd/osmd-heartbeat";
import { AppState } from "./redux/store";
import {
  Observable,
  animationFrameScheduler,
  defer,
  of,
  never,
  Subject,
  merge,
  combineLatest,
  interval,
  BehaviorSubject,
  from,
  zip,
  Subscriber,
} from "rxjs";
import {
  distinctUntilChanged,
  pluck,
  tap,
  map,
  filter,
  distinctUntilKeyChanged,
  takeWhile,
  timeInterval,
  repeat,
  takeUntil,
  repeatWhen,
  mapTo,
  switchMap,
  take,
  multicast,
  share,
  delay,
  mergeMap,
  scan,
  reduce,
} from "rxjs/operators";
import { SongState, SongActions } from "./redux/song-reducer";
import { Dispatch } from "redux";
import { songReady, updateNoteMapping, updatePlayheadMillis } from "./redux/actions1";
import { parseMusicXML } from "./util/musicxml";
import { getGraphicalNotesPerBar } from "./webdaw/osmd/osmd-notes";
import { flatten } from "ramda";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay/build/dist/src";

export const manageSong = async (state$: Observable<AppState>, dispatch: Dispatch) => {
  const requestAnimationFrame$ = defer(() =>
    of(animationFrameScheduler.now(), animationFrameScheduler).pipe(
      repeat(),
      map((start: number) => animationFrameScheduler.now() - start)
    )
  );

  const notNull = <T>(value: T | null): value is T => value !== null;

  const midiFile$ = state$.pipe(
    pluck("data"),
    map(state => state.currentMIDIFile),
    filter(notNull),
    // tap(console.log),
    distinctUntilChanged((a, b) => {
      return a.id === b.id;
    }),
    share()
  );

  const xmlDoc$ = state$.pipe(
    pluck("data"),
    map(state => state.currentXMLDoc),
    // tap(console.log),
    filter(notNull),
    distinctUntilChanged(),
    share()
  );

  const osmd$ = state$.pipe(
    pluck("song"),
    map(state => state.osmd),
    filter(notNull),
    distinctUntilChanged(),
    tap(console.log),
    share()
  );

  const song$: Observable<Heartbeat.Song> = state$.pipe(
    pluck("song"),
    pluck("song"),
    filter(notNull),
    // tap(console.log),
    distinctUntilChanged((a, b) => {
      return a.id === b.id;
    }),
    share()
  );

  const keyEditor$: Observable<Heartbeat.KeyEditor> = state$.pipe(
    pluck("song"),
    pluck("keyEditor"),
    filter(notNull),
    // tap(console.log),
    distinctUntilChanged((a, b) => {
      return a.song.id === b.song.id;
    }),
    share()
  );

  const songIsPlaying$ = state$.pipe(
    map((state: AppState) => state.song.songIsPlaying),
    share()
  );

  const playheadSeeking$ = state$.pipe(
    pluck("song"),
    pluck("playheadSeeking"),
    distinctUntilChanged(),
    share()
  );

  const songAction$ = state$.pipe(
    map((state: AppState) => state.song.songAction),
    distinctUntilChanged(),
    share()
  );

  const sliderPositionPercentage$ = state$.pipe(
    map((state: AppState) => state.song.sliderPositionPercentage),
    distinctUntilChanged(),
    share()
  );

  const scoreContainer$ = state$.pipe(
    map((state: AppState) => state.song.scoreContainer),
    distinctUntilChanged(),
    share()
  );

  const scoreContainerOffsetY$ = state$.pipe(
    map((state: AppState) => state.song.scoreContainerOffsetY),
    distinctUntilChanged(),
    share()
  );

  const noteMapping$: Observable<NoteMapping> = state$.pipe(
    pluck("song"),
    map(state => state.noteMapping),
    filter(notNull), //-> don't filter null values because we check on a null value, see below
    distinctUntilChanged(),
    share()
  );

  const instrumentName$: Observable<string> = state$.pipe(
    pluck("data"),
    pluck("instrumentName"),
    // map(state => state.instrumentName),
    filter(notNull),
    distinctUntilChanged(),
    share()
  );

  // create a heartbeat song when both the MIDI file has loaded and the MusicXML file has been
  // loaded and rendered to VexFlow (this is why we need subscribe to osmd$ as well)
  combineLatest(midiFile$, osmd$, instrumentName$)
    // .pipe(take(1))
    .subscribe(([midiFile, osmd, instrumentName]) => {
      console.log("create song");
      const song = sequencer.createSong(sequencer.getMidiFile(midiFile.name));
      song.tracks.forEach((t: Heartbeat.Track) => {
        t.setInstrument(instrumentName);
      });
      const keyEditor = sequencer.createKeyEditor(song, {
        viewportHeight: 100,
        viewportWidth: 100,
        lowestNote: 21,
        highestNote: 108,
        barsPerPage: 16,
      });
      dispatch(songReady(song, keyEditor));
      setupListeners(song);
    });

  // setup note mapping between the graphical notes of the score and the MIDI events
  // of the heartbeat song
  combineLatest(song$, osmd$, xmlDoc$)
    // .pipe(
    //   filter(([, osmd,]) => osmd === null),
    // )
    .pipe(take(1))
    .subscribe(async ([song, osmd, xml]) => {
      console.log("setup notemapping");
      const { repeats } = parseMusicXML(xml, song.ppq);
      const notesPerBar = await getGraphicalNotesPerBar(osmd, song.ppq);
      const noteMapping = mapOSMDToSequencer(notesPerBar, repeats as number[][], song);
      // setupSongListeners(song, noteMapping, osmd);
      // we need to skip a cycle here because, well actually I don't know why this is
      setTimeout(() => {
        dispatch(updateNoteMapping(noteMapping));
      }, 0);
    });

  const setupListeners = (song: Heartbeat.Song) => {
    // a tiny bit of state:
    let millis = 0;
    console.log("setupListeners");

    const songPositionObservable$ = new Observable((observer: Subscriber<Heartbeat.Song>) => {
      observer.next(song);
      // return of({ song, millis: 0 }, animationFrameScheduler).pipe(
      return of(song, animationFrameScheduler)
        .pipe(
          repeat(),
          // distinctUntilChanged((a, _) => a.millis === a.song.playhead.data.millis),
          distinctUntilChanged((a, _) => millis === a.playhead.data.millis),
          // scan((acc, cur) => { return { song: cur.song, millis: cur.song.playhead.data.millis } }),
          tap(song => {
            millis = song.playhead.data.millis;
          })
        )
        .subscribe(_ => {
          // console.log('Song position observer running for Song:', song.id);
          observer.next(song);
        });
    });

    // get the position in millis while the song is playing
    const songPositionMillisObservable$ = songPositionObservable$.pipe(
      map(song => song.playhead.data.millis),
      distinctUntilChanged(),
      share()
    );

    // update the position slider
    songPositionMillisObservable$.subscribe(millis => {
      dispatch(updatePlayheadMillis(millis));
    });

    // get the active notes based on the playhead positions
    type ScoreData = {
      snapshot: Heartbeat.SnapShot;
      noteMapping: null | NoteMapping;
      scoreContainer: null | HTMLDivElement;
      scoreContainerOffsetY: number;
    };
    combineLatest(
      keyEditor$,
      noteMapping$,
      scoreContainer$,
      scoreContainerOffsetY$,
      songPositionMillisObservable$
    )
      .pipe(
        distinctUntilChanged(),
        map(([keyEditor, noteMapping, scoreContainer, scoreContainerOffsetY]) => ({
          snapshot: keyEditor.getSnapshot(),
          noteMapping,
          scoreContainer,
          scoreContainerOffsetY,
        })),
        switchMap(({ snapshot, noteMapping, scoreContainer, scoreContainerOffsetY }) => {
          return zip(
            from(snapshot.notes.active).pipe(
              // filter all active notes and color them red
              map(note => noteMapping[note.noteOn.id]),
              filter(mapping => !!mapping),
              tap(mapping => {
                const el: SVGGElement = mapping.vfnote.attrs.el;
                setStaveNoteColor(el, "red");
              }),
              // get the y-position of the music system to calculate the scroll positions
              map(mapping => mapping.musicSystem.graphicalMeasures[0][0].stave.y)
            ),
            // color inactive notes black
            from(snapshot.notes.stateChanged).pipe(
              filter(note => note.active !== true),
              map(note => noteMapping[note.noteOn.id]),
              filter(mapping => !!mapping),
              tap(mapping => {
                const el: SVGGElement = mapping.vfnote.attrs.el;
                setStaveNoteColor(el, "black");
              }),
              mapTo([scoreContainer, scoreContainerOffsetY])
            )
          );
        }),
        // only emit when the y-position has changed
        distinctUntilChanged((a, b) => a[0] === b[0])
      )
      .subscribe((data: [number, [null | HTMLDivElement, number]]) => {
        const [yPos, [scoreContainer, scoreContainerOffsetY]] = data;
        // scrollPos = (tmp + scoreContainer.offsetTop) - distanceToFirstSystem - controlsHeight + systemOffset;
        // console.log(data);
        if (scoreContainer) {
          scoreContainer.scroll({
            top: yPos - scoreContainerOffsetY,
            behavior: "smooth",
          });
        }
      });
  };

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

  // map position of slider to position in song (only when the user uses the slider)
  combineLatest(song$, sliderPositionPercentage$, playheadSeeking$)
    .pipe(filter(([, , seeking]) => seeking === true))
    .subscribe(([song, percentage]) => {
      song.setPlayhead("percentage", percentage);
    });
};

/*
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
*/
