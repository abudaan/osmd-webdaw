import React, { SyntheticEvent, useEffect, useRef, RefObject } from 'react';
import { useDispatch } from 'react-redux';
import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dispatch } from 'redux';
import { updatePositionSlider } from '../redux/actions';

type Props = {};
export const Transport: React.FC<Props> = ({ }: Props) => {
  const refInput: RefObject<HTMLInputElement> = useRef(null);
  const dispatch: Dispatch = useDispatch();
  useEffect(() => {
    if (refInput && refInput.current) {
      const obs$ = fromEvent(refInput.current, 'input');
      obs$
        .pipe(map(event => (event.target as HTMLInputElement).valueAsNumber))
        .subscribe(val => { dispatch(updatePositionSlider(val)); });
    }
  }, [refInput.current]);

  return <div id="transport">
    <input type="button" value="play" />
    <input type="button" value="stop" />
    <input ref={refInput} type="range" defaultValue="0" min="0" max="1" step="0.1" />
  </div>
}