import 'jzz';
import sequencer from 'heartbeat-sequencer';
import { addAssetPack, loadJSON, createSongFromMIDIFile } from './util/heartbeat-utils';
import { setStaveNoteColor } from './util/osmd-stavenote-color';
import { TypeNoteMapping } from './util/osmd-heartbeat';

const createSong = async () => {
  await sequencer.ready();
  const song = await createSongFromMIDIFile('./assets/mozk545a.mid');
  const srcName = 'TP00-PianoStereo';
  const url = `./assets/${srcName}.mp3.json`;
  const json = await loadJSON(url);
  await addAssetPack(json);
  song.tracks.forEach((t: Heartbeat.Track) => { t.setInstrument(srcName); });
  return song;
}

const setupSongListeners = (song: Heartbeat.Song, noteMapping: TypeNoteMapping) => {
  let scrollPos = 0;
  let currentY = 0;
  let reference = -1;

  song.addEventListener('event', 'type = NOTE_ON', (event: Heartbeat.MIDIEvent) => {
    const mapping = noteMapping[event.id];
    console.log(mapping, event)
    if (mapping) {
      const el = mapping.vfnote.attrs.el;
      setStaveNoteColor(el, 'red');

      const tmp = mapping.musicSystem.graphicalMeasures[0][0].stave.y;
      if (currentY !== tmp) {
        currentY = tmp;
        const bbox = el.getBoundingClientRect();
        // console.log(bbox.y, window.pageYOffset);
        if (reference === -1) {
          reference = bbox.y;
        } else {
          scrollPos = (bbox.y + window.pageYOffset) - reference;
          window.scroll({
            top: scrollPos,
            behavior: 'smooth'
          });
        }
      }
    }
  });

  song.addEventListener('event', 'type = NOTE_OFF', (event) => {
    const noteOn = event.midiNote.noteOn;
    const mapping = noteMapping[event.id];
    if (mapping) {
      const el = mapping.vfnote.attrs.el;
      setStaveNoteColor(el, 'black');
    }
  });

}

export {
  createSong,
  setupSongListeners,
}