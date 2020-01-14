import React, { SyntheticEvent, useEffect, useRef, RefObject } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { Dispatch } from 'redux';
import { updatePositionSlider } from '../redux/actions';
import uniqid from 'uniqid';
import { AppState } from 'src/redux/store';

type Props = {};
export const Controls: React.FC<Props> = ({ }: Props) => {
  const dispatch: Dispatch = useDispatch();
  const xmlDocNames = useSelector((state: AppState) => { return state.data.xmlDocNames; }, shallowEqual)
  const midiFileNames = useSelector((state: AppState) => { return state.data.midiFileNames; }, shallowEqual)

  xmlDocNames.unshift('select MusicXML file');
  midiFileNames.unshift('select MIDI file');
  xmlDocNames.push('upload new');
  midiFileNames.push('upload new');

  return <div id="controls">
    <select>{xmlDocNames.map(val => (<option key={uniqid()}>{val}</option>))}</select>
    <select>{midiFileNames.map(val => (<option key={uniqid()}>{val}</option>))}</select>
    <input type="button" value="connect" />
  </div>
}