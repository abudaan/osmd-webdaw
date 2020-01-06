import React, { SyntheticEvent, useEffect, useRef, RefObject } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dispatch } from 'redux';
import { updatePositionSlider, updateSongAction } from '../redux/actions';
import { SongActions } from '../redux/song-reducer';
import { AppState } from '../redux/store';

type Props = {};
export const Transport: React.FC<Props> = ({ }: Props) => {
  const refInput: RefObject<HTMLInputElement> = useRef(null);
  const songAndScoreReady = useSelector((state: AppState) => state.song.songAndScoreReady)
  const songIsPlaying = useSelector((state: AppState) => state.song.songIsPlaying, shallowEqual);
  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    if (refInput && refInput.current) {
      const obs$ = fromEvent(refInput.current, 'input');
      obs$
        .pipe(map(event => (event.target as HTMLInputElement).valueAsNumber))
        .subscribe(val => { dispatch(updatePositionSlider(val)); });
    }
  }, [refInput.current]);

  console.log('[Transport] render');

  const label = songIsPlaying ? 'pause' : 'play';
  const action = songIsPlaying ? SongActions.PAUSE : SongActions.PLAY;

  return <div id="transport">
    <input type="button" value={label} disabled={!songAndScoreReady} onClick={() => { dispatch(updateSongAction(action)); }} />
    <input type="button" value="stop" disabled={!songAndScoreReady} onClick={() => { dispatch(updateSongAction(SongActions.STOP)); }} />
    <input ref={refInput} type="range" defaultValue="0" min="0" max="1" step="0.001" />
  </div>
}