import sequencer from 'heartbeat-sequencer';
import { OpenSheetMusicDisplay, GraphicalMusicSheet, GraphicalNote } from 'opensheetmusicdisplay';
import { from, of, forkJoin, zip } from 'rxjs';
import { map, filter, tap, switchMap, mergeMap, reduce, groupBy, toArray, mergeAll, concatAll } from 'rxjs/operators';
import flatten from 'ramda/es/flatten';
import Vex from 'vexflow';

type TypeNoteData = {
  noteNumber: number,
  step: string,
  octave: number,
  duration: number,
  ticks: number,
  part: string,
  voice: number,
  staff: number,
}

type TypeMusicXML = {
  [partId: string]: {
    [id: string]: TypeNoteData[]
  }
} | null;


const parse = (xmlDoc: XMLDocument, ppq: number): TypeMusicXML => {
  if (xmlDoc === null) {
    return null;
  }
  let type;
  if (xmlDoc.firstChild !== null && xmlDoc.firstChild.nextSibling !== null) {
    type = xmlDoc.firstChild.nextSibling.nodeName;
  }
  // console.log('type', type, nsResolver);

  if (type === 'score-partwise') {
    return parsePartWise(xmlDoc, ppq);
  }
  if (type === 'score-timewise') {
    return parseTimeWise(xmlDoc);
  }
  // console.log('unknown type', type);
  return null;
}

