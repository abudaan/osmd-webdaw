import sequencer from 'heartbeat-sequencer';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { from, of, forkJoin } from 'rxjs';
import { map, filter, tap, switchMap, mergeMap, reduce, groupBy, toArray, mergeAll } from 'rxjs/operators';
import flatten from 'ramda/es/flatten';


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
          // console.log('note', ticks, noteDuration, divisions, ppq);
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
            delete tiedNotes[`N_${staff}-${voice}-${noteNumber}`];
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
        const data = parse(xmlDoc, 960);
        osmd.load(xmlDoc).then(
          function () {
            osmd.render();
            resolve([osmd, data]);
          },
          function (e) {
            // console.error(e, 'rendering');
            reject(e);
          });
      });
  });
}

const init = async () => {
  await sequencer.ready();
  await loadMIDIFile('./assets/mozk545a_musescore.mid');
  sequencer.createSong(sequencer.getMidiFile('mozk545a_musescore'));
  const [osmd, hints] = await loadMusicXMLFile('./assets/mozk545a_musescore.musicxml');
  // const notes = c.getElementsByClassName('vf-stavenote');
  // console.log(notes);
  console.log(osmd.graphic.measureList);
  from(osmd.graphic.measureList)
    // path: openSheetMusicDisplay.GraphicSheet.MeasureList[0][0].staffEntries[0].graphicalVoiceEntries[0].notes[0];
    .pipe(
      map(measure => {
        return measure.map(m => {
          return m.staffEntries.map(s => {
            return s.graphicalVoiceEntries.map(v => {
              return v.notes.map(n => {
                return n.vfnote[0];
              });
            });
          })
        })
      }),
    ).subscribe(data => {
      console.log(data);
    });
}

init();
