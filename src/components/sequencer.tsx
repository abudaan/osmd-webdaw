import React, { useEffect, useRef, RefObject } from "react";
import sequencer from "heartbeat-sequencer";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { AppState } from "../redux/store";
import { songReady } from "../redux/actions1";
import { SongActions } from "../redux/song-reducer";

/*

  !! NOT IN USE, KEEP FOR REFERENCE !!

*/

export const Sequencer: React.FC<{}> = ({}) => {
  const dispatch = useDispatch();
  const song = useSelector(
    (state: AppState) => {
      return state.song.song;
    },
    (stateNew: null | Heartbeat.Song, stateOld: null | Heartbeat.Song) => {
      if (stateNew !== null) {
        if (stateOld !== null && stateNew.id === stateOld.id) {
          // console.log('no re-render', stateNew.id, stateOld.id);
          return true;
        } else if (stateOld === null) {
          return true;
        }
      } else if (stateNew === null) {
        // console.log('no re-render', stateNew);
        return true;
      }
      // console.log('re-render');
      return false;
    }
  );
  const instrumentName = useSelector((state: AppState) => {
    return state.song.instrumentName;
  }, shallowEqual);
  const songAction = useSelector((state: AppState) => {
    return state.song.songAction;
  }, shallowEqual);
  const midiFile = useSelector(
    (state: AppState) => {
      const index = state.song.currentMIDIFileIndex;
      if (index !== -1) {
        return state.song.midiFiles[state.song.currentMIDIFileIndex];
      }
      return null;
    },
    (stateNew: Heartbeat.MIDIFileJSON | null, stateOld: Heartbeat.MIDIFileJSON | null) => {
      // console.log(stateNew, stateOld);
      if (stateNew !== null) {
        if (stateOld !== null && stateNew.name === stateOld.name) {
          // console.log('no re-render', stateNew.name, stateOld.name);
          return true;
        } else if (stateOld === null) {
          return true;
        }
      } else if (stateNew === null) {
        // console.log('no re-render', stateNew);
        return true;
      }
      // console.log('re-render');
      return false;
    }
  );

  if (midiFile !== null) {
    const song = sequencer.createSong(midiFile.name);
    song.tracks.forEach((t: Heartbeat.Track) => {
      t.setInstrument(instrumentName);
    });
    dispatch(songReady(song));
    console.log("[Sequencer] create song", song.id);
  }

  if (song !== null) {
    if (songAction === SongActions.PLAY) {
      song.play();
    } else if (songAction === SongActions.STOP) {
      song.stop();
    }
  }

  console.log("[Sequencer] render", midiFile === null, instrumentName === "", song === null);
  return null;
};
