import React, { SyntheticEvent, useEffect, useRef, RefObject } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { fromEvent } from "rxjs";
import { map } from "rxjs/operators";
import { Dispatch } from "redux";
import { updatePositionSlider, updateSongAction, updatePlayheadSeeking } from "../redux/actions1";
import { SongActions } from "../redux/song-reducer";
import { AppState } from "../redux/store";

type Props = {};
export const Transport: React.FC<Props> = ({}: Props) => {
  const refInput: RefObject<HTMLInputElement> = useRef(null);
  const songAndScoreReady = useSelector((state: AppState) => state.song.songAndScoreReady);
  const sliderPositionPercentage = useSelector(
    (state: AppState) => state.song.sliderPositionPercentage
  );
  const songIsPlaying = useSelector((state: AppState) => state.song.songIsPlaying, shallowEqual);
  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    if (refInput && refInput.current) {
      // const obs1$ = fromEvent(refInput.current, 'input');
      // obs1$
      //   .pipe(map(event => (event.target as HTMLInputElement).valueAsNumber))
      //   .subscribe(val => { dispatch(updatePositionSlider(val)); });

      const obs2$ = fromEvent(refInput.current, "mousedown");
      const obs3$ = fromEvent(refInput.current, "mouseup");
      obs2$.subscribe(_ => {
        dispatch(updatePlayheadSeeking(true));
      });
      obs3$.subscribe(_ => {
        dispatch(updatePlayheadSeeking(false));
      });
    }
  }, [refInput.current]);

  // console.log('[Transport] render');

  const label = songIsPlaying ? "pause" : "play";
  const action = songIsPlaying ? SongActions.PAUSE : SongActions.PLAY;

  return (
    <div id="transport">
      <input
        type="button"
        value={label}
        disabled={!songAndScoreReady}
        onClick={() => {
          dispatch(updateSongAction(action));
        }}
      />
      <input
        type="button"
        value="stop"
        disabled={!songAndScoreReady}
        onClick={() => {
          dispatch(updateSongAction(SongActions.STOP));
        }}
      />
      <input
        ref={refInput}
        type="range"
        value={sliderPositionPercentage}
        onChange={event => {
          dispatch(updatePositionSlider((event.target as HTMLInputElement).valueAsNumber));
        }}
        min="0"
        max="1"
        step="0.0001"
      />
    </div>
  );
};
