import React, { useRef, RefObject } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Score } from './score';
import { Controls } from './controls';
import { Song } from './song';
import * as Action from '../redux/actions';
import { AppState } from '../redux/store';

type Props = {};
export const App: React.FC<Props> = () => {
  // const refScoreDiv: RefObject<HTMLDivElement> = useRef(null);
  // const dispatch = useDispatch();
  // const xmlDoc = useSelector((state: AppState) => state.song.xmlDoc);
  // const xmlDocUrl = useSelector((state: AppState) => state.song.xmlDocUrl);
  // const midiFileUrl = useSelector((state: AppState) => state.song.midiFileUrl);

  // if (!xmlDoc) {
  //   dispatch(Action.init(xmlDocUrl, midiFileUrl));
  //   return <div>loading....</div>
  // }

  console.log('render');
  return <>
    <Controls />
    {/* <div id="score" /> */}
    <Song />
    <Score />
  </>
}