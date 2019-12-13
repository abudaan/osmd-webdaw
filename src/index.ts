import sequencer, { loadMusicXMLFile } from 'heartbeat-sequencer';
import { OpenSheetMusicDisplay, GraphicalMusicSheet, GraphicalNote } from 'opensheetmusicdisplay';
import { from, of, forkJoin, zip } from 'rxjs';
import { map, filter, tap, switchMap, mergeMap, reduce, groupBy, toArray, mergeAll, concatAll } from 'rxjs/operators';
import flatten from 'ramda/es/flatten';
import Vex from 'vexflow';
import { loadJSON, initSequencer, addAssetPack } from './action-utils';
import { getNoteData } from './osmd_utils';
import { parse } from './musicxml';


// const url = './assets/mozk545a.musicxml';
const url = './assets/mozk545a_musescore.musicxml';
// const url = './assets/test2.xml';
// const url = './assets/minute_waltz-snippet.musicxml';
const options = {
  ignoreAttributes: false,
}
const c = document.getElementById('score');
const divLoading = document.getElementById('loading') as HTMLDivElement;
// document.body.appendChild(c);
const osmd = new OpenSheetMusicDisplay(c, {
  backend: 'svg',
  autoResize: true,
});
// window.openSheetMusicDisplay = openSheetMusicDisplay;


const loadMIDIFile = (url: string): Promise<void> => {
  return new Promise(resolve => {
    sequencer.addMidiFile({ url }, resolve);
  });
}

const colorStaveNote = (el, color: string) => {
  const stems = el.getElementsByClassName('vf-stem');
  const noteheads = el.getElementsByClassName('vf-notehead');
  // console.log(stem, notehead);
  for (let i = 0; i < stems.length; i++) {
    const stem = stems[i];
    stem.firstChild.setAttribute('fill', color);
    stem.firstChild.setAttribute('stroke', color);
  }
  for (let i = 0; i < noteheads.length; i++) {
    const notehead = noteheads[i];
    notehead.firstChild.setAttribute('fill', color);
    notehead.firstChild.setAttribute('stroke', color);
  }
}

const update = (barDatas, barIndex, ticksOffset, events, numNotes) => {
  barDatas.sort((a, b) => {
    if (a.ticks < b.ticks) {
      return -1;
    } else if (a.ticks > b.ticks) {
      return 1;
    }
    return 0;
  })
  const filtered = events.filter(e => e.bar === barIndex + 1);

  barDatas.forEach(bd => {
    const { vfnote, ticks, noteNumber, bar, parentMusicSystem } = bd;
    console.log('check', bar, ticks, noteNumber);
    // console.log(bd, filtered);
    for (let j = 0; j < filtered.length; j++) {
      const event = filtered[j];
      console.log('-->', event.bar, event.noteNumber);
      if (event.bar == bar && event.noteNumber == noteNumber) {
        // if (event.command === 144 && event.ticks == (ticks + ticksOffset) && event.noteNumber == noteNumber) {
        event.vfnote = vfnote;
        event.musicSystem = parentMusicSystem;
        filtered.splice(j, 1);
        break;
      }
    }
  })
}

const ppq = 960;
const midiFile = 'mozk545a_musescore';
const init = async () => {
  await sequencer.ready();
  await loadMIDIFile(`./assets/${midiFile}.mid`);
  const song = sequencer.createSong(sequencer.getMidiFile(midiFile));

  const srcName = 'TP00-PianoStereo';
  let url = `assets/${srcName}.mp3.json`;
  if (sequencer.browser === 'firefox') {
    url = `assets/${srcName}.ogg.json`;
  }
  const json = await loadJSON(url);
  await addAssetPack(json);
  song.tracks.forEach(track => { track.setInstrument(srcName); })

  // song.update();
  const xmlDoc = await loadMusicXMLFile('./assets/mozk545a_musescore.musicxml');
  console.log(parse(xmlDoc, ppq));
  divLoading.innerHTML = 'loading musicxml';
  await osmd.load(xmlDoc);
  osmd.render();

  // const notes = c.getElementsByClassName('vf-stavenote');
  // console.log(notes);
  console.log(osmd);
  divLoading.innerHTML = 'parsing musicxml';
  const data = await getNoteData(osmd, ppq);

  console.log(data);
  // console.log(song);
  // console.log(data[0][0] instanceof Vex.Flow.StaveNote);
  divLoading.innerHTML = 'connecting heartbeat';
  console.time('connect_heartbeat');
  const events = song.events.filter(event => event.command === 144);
  // console.log(events);
  const numNotes = events.length;
  // const flattened = data.flat();
  // console.log(flattened);
  // const numData = flattened.length;
  const numBars = data.length;
  let repeat1 = [-1, 27];
  let repeat2 = [27, 72];
  let repeated1 = false;
  let repeated2 = false;
  let songEnd = false;
  let barIndex = -1;
  let ticksOffset = 0;
  while (songEnd === false) {
    barIndex++;
    // console.log(barIndex);
    if (barIndex === repeat1[1]) {
      songEnd = true;
      update(data[barIndex], barIndex, ticksOffset, events, numNotes)
      if (repeated1 === false) {
        barIndex = repeat1[0];
        repeated1 = true;
        ticksOffset += (repeat1[1] - repeat1[0]) * 4 * ppq;
      }
    } else if (barIndex === repeat2[1]) {
      update(data[barIndex], barIndex, ticksOffset, events, numNotes)
      if (repeated2 === false) {
        barIndex = repeat2[0];
        repeated2 = true;
        ticksOffset += (repeat2[1] - repeat2[0]) * 4 * ppq;
      } else {
        songEnd = true;
      }
    } else {
      update(data[barIndex], barIndex, ticksOffset, events, numNotes);
    }
  };


  console.timeEnd('connect_heartbeat');
  // console.log(song.events);
  divLoading.style.display = 'none';
  const btnPlay = document.getElementById('play') as HTMLButtonElement;
  const btnStop = document.getElementById('stop') as HTMLButtonElement;
  btnPlay.disabled = true;
  btnStop.disabled = true;


  let scrollPos = 0;
  let currentY = 0;
  let reference = -1;
  const height = window.innerHeight;
  song.addEventListener('event', 'type = NOTE_ON', (event) => {
    if (event.vfnote) {
      const el = event.vfnote.attrs.el;
      colorStaveNote(el, 'red');

      const tmp = event.musicSystem.graphicalMeasures[0][0].stave.y;
      if (currentY !== tmp) {
        currentY = tmp;
        const bbox = el.getBoundingClientRect();
        console.log(bbox.y, window.pageYOffset);
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
    if (noteOn.vfnote) {
      const el = noteOn.vfnote.attrs.el;
      colorStaveNote(el, 'black');
    }
  });

  song.addEventListener('stop', () => {
    btnPlay.innerHTML = 'play';
  });
  song.addEventListener('play', () => {
    btnPlay.innerHTML = 'pause';
  });
  song.addEventListener('end', () => {
    btnPlay.innerHTML = 'play';
  });

  btnPlay.disabled = false;
  btnStop.disabled = false;

  btnPlay.addEventListener('click', () => {
    if (song.playing) {
      // btnPlay.innerHTML = 'play';
      song.pause();
    } else {
      // btnPlay.innerHTML = 'pause';
      song.play();
    }
  });
  btnStop.addEventListener('click', () => { song.stop() });

}

init();
