import { Observable, of, animationFrameScheduler, Subject, never } from 'rxjs';
import { AppState } from './redux/store';
import { repeat, map, switchMap } from 'rxjs/operators';

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
