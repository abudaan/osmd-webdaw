import { getNoteNumber } from "./midi_utils";
// import { NoteEvent } from "./types";
import { TempoEvent, TimeSignatureEvent, MIDIEvent } from "./midi_events";

const NOTE_ON = 0x90; // 144
const NOTE_OFF = 0x80; // 128
const TEMPO = 0x51; // 81
const TIME_SIGNATURE = 0x58; // 88

let n = 0;
// export type EventData = NoteEvent; // | TempoEvent | SignatureEvent;

export type PartData = {
  id: string;
  name: string;
  instrument: string;
  volume: number;
  events: MIDIEvent[];
};

export type Repeat = {
  bar: number;
  type: string;
}[];

export type ParsedMusicXML = {
  parts: PartData[];
  repeats: number[][];
  timeEvents: (TempoEvent | TimeSignatureEvent)[];
};

const parseMusicXML = (xmlDoc: XMLDocument, ppq: number = 960): ParsedMusicXML | null => {
  if (xmlDoc === null) {
    return null;
  }
  let type;
  if (xmlDoc.firstChild !== null && xmlDoc.firstChild.nextSibling !== null) {
    type = xmlDoc.firstChild.nextSibling.nodeName;
  }
  // console.log('type', type, nsResolver);

  if (type === "score-partwise") {
    return parsePartWise(xmlDoc, ppq);
  }
  if (type === "score-timewise") {
    return parseTimeWise(xmlDoc);
  }
  // console.log('unknown type', type);
  return null;
};

