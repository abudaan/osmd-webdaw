import sequencer, { loadMusicXMLFile } from 'heartbeat-sequencer';
import { OpenSheetMusicDisplay, GraphicalMusicSheet, GraphicalNote } from 'opensheetmusicdisplay';
import { from, of, forkJoin, zip } from 'rxjs';
import { map, filter, tap, switchMap, mergeMap, reduce, groupBy, toArray, mergeAll, concatAll } from 'rxjs/operators';
import flatten from 'ramda/es/flatten';
import Vex from 'vexflow';
import { loadJSON, initSequencer, addAssetPack } from './action-utils';
import { getNoteData, TypeNoteData } from './osmd_utils';
import { parse, Repeats } from './musicxml';


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
    sequencer.addMidiFile({ url }, () => { resolve() });
  });
}

const colorStaveNote = (el: SVGElement, color: string) => {
  const stems = el.getElementsByClassName('vf-stem');
  const noteheads = el.getElementsByClassName('vf-notehead');
  // console.log(stem, notehead);
  for (let i = 0; i < stems.length; i++) {
    const stem = stems[i];
    if (stem.firstChild !== null) {
      (stem.firstChild as SVGElement).setAttribute('fill', color);
      (stem.firstChild as SVGElement).setAttribute('stroke', color);
    }
  }
  for (let i = 0; i < noteheads.length; i++) {
    const notehead = noteheads[i];
    if (notehead.firstChild !== null) {
      (notehead.firstChild as SVGElement).setAttribute('fill', color);
      (notehead.firstChild as SVGElement).setAttribute('stroke', color);
    }
  }
}

const update = (barDatas: TypeNoteData[], barIndex: number, barOffset: number, events: Heartbeat.MIDIEvent[]) => {
  barDatas.sort((a, b) => {
    if (a.ticks < b.ticks) {
      return -1;
    } else if (a.ticks > b.ticks) {
      return 1;
    }
    return 0;
  })
  const filtered = events.filter(e => e.bar === barIndex + 1 + barOffset);
  console.log('F', barIndex, barOffset, (barIndex + 1 + barOffset), filtered[0].bar);

  barDatas.forEach(bd => {
    const { vfnote, ticks, noteNumber, bar, parentMusicSystem } = bd;
    // console.log('check', bar, ticks, noteNumber);
    // console.log(bd, filtered);
    for (let j = 0; j < filtered.length; j++) {
      const event = filtered[j];
      // console.log('-->', event.bar, event.noteNumber);
      if (event.bar == (bar + barOffset) && event.noteNumber == noteNumber) {
        // if (event.command === 144 && event.ticks == (ticks + ticksOffset) && event.noteNumber == noteNumber) {
        // console.log(event.vfnote, event.bar);
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
  const heartbeatParsed = parse(xmlDoc, ppq);
  const [, , tmp] = heartbeatParsed;

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

  // const tmp = [
  //   {
  //     "type": "forward",
  //     "bar": 1
  //   },
  //   {
  //     "type": "backward",
  //     "bar": 28
  //   },
  //   {
  //     "type": "forward",
  //     "bar": 29
  //   },
  //   {
  //     "type": "backward",
  //     "bar": 73
  //   }
  // ]

  const repeats: number[][] = [];
  let j: number = 0;
  (tmp as Repeats).forEach((t, i) => {
    if (i % 2 === 0) {
      repeats[j] = [];
      repeats[j].push(t.bar);
    } else if (i % 2 === 1) {
      repeats[j].push(t.bar);
      j++;
    }
  });

  let songEnd = false;
  let barIndex = -1;
  let repeatIndex: number = 0;
  let ticksOffset = 0;
  let barOffset = 0;
  const hasRepeated: { [index: number]: boolean } = {};
  // console.log('repeats', repeats);
  while (true) {
    barIndex++;
    // console.log(barIndex, repeatIndex, hasRepeated[repeatIndex], repeats[repeatIndex][1]);
    if (barIndex === repeats[repeatIndex][1]) {
      if (hasRepeated[repeatIndex] !== true) {
        barIndex = repeats[repeatIndex][0] - 1;
        // console.log('REPEAT START', barIndex)
        hasRepeated[repeatIndex] = true;
        barOffset += repeats[repeatIndex][1] - repeats[repeatIndex][0] + 1;
        // ticksOffset += (repeats[repeatIndex][1] - repeats[repeatIndex][0]) * song.nominator * ppq;
      } else {
        // console.log('REPEAT END', barIndex, repeatIndex);
        repeatIndex++;
        if (repeatIndex === repeats.length || barIndex === numBars) {
          break;
        }
      }
    } else {
      // console.log('CONTINUE', barIndex)
      if (barIndex === numBars) {
        break;
      }
    }
    update(data[barIndex], barIndex, barOffset, events);
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
