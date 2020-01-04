import React, { useEffect, useRef, RefObject } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppState } from '../redux/store';

export const Sequencer: React.FC<{}> = ({ }) => {
  const midiFile = useSelector((state: AppState) => {
    const index = state.song.currentMIDIFileIndex;
    if (index !== -1) {
      return state.song.midiFiles[state.song.currentMIDIFileIndex]
    }
    return null;
  }, (stateNew: Heartbeat.MIDIFileJSON | null, stateOld: Heartbeat.MIDIFileJSON | null) => {
    console.log(stateNew, stateOld);
    if (stateNew === null && stateOld === null) {
      console.log('no re-render');
      return true;
    }
    console.log('re-render');
    return false;
  });

  console.log('Now I am here', midiFile);
  return null;
};