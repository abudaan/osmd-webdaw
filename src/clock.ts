import { store, getState$ } from "./redux/store";
import { distinctUntilKeyChanged, map, pluck, pairwise } from "rxjs/operators";
import { setProgress } from "./redux/actions/setProgress";
import { Transport } from "./types";

export const setupClock = () => {
  let id: number;
  let start = 0;
  let progress = 0;

  const state$ = getState$();
  state$
    .pipe(
      distinctUntilKeyChanged("transport"),
      map(app => ({
        // stream: app.stream,
        transport: app.transport,
        position: app.playheadMillis,
        durationTimeline: app.durationTimeline,
      }))
    )
    .subscribe(({ transport, position, durationTimeline }) => {
      let end = position >= durationTimeline;
      // if (end && stream !== null && transport === Transport.PLAY) {
      //   // recording in progress!
      //   store.dispatch(extendTimeline());
      //   end = false;
      // }
      const isPlaying = transport === Transport.PLAY && !end;
      if (isPlaying) {
        start = performance.now();
        play(start);
      } else {
        cancelAnimationFrame(id);
        // store.dispatch(setProgress(0));
        // store.dispatch(setProgress(0));
      }
    });

  const play = (a: number) => {
    progress = a - start;
    store.dispatch(setProgress(progress));
    start = a;
    id = requestAnimationFrame(b => {
      play(performance.now());
    });
    // console.log(progress);
  };
};
