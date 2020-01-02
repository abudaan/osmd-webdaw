import React, { SyntheticEvent, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../redux/store';
import { createSongFromMIDIFile } from 'src/util/heartbeat-utils';

export const Song: React.FC<{}> = () => {
  const midiFile = useSelector((state: AppState) => state.song.midiFile);
  useEffect(() => {
    // if (midiFile) {
    //   const song = await createSongFromMIDIFile('./assets/mozk545a_musescore.mid');
    // }
  }, [midiFile])

  return null;
}