const parsePartWise = (xmlDoc: XMLDocument, ppq: number): TypeMusicXML => {
  const nsResolver = xmlDoc.createNSResolver(xmlDoc.ownerDocument === null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
  const partIterator = xmlDoc.evaluate('//score-part', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null);
  const data: TypeMusicXML = {};
  const tiedNotes: { [id: string]: TypeNoteData } = {};

  let partNode;
  while (partNode = partIterator.iterateNext()) {
    // get id and name of the part
    const partId = xmlDoc.evaluate('@id', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
    const name = xmlDoc.evaluate('part-name', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
    // console.log('part', partId);
    data[partId] = {};
    let ticks = 0;
    const measureIterator = xmlDoc.evaluate('//part[@id="' + partId + '"]/measure', partNode, nsResolver, XPathResult.ANY_TYPE, null);
    let measureNode;
    let divisions = 1;
    let numerator = 4;
    let denominator = 4;
    let tmp;
    while (measureNode = measureIterator.iterateNext()) {
      const measureNumber = xmlDoc.evaluate('@number', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (typeof data[partId][measureNumber] === 'undefined') {
        data[partId][measureNumber] = [];
      }
      tmp = xmlDoc.evaluate('attributes/divisions', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp)) {
        divisions = tmp;
        console.log('divisions', divisions);
      }
      tmp = xmlDoc.evaluate('attributes/time/beats', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp)) {
        numerator = tmp;
      }
      tmp = xmlDoc.evaluate('attributes/time/beat-type', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp)) {
        denominator = tmp;
      }

      // get all notes and backups
      const noteIterator = xmlDoc.evaluate('*[self::note or self::backup or self::forward]', measureNode, nsResolver, XPathResult.ANY_TYPE, null);
      let noteNode;
      while (noteNode = noteIterator.iterateNext()) {
        // console.log(noteNode);
        let noteDuration = 0;
        let voice = -1;
        let staff = -1;

        let tieStart = false;
        let tieStop = false;
        const tieIterator = xmlDoc.evaluate('tie', noteNode, nsResolver, XPathResult.ANY_TYPE, null);
        let tieNode;
        while (tieNode = tieIterator.iterateNext()) {
          const tieType = xmlDoc.evaluate('@type', tieNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
          if (tieType === 'start') {
            tieStart = true;
          } else if (tieType === 'stop') {
            tieStop = true;
          }
        }

        const rest = xmlDoc.evaluate('rest', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const chord = xmlDoc.evaluate('chord', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const grace = xmlDoc.evaluate('grace', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        // console.log('grace', grace)

        if (rest !== null) {
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          ticks += (noteDuration / divisions) * ppq;
          // console.log('rest', ticks);
        } else if (noteNode.nodeName === 'note' && grace === null) {
          const step = xmlDoc.evaluate('pitch/step', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
          const alter = xmlDoc.evaluate('pitch/alter', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          const octave = xmlDoc.evaluate('pitch/octave', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          tmp = xmlDoc.evaluate('voice', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          if (!isNaN(tmp)) {
            voice = tmp;
          }
          tmp = xmlDoc.evaluate('staff', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          if (!isNaN(tmp)) {
            staff = tmp;
          }
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          // const noteType = xmlDoc.evaluate('type', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
          let noteName = step;

          if (!isNaN(alter)) {
            switch (alter) {
              case -2:
                noteName += 'bb';
                break;
              case -1:
                noteName += 'b';
                break;
              case 1:
                noteName += '#';
                break;
              case 2:
                noteName += '##';
                break;
            }
          }


          const noteNumber = sequencer.getNoteNumber(noteName, octave);
          const note = {
            step,
            octave,
            noteNumber,
            ticks,
            duration: (noteDuration / divisions) * ppq,
            part: partId,
            voice,
            staff,
          };
          console.log('note', ticks, noteDuration, divisions, ppq, step, octave, noteNumber);
          ticks += (noteDuration / divisions) * ppq;
          if (chord !== null) {
            ticks -= (noteDuration / divisions) * ppq;
          }
          // console.log('note', noteNumber, ticks);

          data[partId][measureNumber].push(note);
          //console.log('tie', tieStart, tieStop);

          if (tieStart === false && tieStop === false) {
            // no ties
            //console.log('no ties', measureNumber, voice, noteNumber, tiedNotes);
          } else if (tieStart === true && tieStop === false) {
            // start of tie
            tiedNotes[`N_${staff}-${voice}-${noteNumber}`] = note;
            //console.log('start', measureNumber, voice, noteNumber, tiedNotes);
          } else if (tieStart === true && tieStop === true) {
            // tied to yet another note
            tiedNotes[`N_${staff}-${voice}-${noteNumber}`].duration += (noteDuration / divisions) * ppq;
            //console.log('thru', measureNumber, voice, noteNumber, tiedNotes);
          } else if (tieStart === false && tieStop === true) {
            // end of tie
            tiedNotes[`N_${staff}-${voice}-${noteNumber}`].duration += (noteDuration / divisions) * ppq;
            // delete tiedNotes[`N_${staff}-${voice}-${noteNumber}`];
            //console.log('end', measureNumber, voice, noteNumber, tiedNotes);
          }

        } else if (noteNode.nodeName === 'backup') {
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          ticks -= (noteDuration / divisions) * ppq;
          // console.log('backup', ticks);
          //console.log(noteDuration, divisions);
        } else if (noteNode.nodeName === 'forward') {
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          ticks += (noteDuration / divisions) * ppq;
          // console.log('forward', ticks);
          //console.log(noteDuration, divisions);
        }
      }
    }
  }
  // console.log(data);
  return data;
}

const parseTimeWise = (doc: XMLDocument): TypeMusicXML => {
  return null;
}

// const url = './assets/mozk545a.musicxml';
const url = './assets/mozk545a_musescore.musicxml';
// const url = './assets/test2.xml';
// const url = './assets/minute_waltz-snippet.musicxml';
const options = {
  ignoreAttributes: false,
}
const c = document.createElement('div');
document.body.appendChild(c);
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

const loadMusicXMLFile = (url: string): Promise<[OpenSheetMusicDisplay, TypeMusicXML]> => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.text())
      .then(str => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(str, 'application/xml');
        // const data = parse(xmlDoc, 960);
        osmd.load(xmlDoc).then(
          function () {
            osmd.render();
            resolve(osmd);
          },
          function (e) {
            // console.error(e, 'rendering');
            reject(e);
          });
      });
  });
}

const colorStaveNote = (el, color) => {
  el.firstChild.firstChild.firstChild.setAttribute('stroke', color);
  el.firstChild.firstChild.nextSibling.firstChild.setAttribute('stroke', color);
  el.firstChild.firstChild.nextSibling.firstChild.setAttribute('fill', color);
}

const ppq = 960;
const midiFile = 'mozk545a_musescore';
const init = async () => {
  await sequencer.ready();
  await loadMIDIFile(`./assets/${midiFile}.mid`);
  const song = sequencer.createSong(sequencer.getMidiFile(midiFile));
  // song.update();
  const osmd = await loadMusicXMLFile('./assets/mozk545a_musescore.musicxml');
  // const notes = c.getElementsByClassName('vf-stavenote');
  // console.log(notes);
  // console.log(osmd.graphic);
  from(osmd.graphic.measureList)
    // path: openSheetMusicDisplay.GraphicSheet.MeasureList[0][0].staffEntries[0].graphicalVoiceEntries[0].notes[0];
    .pipe(
      // tap(m => { console.log(m); }),
      map((staves, i) => {
        return staves.map(s => {
          return s.staffEntries.map(se => {
            return se.graphicalVoiceEntries.map(ve => {
              // return ve.notes;
              return ve.notes.map((n: GraphicalNote) => {
                const relPosInMeasure = n.sourceNote.voiceEntry.timestamp.realValue;
                return {
                  vfnote: n.vfnote[0],
                  ticks: (i * ppq * 4) + (relPosInMeasure * ppq),
                  noteNumber: n.sourceNote.halfTone + 12, // this is weird!
                  bar: i + 1,
                };
              });
            });
          });
        });
      }),
      reduce((acc, val) => {
        acc.push(val.flat(3));
        return acc;
      }, []),
    ).subscribe(data => {
      console.log(data);
      // console.log(song);
      // console.log(data[0][0] instanceof Vex.Flow.StaveNote);
      console.time('connect_heartbeat');
      const events = song.events.filter(event => event.command === 144);
      // console.log(events);
      const numNotes = events.length;
      const flattened = data.flat();
      const numData = flattened.length;
      for (let i = 0; i < numData; i++) {
        const d = flattened[i];
        const { vfnote, ticks, noteNumber, bar } = d;
        // console.log('check', bar, ticks, noteNumber);
        for (let j = 0; j < numNotes; j++) {
          const event = events[j];
          // console.log(event);
          // if (event.bar == bar && event.noteNumber == noteNumber) {
          if (event.command === 144 && event.ticks == ticks && event.noteNumber == noteNumber) {
            event.vfnote = vfnote;
            break;
          }
        }
      };
      console.timeEnd('connect_heartbeat');

      song.addEventListener('event', 'type = NOTE_ON', (event) => {
        const noteId = event.midiNote.id;
        // o[noteId].setStyle({ fillStyle: "red", strokeStyle: "red" });
        const el = o[noteId].attrs.el;
        colorStaveNote(el, 'red');
      });

      song.addEventListener('event', 'type = NOTE_OFF', (event) => {
        const noteId = event.midiNote.id;
        const el = o[noteId].attrs.el;
        colorStaveNote(el, 'black');
      });

      // console.log(song.events);
      // from(song.events)
      //   .pipe(
      //     filter(event => event.vfnote),
      //     map(event => [event.ticks, event.noteNumber, event.vfnote]),
      //   )
      //   .subscribe(data => {
      //     console.log(data);
      //   });
      // console.log('========================================');
      // from(flattened)
      //   .pipe(
      //     // filter(event => event.vfnote),
      //     map(data => [data.ticks, data.noteNumber, data.step, data.octave]),
      //   )
      //   .subscribe(data => {
      //     console.log(data);
      //   });
    })
}

init();