const parsePartWise = (xmlDoc: XMLDocument, ppq: number = 960): ParsedMusicXML => {
  if (xmlDoc === null) {
    return null;
  }
  // const nsResolver = xmlDoc.createNSResolver(
  //   xmlDoc.ownerDocument === null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement
  // );
  const nsResolver = xmlDoc.createNSResolver(xmlDoc.documentElement);
  const partIterator = xmlDoc.evaluate(
    "//score-part",
    xmlDoc,
    nsResolver,
    XPathResult.ANY_TYPE,
    null
  );
  const parts: PartData[] = [];
  const tiedNotes: { [id: string]: number } = {};
  const repeats: Repeat = [{ bar: 1, type: "forward" }];
  const timeEvents: (TempoEvent | TimeSignatureEvent)[] = [];
  const playbackSpeed = 1;

  let index = -1;
  let tmp;
  let tmp1;
  let partNode;
  while ((partNode = partIterator.iterateNext())) {
    index += 1;
    // get id and name of the part
    const partId = xmlDoc.evaluate("@id", partNode, nsResolver, XPathResult.STRING_TYPE, null)
      .stringValue;
    const partName = xmlDoc.evaluate(
      "part-name",
      partNode,
      nsResolver,
      XPathResult.STRING_TYPE,
      null
    ).stringValue;

    // let velocity = 100;
    let volume = 70;
    tmp = xmlDoc.evaluate(
      "midi-instrument/volume",
      partNode,
      nsResolver,
      XPathResult.NUMBER_TYPE,
      null
    ).numberValue;
    if (!isNaN(tmp)) {
      // velocity = (tmp / 100) * 127;
      volume = tmp;
    }
    const velocity = (volume / 100) * 127;

    let channel = 0;
    tmp = xmlDoc.evaluate(
      "midi-instrument/midi-channel",
      partNode,
      nsResolver,
      XPathResult.NUMBER_TYPE,
      null
    ).numberValue;
    if (!isNaN(tmp)) {
      channel = tmp - 1;
    }

    let instrument = "piano";
    tmp = xmlDoc.evaluate(
      "score-instrument/instrument-name",
      partNode,
      nsResolver,
      XPathResult.STRING_TYPE,
      null
    ).stringValue;
    if (!!tmp) {
      instrument = tmp;
    }

    parts.push({ id: partId, name: partName, volume, instrument, events: [] });

    const measureIterator = xmlDoc.evaluate(
      '//part[@id="' + partId + '"]/measure',
      partNode,
      nsResolver,
      XPathResult.ANY_TYPE,
      null
    );
    let measureNode;
    let ticks = 0;
    let bpm = 60;
    let divisions = 24;
    let numerator = 4;
    let denominator = 4;
    let millisPerTick = (((1 / playbackSpeed) * 60) / bpm / ppq) * 1000;
    while ((measureNode = measureIterator.iterateNext())) {
      const measureNumber = xmlDoc.evaluate(
        "@number",
        measureNode,
        nsResolver,
        XPathResult.NUMBER_TYPE,
        null
      ).numberValue;
      console.log(measureNumber);
      tmp = xmlDoc.evaluate(
        "attributes/divisions",
        measureNode,
        nsResolver,
        XPathResult.NUMBER_TYPE,
        null
      ).numberValue;
      if (!isNaN(tmp)) {
        divisions = tmp;
        // console.log('divisions', divisions);
      }
      tmp = xmlDoc.evaluate(
        "attributes/time/beats",
        measureNode,
        nsResolver,
        XPathResult.NUMBER_TYPE,
        null
      ).numberValue;
      tmp1 = xmlDoc.evaluate(
        "attributes/time/beat-type",
        measureNode,
        nsResolver,
        XPathResult.NUMBER_TYPE,
        null
      ).numberValue;
      if (!isNaN(tmp) && !isNaN(tmp1)) {
        numerator = tmp;
        denominator = tmp1;
        const event: TimeSignatureEvent = {
          type: 0xff,
          subType: TIME_SIGNATURE,
          descr: "time signature",
          ticks,
          millis: ticks * millisPerTick,
          numerator,
          denominator,
          metronome: 0, // @TODO: calculate this
          thirtySeconds: 0,
          bar: measureNumber,
        };
        parts[index].events.push(event);
        timeEvents.push(event);
      }

      tmp = xmlDoc.evaluate(
        "direction/sound/@tempo",
        measureNode,
        nsResolver,
        XPathResult.NUMBER_TYPE,
        null
      ).numberValue;
      if (!isNaN(tmp)) {
        // console.log("BPM", tmp);
        const millis = ticks * millisPerTick;
        millisPerTick = (((1 / playbackSpeed) * 60) / tmp / ppq) * 1000;
        bpm = tmp;

        const event: TempoEvent = {
          type: 0xff,
          subType: 0x51,
          descr: "tempo",
          ticks,
          bpm,
          millis,
          millisPerTick,
        };
        parts[index].events.push(event);
        timeEvents.push(event);
      }

      tmp = xmlDoc.evaluate(
        "barline/repeat/@direction",
        measureNode,
        nsResolver,
        XPathResult.STRING_TYPE,
        null
      ).stringValue;
      if (tmp !== "") {
        // console.log(tmp, measureNumber);
        if (measureNumber !== 1) {
          repeats.push({ type: tmp, bar: measureNumber });
        }
      }

      // get all notes and backups
      const noteIterator = xmlDoc.evaluate(
        "*[self::note or self::backup or self::forward]",
        measureNode,
        nsResolver,
        XPathResult.ANY_TYPE,
        null
      );
      let noteNode;
      while ((noteNode = noteIterator.iterateNext())) {
        // console.log(noteNode);
        let noteDuration = 0;
        let noteDurationTicks = 0;
        let voice = -1;
        let staff = -1;

        let tieStart = false;
        let tieStop = false;
        const tieIterator = xmlDoc.evaluate(
          "tie",
          noteNode,
          nsResolver,
          XPathResult.ANY_TYPE,
          null
        );
        let tieNode;
        while ((tieNode = tieIterator.iterateNext())) {
          const tieType = xmlDoc.evaluate(
            "@type",
            tieNode,
            nsResolver,
            XPathResult.STRING_TYPE,
            null
          ).stringValue;
          if (tieType === "start") {
            tieStart = true;
          } else if (tieType === "stop") {
            tieStop = true;
          }
        }

        const rest = xmlDoc.evaluate(
          "rest",
          noteNode,
          nsResolver,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        const chord = xmlDoc.evaluate(
          "chord",
          noteNode,
          nsResolver,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        const grace = xmlDoc.evaluate(
          "grace",
          noteNode,
          nsResolver,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        if (rest !== null) {
          noteDuration = xmlDoc.evaluate(
            "duration",
            noteNode,
            nsResolver,
            XPathResult.NUMBER_TYPE,
            null
          ).numberValue;
          ticks += (noteDuration / divisions) * ppq;
          // console.log("rest", ticks);
        } else if (noteNode.nodeName === "note" && grace === null) {
          const step = xmlDoc.evaluate(
            "pitch/step",
            noteNode,
            nsResolver,
            XPathResult.STRING_TYPE,
            null
          ).stringValue;
          const alter = xmlDoc.evaluate(
            "pitch/alter",
            noteNode,
            nsResolver,
            XPathResult.NUMBER_TYPE,
            null
          ).numberValue;
          const octave = xmlDoc.evaluate(
            "pitch/octave",
            noteNode,
            nsResolver,
            XPathResult.NUMBER_TYPE,
            null
          ).numberValue;
          tmp = xmlDoc.evaluate("voice", noteNode, nsResolver, XPathResult.NUMBER_TYPE, null)
            .numberValue;
          if (!isNaN(tmp)) {
            voice = tmp;
          }
          tmp = xmlDoc.evaluate("staff", noteNode, nsResolver, XPathResult.NUMBER_TYPE, null)
            .numberValue;
          if (!isNaN(tmp)) {
            staff = tmp;
          }
          noteDuration = xmlDoc.evaluate(
            "duration",
            noteNode,
            nsResolver,
            XPathResult.NUMBER_TYPE,
            null
          ).numberValue;
          noteDurationTicks = (noteDuration / divisions) * ppq;
          // const noteType = xmlDoc.evaluate('type', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
          let noteName = step;

          if (!isNaN(alter)) {
            switch (alter) {
              case -2:
                noteName += "bb";
                break;
              case -1:
                noteName += "b";
                break;
              case 1:
                noteName += "#";
                break;
              case 2:
                noteName += "##";
                break;
            }
          }

          const noteNumber = getNoteNumber(noteName, octave);
          // console.log("\t", ticks, "ON", n++);
          const note = {
            ticks,
            descr: "note on",
            type: 0x90,
            channel,
            millis: ticks * millisPerTick,
            // noteName,
            // octave,
            noteNumber,
            velocity,
            bar: measureNumber,
            // voice,
            // staff,
          };
          ticks += noteDurationTicks;
          if (chord !== null) {
            ticks -= noteDurationTicks;
            // console.log("chord", ticks, noteDurationTicks);
          }

          parts[index].events.push(note);
          //console.log('tie', tieStart, tieStop);

          if (tieStart === false && tieStop === false) {
            // no ties
            //console.log('no ties', measureNumber, voice, noteNumber, tiedNotes);
            // console.log(ticks, "OFF", index);

            parts[index].events.push({
              // command: NOTE_OFF,
              ticks,
              descr: "note off",
              type: 128,
              channel,
              millis: ticks * millisPerTick,
              noteNumber,
              velocity: 0,
              bar: measureNumber,
              // noteName,
              // octave,
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
            // console.log(ticks, "OFF", index);

            parts[index].events.push({
              // command: NOTE_OFF,
              ticks: tiedNotes[`N_${staff}-${voice}-${noteNumber}`],
              descr: "note off",
              type: NOTE_OFF,
              channel,
              millis: ticks * millisPerTick,
              // octave,
              // noteName,
              noteNumber,
              velocity: 0,
              bar: measureNumber,
              // voice,
              // staff,
            });
            delete tiedNotes[`N_${staff}-${voice}-${noteNumber}`];
            //console.log('end', measureNumber, voice, noteNumber, tiedNotes);
          }
        } else if (noteNode.nodeName === "backup") {
          noteDuration = xmlDoc.evaluate(
            "duration",
            noteNode,
            nsResolver,
            XPathResult.NUMBER_TYPE,
            null
          ).numberValue;
          ticks -= (noteDuration / divisions) * ppq;
          // console.log("backup", ticks);
          //console.log(noteDuration, divisions);
        } else if (noteNode.nodeName === "forward") {
          noteDuration = xmlDoc.evaluate(
            "duration",
            noteNode,
            nsResolver,
            XPathResult.NUMBER_TYPE,
            null
          ).numberValue;
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

  return { parts, repeats: repeats2, timeEvents };
};

const parseTimeWise = (doc: XMLDocument): ParsedMusicXML | null => {
  // to be implemented
  return null;
};

export { parseMusicXML };
