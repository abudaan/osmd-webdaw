import { from, of, forkJoin } from 'rxjs';
import { map, tap, switchMap, mergeMap, reduce, groupBy, toArray } from 'rxjs/operators';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import parser from 'fast-xml-parser';

import Vex from 'vexflow';
import { createSong } from './create-song';
import { convertToVexFlow } from './note-converter';
const {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
} = Vex.Flow;

type TypeArgs = {
  width: number
  height: number
  renderer: Vex.Flow.Renderer
  formatter: Vex.Flow.Formatter
  context: Vex.Flow.SVGContext
  notes: Vex.Flow.StaveNote[]
  divHitArea: HTMLDivElement
}

const init3 = (div: HTMLDivElement) => {
  const openSheetMusicDisplay = new OpenSheetMusicDisplay(div, {
    // autoResize: true,
    backend: 'svg',
    disableCursor: false,
    drawingParameters: "default", // try compact (instead of default)
    drawPartNames: true, // try false
    drawTitle: false,
    drawSubtitle: false,
    //drawFromMeasureNumber: 4,
    //drawUpToMeasureNumber: 8,
    drawFingerings: true,
    fingeringPosition: "auto", // left is default. try right. experimental: auto, above, below.
    // fingeringInsideStafflines: "true", // default: false. true draws fingerings directly above/below notes
    setWantedStemDirectionByXml: true, // try false, which was previously the default behavior
    // drawUpToMeasureNumber: 3, // draws only up to measure 3, meaning it draws measure 1 to 3 of the piece.

    // coloring options
    coloringEnabled: true,
    // defaultColorNotehead: "#CC0055", // try setting a default color. default is black (undefined)
    // defaultColorStem: "#BB0099",

    autoBeam: false, // try true, OSMD Function Test AutoBeam sample
    autoBeamOptions: {
      beam_rests: false,
      beam_middle_rests_only: false,
      //groups: [[3,4], [1,1]],
      maintain_stem_directions: false
    },

    // tupletsBracketed: true, // creates brackets for all tuplets except triplets, even when not set by xml
    // tripletsBracketed: true,
    // tupletsRatioed: true, // unconventional; renders ratios for tuplets (3:2 instead of 3 for triplets)
  });

  openSheetMusicDisplay.load('./assets/minute_waltz-snippet.musicxml').then(
    function () {
      // This gives you access to the osmd object in the console. Do not use in productive code
      // window.osmd = openSheetMusicDisplay;
      return openSheetMusicDisplay.render();
    },
    function (e) {
      console.error(e, "rendering");
    });
}

const padding = 10;
const renderScore = ({ width, height, renderer, formatter, context, notes, divHitArea }: TypeArgs) => {
  renderer.resize(width, height);
  context.clear();
  const stave = new Stave(0, 40, width - (padding * 2));
  stave.addClef('treble').addTimeSignature('4/4');
  stave.setContext(context).draw();
  // Create a voice in 4 / 4 and add above notes
  const voice = new Voice({ num_beats: 8, beat_value: 4 });
  voice.addTickables(notes);
  // Format and justify the notes to 400 pixels.
  formatter.joinVoices([voice]).format([voice], width - (padding * 2));
  voice.draw(context, stave);

  const notesById: { [id: string]: any } = notes.reduce((acc, val) => {
    const id: string = val.attrs.id;
    acc[id] = val;
    return acc;
  }, {});

  // Array.from(divHitArea.children).forEach(c => {
  //   // console.log(c);
  //   divHitArea.removeChild(c);
  // })

  const offset = context.svg.getBoundingClientRect();

  // notes.forEach(note => {
  //   const bbox = note.attrs.el.getElementsByClassName('vf-notehead')[0].getBBox();
  //   const id = note.attrs.id;
  //   let hit = document.getElementById(id);
  //   if (hit === null) {
  //     hit = document.createElement('div');
  //     divHitArea.appendChild(hit);
  //     hit.id = note.attrs.id;
  //     hit.className = 'hitarea';
  //     hit.addEventListener('mousedown', (e: MouseEvent) => {
  //       const target = e.target as HTMLDivElement;
  //       const note = notesById[target.id] as Vex.Flow.Note;
  //       const midiEvent = note.getPlayNote().note.noteOn;
  //       const noteOn = sequencer.createMidiEvent(0, 144, midiEvent.data1, midiEvent.data2)
  //       sequencer.processEvent(noteOn);
  //     })
  //     hit.addEventListener('mouseup', (e: MouseEvent) => {
  //       // const target = e.target as HTMLDivElement;
  //       // const note = notesById[target.id] as Vex.Flow.Note;
  //       // const midiEvent = note.getPlayNote().note.noteOff;
  //       // const noteOff = sequencer.createMidiEvent(10, 128, midiEvent.data1, 0)
  //       // // console.log('up', noteOff);
  //       // sequencer.processEvent(noteOff);
  //       sequencer.stopProcessEvents();
  //     })
  //   }
  //   hit.style.width = `${bbox.width}px`;
  //   hit.style.height = `${bbox.height}px`;
  //   hit.style.left = `${bbox.x + offset.left}px`;
  //   hit.style.top = `${bbox.y + offset.top}px`;
  // });

}

