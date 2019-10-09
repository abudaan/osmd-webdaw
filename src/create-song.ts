import 'jzz';
import sequencer from 'heartbeat-sequencer';
import { addAssetPack, loadJSON, initSequencer, createSongFromMIDIFile } from './action-utils';

const createSong = async () => {
  await initSequencer();
  const song = await createSongFromMIDIFile('./assets/mozk545a.mid');
  const srcName = 'TP00-PianoStereo';
  let url = `./assets/${srcName}.mp3.json`;
  if (sequencer.browser === 'firefox') {
    url = `./assets/${srcName}.ogg.json`;
  }
  // const json = await loadJSON(url);
  // await addAssetPack(json);
  // song.tracks.forEach((t: Heartbeat.Track) => { t.setInstrument(srcName); });
  return song;
}

export {
  createSong,
}