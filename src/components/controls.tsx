import React, { SyntheticEvent, useEffect, useRef, RefObject } from 'react';
import { useDispatch } from 'react-redux';
import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dispatch } from 'redux';
import { updatePositionSlider } from '../redux/actions';

type Props = {};
export const Controls: React.FC<Props> = ({ }: Props) => {
  const refInput: RefObject<HTMLInputElement> = useRef(null);
  const dispatch: Dispatch = useDispatch();
  // useEffect(() => {
  //   if (refInput && refInput.current) {
  //     const obs$ = fromEvent(refInput.current, 'input');
  //     obs$
  //       .pipe(map(event => (event.target as HTMLInputElement).valueAsNumber))
  //       .subscribe(val => { dispatch(updatePositionSlider(val)); });
  //   }
  // }, [refInput.current]);

  return <div id="controls">
    <select><option>select MusicXML file</option></select>
    <select><option>select MIDI file</option></select>
    <input type="button" value="connect" />
  </div>
}