const init2 = (notes: Vex.Flow.StaveNote[]) => {
  const div = document.getElementById('app');
  const divHitArea = document.getElementById('hitareas') as HTMLDivElement;

  if (div !== null && divHitArea !== null) {
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    const context = renderer.getContext() as Vex.Flow.SVGContext;
    const formatter = new Formatter()
    window.addEventListener('resize', () => {
      renderScore({
        width: window.innerWidth,
        height: window.innerHeight,
        renderer,
        formatter,
        context,
        notes,
        divHitArea,
      });
    });


  }
}


const init = async () => {
  const song = await createSong();
  const div = document.getElementById('app');
  const divHitArea = document.getElementById('hitareas') as HTMLDivElement;

  if (div !== null && divHitArea !== null) {
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(1000, 1000);
    const context = renderer.getContext() as Vex.Flow.SVGContext;
    const formatter = new Formatter()
    const bars = await convertToVexFlow(song).toPromise();

    const width = 200;
    let y = 40;
    bars.forEach((notes: [Heartbeat.MIDINote, []][], index: number) => {
      // console.log('NOTES', index, notes);
      if (index < 2) {
        const alternate = index % 4;
        let x = 0;
        let stave;
        if (alternate === 0) {
          if (index !== 0) {
            y += 80;
          }
          stave = new Stave(x, y, width + 50);
          stave.addClef('treble').addTimeSignature('4/4');
          stave.setContext(context).draw();
        } else {
          x = 50 + (alternate * width);
          stave = new Stave(x, y, width);
          stave.setContext(context).draw();
        }
        // console.log(index, alternate, y);
        const voice = new Voice({ num_beats: 4, beat_value: 4 });
        // const staveNoteData = notes.map(([midiNote, data]) => data);
        const staveNotes = [];
        notes.forEach((data, i) => {
          // console.log(data);
          const keys: string[] = [];
          data.forEach((d, j) => {
            // console.log(i, j, d);
            keys.push(d[1][2]);
          })
          const duration = data[0][1][0];
          const addDot = data[0][1][1];
          console.log(keys, duration, addDot);
          // const sn = new StaveNote({ clef: 'treble', keys, duration });
          // console.log(duration);
          const sn = new StaveNote({ clef: 'treble', keys, duration });
          if (addDot) {
            sn.addDot(0);
          }
          // if (i < 8) {
          staveNotes.push(sn);
          // }
        });
        console.log(staveNotes);
        voice.addTickables(staveNotes);
        formatter.joinVoices([voice]).format([voice], width);
        voice.draw(context, stave);
      }
    });
  }
  // song.play();
  // const notes = await init1();
  // init2(notes);
  // const instrument = sequencer.getInstrument('TP03-Vibraphone');
  // document.addEventListener('mouseup', () => {
  //   instrument.allNotesOff();
  // })
}

// init();
// const div = document.getElementById('app');
// if (div) {
//   init3(div);
// }


const parse = (xml: string) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'application/xml');
  if (xmlDoc === null) {
    return;
  }
  const nsResolver = xmlDoc.createNSResolver(xmlDoc.ownerDocument === null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
  let type;
  if(xmlDoc.firstChild !== null && xmlDoc.firstChild.nextSibling !== null) {
    type = xmlDoc.firstChild.nextSibling.nodeName;
  }
  console.log('type', type, nsResolver);
  
  if (type === 'score-partwise') {
    return parsePartWise(xmlDoc);
  } else if (type === 'score-timewise') {
    return parseTimeWise(xmlDoc);
  } else {
    console.log('unknown type', type);
    return false;
  }
}

const parsePartWise = (doc: XMLDocument) => {
  
}

const parseTimeWise = (doc: XMLDocument) => {
  
}

const init4 = async () => {
  const options = {
    ignoreAttributes: false,
  }
  const response = await fetch('./assets/test2.xml')
    .then(response => response.text())
    // .then(str => (new window.DOMParser()).parseFromString(str, 'text/xml'))
    // .then(str => parser.getTraversalObj(str, options))
    // .then(data => parser.convertToJson(data, options))
    .then(str => { 
      parse(str);
    })
}

// init4();
init3(document.getElementById('app'));