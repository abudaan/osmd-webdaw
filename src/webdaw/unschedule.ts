import { Song, Track } from "./types";
import { MIDIEvent } from "./midi_events";

// TODO: improve this!

export const unschedule = (song: Song, scheduled: MIDIEvent[], outputs?: WebMidi.MIDIOutputMap) => {
  // console.log(scheduled);
  // const tracks = scheduled.reduce((acc, val): { [id: string]: Track } => {
  //   const id = val.trackId;
  //   if (acc[id]) {
  //     return acc;
  //   }
  //   const track = song.tracksById[id];
  //   acc[id] = track;
  //   return acc;
  // }, {});

  // console.log(tracks);

  Object.values(song.tracks).forEach((track: Track) => {
    const channel = 0;
    track.outputs.forEach(id => {
      let c = 0;
      let time = performance.now() + track.latency + song.latency + song.bufferTime;
      // pure overkill!
      while (c < 16) {
        outputs?.get(id).send([0xb0 + c, 0x7b, 0x00], time); // stop all notes
        outputs?.get(id).send([0xb0 + c, 0x79, 0x00], time); // reset all controllers
        c++;
      }
    });
  });
};
