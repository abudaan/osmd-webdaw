import sequencer from 'heartbeat-sequencer';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

const NOTE_ON = 0x90; // 144
const NOTE_OFF = 0x80; // 128
const TEMPO = 0x51; // 81
const TIME_SIGNATURE = 0x58; // 88

enum NOTE {
  NOTE_ON,
  NOTE_OFF,
}

type NoteEvent = {
  command: NOTE,
  channel: number,
  ticks: number,
  velocity: number,
  noteNumber: number,
  octave: number,
  noteName: string,
}

type TempoEvent = {
  command: 0x51,
  channel: number,
  ticks: number,
  bpm: number,
}

type SignatureEvent = {
  command: 0x58,
  channel: number,
  ticks: number,
  numerator: number,
  denominator: number,
}

type EventData = NoteEvent | TempoEvent | SignatureEvent;

type EventDataPerPart = {
  [partId: string]: EventData[],
};

type PartData = {
  id: string,
  name: string,
  instrument: string,
  volume: number
}[];

export type TypeRepeats = {
  bar: number
  type: string
}[];

const parseMusicXML = (xmlDoc: XMLDocument, ppq: number = 960): [PartData, EventDataPerPart, number[][]] | null => {
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

const parsePartWise = (xmlDoc: XMLDocument, ppq: number): [PartData, EventDataPerPart, number[][]] => {
  const nsResolver = xmlDoc.createNSResolver(xmlDoc.ownerDocument === null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
  const partIterator = xmlDoc.evaluate('//score-part', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null);
  const events: EventDataPerPart = {};
  const parts: PartData = [];
  const tiedNotes: { [id: string]: number } = {};
  const repeats: TypeRepeats = [{ bar: 1, type: 'forward' }];

  let tmp;
  let tmp1;
  let partNode;
  while (partNode = partIterator.iterateNext()) {
    // get id and name of the part
    const partId = xmlDoc.evaluate('@id', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
    const partName = xmlDoc.evaluate('part-name', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;

    // let velocity = 100;
    let volume = 70;
    tmp = xmlDoc.evaluate('midi-instrument/volume', partNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
    if (!isNaN(tmp)) {
      // velocity = (tmp / 100) * 127;
      volume = tmp;
    }
    const velocity = (volume / 100) * 127;

    let channel = 0;
    tmp = xmlDoc.evaluate('midi-instrument/midi-channel', partNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
    if (!isNaN(tmp)) {
      channel = tmp - 1;
    }

    let instrument = 'piano'
    tmp = xmlDoc.evaluate('score-instrument/instrument-name', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
    if (!!tmp) {
      instrument = tmp;
    }

    parts.push({ id: partId, name: partName, volume, instrument });
    events[partId] = [];

    const measureIterator = xmlDoc.evaluate('//part[@id="' + partId + '"]/measure', partNode, nsResolver, XPathResult.ANY_TYPE, null);
    let measureNode;
    let ticks = 0;
    let divisions = 1;
    let numerator = 4;
    let denominator = 4;
    while (measureNode = measureIterator.iterateNext()) {
      const measureNumber = xmlDoc.evaluate('@number', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      tmp = xmlDoc.evaluate('attributes/divisions', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp)) {
        divisions = tmp;
        // console.log('divisions', divisions);
      }
      tmp = xmlDoc.evaluate('attributes/time/beats', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      tmp1 = xmlDoc.evaluate('attributes/time/beat-type', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp) && !isNaN(tmp1)) {
        numerator = tmp;
        denominator = tmp1;
        events[partId].push({
          command: TIME_SIGNATURE,
          channel,
          ticks,
          numerator,
          denominator,
        });
      }

      tmp = xmlDoc.evaluate('direction/sound/@tempo', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp)) {
        // console.log('BPM', tmp);
        events[partId].push({
          command: TEMPO,
          channel,
          ticks,
          bpm: tmp,
        });
      }

      tmp = xmlDoc.evaluate('barline/repeat/@direction', measureNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
      if (tmp !== '') {
        // console.log(tmp, measureNumber);
        if (measureNumber !== 1) {
          repeats.push({ type: tmp, bar: measureNumber });
        }
      }

      // get all notes and backups
      const noteIterator = xmlDoc.evaluate('*[self::note or self::backup or self::forward]', measureNode, nsResolver, XPathResult.ANY_TYPE, null);
      let noteNode;
      while (noteNode = noteIterator.iterateNext()) {
        // console.log(noteNode);
        let noteDuration = 0;
        let noteDurationTicks = 0;
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
          noteDurationTicks = (noteDuration / divisions) * ppq;
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
            command: NOTE_ON,
            channel,
            ticks,
            noteName,
            octave,
            noteNumber,
            velocity,
            // voice,
            // staff,
          };
          ticks += noteDurationTicks;
          if (chord !== null) {
            ticks -= noteDurationTicks;
          }

          events[partId].push(note);
          //console.log('tie', tieStart, tieStop);

          if (tieStart === false && tieStop === false) {
            // no ties
            //console.log('no ties', measureNumber, voice, noteNumber, tiedNotes);
            events[partId].push({
              command: NOTE_OFF,
              channel,
              ticks,
              noteNumber,
              velocity: 0,
              noteName,
              octave,
              // voice,
              // staff,
            });
          } else if (tieStart === true && tieStop === false) {
            // start of tie
            tiedNotes[`N_${staff}-${voice}-${noteNumber}`] = noteDurationTicks;
            //console.log('start', measureNumber, voice, noteNumber, tiedNotes);
          } else if (tieStart === true && tieStop === true) {
            // tied to yet another note
            tiedNotes[`N_${staff}-${voice}-${noteNumber}`] += noteDurationTicks;
            //console.log('thru', measureNumber, voice, noteNumber, tiedNotes);
          } else if (tieStart === false && tieStop === true) {
            // end of tie
            tiedNotes[`N_${staff}-${voice}-${noteNumber}`] += noteDurationTicks;
            events[partId].push({
              command: NOTE_OFF,
              channel,
              ticks: tiedNotes[`N_${staff}-${voice}-${noteNumber}`],
              octave,
              noteName,
              noteNumber,
              velocity: 0,
              // voice,
              // staff,
            });
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

  const repeats2: number[][] = [];
  let j: number = 0;
  repeats.forEach((t, i) => {
    if (i % 2 === 0) {
      repeats2[j] = [];
      repeats2[j].push(t.bar);
    } else if (i % 2 === 1) {
      repeats2[j].push(t.bar);
      j++;
    }
  });

  return [parts, events, repeats2];
}

const parseTimeWise = (doc: XMLDocument): [PartData, EventDataPerPart, number[][]] | null => {
  // to be implemented
  return null;
}

export {
  parseMusicXML,
}