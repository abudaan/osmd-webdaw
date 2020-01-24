// based on: https://github.com/pravdomil/jasmid.ts

// import { BufferReader } from 'jasmid.ts';
import { BufferReader } from './bufferreader';

const descriptions: { [index: number]: { [index: number]: string } | string } = {
  0xff: {
    0x00: 'sequenceNumber',
    0x01: 'text',
    0x02: 'copyrightNotice',
    0x03: 'trackName',
    0x04: 'instrumentName',
    0x05: 'lyrics',
    0x06: 'marker',
    0x07: 'cuePoint',
    0x20: 'midiChannelPrefix',
    0x2f: 'endOfTrack',
    0x51: 'setTempo',
    0x54: 'smpteOffset',
    0x58: 'timeSignature',
    0x59: 'keySignature',
    0x7f: 'sequencerSpecific',
  },
  0xf0: 'system eclusive',
  0xf7: 'dividedSysEx',
  0x80: 'note on',
  0x90: 'note off',
  0xa0: 'note aftertouch',
  0xb0: 'controller',
  0xc0: 'program change',
  0xd0: 'channel aftertouch',
  0xe0: 'pitch bend',
}

export const getMIDIEventDescription = (event: MidiEvent): string => {
  const [type, subType] = event.type;
  if (typeof subType === 'undefined') {
    return descriptions[type] as string;
  }
  return descriptions[type][subType] || 'undefined';

}

export type ParsedData = {
  event: any,
  deltaTime: number,
  lastTypeByte?: number,
  millisPerTick?: number,
}

export type NoteOnEvent = {
  type: [0x90],
  ticks: number,
  millis: number,
  noteNumber: number,
  velocity: number,
}

export type NoteOffEvent = {
  type: [0x80],
  ticks: number,
  millis: number,
  noteNumber: number,
  velocity: 0,
}

export type TempoEvent = {
  type: [0xff, 0x51],
  ticks: number,
  millis: number,
  bpm: number,
}

export type TimeSignatureEvent = {
  type: [0xff, 0x58],
  ticks: number,
  millis: number,
  numerator: number,
  denominator: number,
}

export type SequencerNumberEvent = {
  type: [0xff, 0x00],
  number: number,
  ticks: 0,
  millis: 0,
}

export type TextEvent = {
  type: [0xff, 0x01],
  text: string,
  ticks: number,
  millis: number,
}

export type CopyrightEvent = {
  type: [0xff, 0x02],
  text: string,
  ticks: 0,
  millis: 0,
}

export type TrackNameEvent = {
  type: [0xff, 0x03],
  text: string,
  ticks: 0,
  millis: 0,
}

export type MidiEvent = NoteOnEvent | NoteOffEvent | TempoEvent | TimeSignatureEvent | SequencerNumberEvent;

export function parseMidiFile(buffer: ArrayBufferLike) {
  const reader = new BufferReader(buffer)

  const header = parseHeader(reader)
  const tracks = parseTracks(reader)

  return { header, tracks }
}

function parseHeader(reader: BufferReader) {
  const headerChunk = reader.midiChunk()
  if (headerChunk.id !== "MThd" || headerChunk.length !== 6) {
    throw "Bad .mid file, header not found"
  }

  const headerReader = new BufferReader(headerChunk.data)
  const formatType = headerReader.uint16()
  const trackCount = headerReader.uint16()
  const timeDivision = headerReader.uint16()
  if (timeDivision & 0x8000) {
    throw "Expressing time division in SMTPE frames is not supported yet"
  }
  const ticksPerBeat = timeDivision

  return { formatType, trackCount, ticksPerBeat }
}

function parseTracks(reader: BufferReader) {
  let tracks: MidiEvent[][] = []
  while (!reader.eof()) {
    const trackChunk = reader.midiChunk()

    if (trackChunk.id !== "MTrk") {
      throw "Unexpected chunk, expected MTrk, got " + trackChunk.id
    }

    const trackTrack = new BufferReader(trackChunk.data)
    let track: MidiEvent[] = []
    let ticks = 0;
    let millis = 0;
    let millisPerTick = 0;
    let lastTypeByte = null;
    while (!trackTrack.eof()) {
      let data = parseEvent(trackTrack, lastTypeByte)
      const { event, lastTypeByte: ltb, deltaTime, millisPerTick: mpt } = data;
      ticks += deltaTime;
      if (mpt) {
        millisPerTick = mpt;
      }
      if (ltb) {
        lastTypeByte = ltb;
      }
      millis = ticks * millisPerTick;
      track = [...track, {
        ...event,
        ticks,
        millis,
      }]
    }

    tracks = [...tracks, track]
  }
  return tracks
}

function parseEvent(reader: BufferReader, lastTypeByte: number | null): ParsedData {
  const deltaTime = reader.midiInt()
  let typeByte = reader.uint8()

  if (typeByte === 0xff) {
    /** meta event */

    const type = "meta" as "meta"
    const subTypeByte = reader.uint8()
    const length = reader.midiInt()

    switch (subTypeByte) {
      case 0x00:
        if (length !== 2) {
          throw "Expected length for sequenceNumber event is 2, got " + length
        }
        return {
          event: {
            type: [typeByte, subTypeByte],
            number: reader.uint16(),
          },
          deltaTime,
        }

      case 0x01:
        return {
          event: {
            type: [typeByte, subTypeByte],
            text: reader.string(length),
          },
          deltaTime,
        }
      case 0x02:
        return {
          event: {
            type: [typeByte, subTypeByte],
            text: reader.string(length),
          },
          deltaTime,
        }
      case 0x03:
        return {
          event: {
            type: [typeByte, subTypeByte],
            text: reader.string(length),
          },
          deltaTime,
        }
      case 0x04:
        return {
          type,
          subType: "instrumentName" as "instrumentName",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length),
        }
      case 0x05:
        return {
          type,
          subType: "lyrics" as "lyrics",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length),
        }
      case 0x06:
        return {
          type,
          subType: "marker" as "marker",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length),
        }
      case 0x07:
        return {
          type,
          subType: "cuePoint" as "cuePoint",
          typeByte,
          subTypeByte,
          deltaTime,
          text: reader.string(length),
        }
      case 0x20:
        if (length !== 1) {
          throw "Expected length for midiChannelPrefix event is 1, got " + length
        }
        return {
          type,
          subType: "midiChannelPrefix" as "midiChannelPrefix",
          typeByte,
          subTypeByte,
          deltaTime,
          channel: reader.uint8(),
        }
      case 0x2f:
        if (length !== 0) {
          throw "Expected length for endOfTrack event is 0, got " + length
        }
        return {
          type,
          subType: "endOfTrack" as "endOfTrack",
          typeByte,
          subTypeByte,
          deltaTime,
        }
      case 0x51:
        if (length !== 3) {
          throw "Expected length for setTempo event is 3, got " + length
        }
        const microsecondsPerBeat = (reader.uint8() << 16) + (reader.uint8() << 8) + reader.uint8();
        const bpm = 60000000 / microsecondsPerBeat;
        return {
          type: 0x51,
          ticks: 0,
          millis: 0,
          bpm,
        }
      case 0x54:
        if (length != 5) {
          throw "Expected length for smpteOffset event is 5, got " + length
        }
        const hourByte = reader.uint8()
        return {
          type,
          subType: "smpteOffset" as "smpteOffset",
          typeByte,
          subTypeByte,
          deltaTime,
          frameRate: getFrameRate(hourByte),
          hour: hourByte & 0x1f,
          min: reader.uint8(),
          sec: reader.uint8(),
          frame: reader.uint8(),
          subFrame: reader.uint8(),
        }
      case 0x58:
        if (length != 4) {
          throw "Expected length for timeSignature event is 4, got " + length
        }
        return {
          type,
          subType: "timeSignature" as "timeSignature",
          typeByte,
          subTypeByte,
          deltaTime,
          numerator: reader.uint8(),
          denominator: Math.pow(2, reader.uint8()),
          metronome: reader.uint8(),
          thirtySeconds: reader.uint8(),
        }
      case 0x59:
        if (length != 2) {
          throw "Expected length for keySignature event is 2, got " + length
        }
        return {
          type,
          subType: "keySignature" as "keySignature",
          typeByte,
          subTypeByte,
          deltaTime,
          key: reader.int8(),
          scale: reader.uint8(),
        }
      case 0x7f:
        return {
          type,
          subType: "sequencerSpecific" as "sequencerSpecific",
          typeByte,
          subTypeByte,
          deltaTime,
          data: reader.read(length),
        }
      default:
        return {
          type,
          subType: undefined,
          typeByte,
          subTypeByte,
          deltaTime,
          data: reader.read(length),
        }
    }
  } else if (typeByte === 0xf0) {
    /** system event */

    const length = reader.midiInt()
    return {
      type: "sysEx" as "sysEx",
      subType: undefined,
      typeByte,
      deltaTime,
      data: reader.read(length),
    }
  } else if (typeByte === 0xf7) {
    /** divided system event */

    const length = reader.midiInt()
    return {
      type: "dividedSysEx" as "dividedSysEx",
      subType: undefined,
      typeByte,
      deltaTime,
      data: reader.read(length),
    }
  } else {
    /** midi event */

    const type = "midi" as "midi"

    /**
     * running status - reuse lastEventTypeByte as the event type
     * typeByte is actually the first parameter
     */
    const isRunningStatus = (typeByte & 0b10000000) === 0
    const value = isRunningStatus ? typeByte : reader.uint8()
    typeByte = isRunningStatus ? (lastTypeByte === null ? 0 : lastTypeByte) : typeByte

    console.log(isRunningStatus, typeByte, value);

    const channel = typeByte & 0x0f

    switch (typeByte >> 4) {
      case 0x08:
        return {
          type,
          subType: "noteOff" as "noteOff",
          typeByte,
          deltaTime,
          channel,
          note: value,
          velocity: reader.uint8(),
        }
      case 0x09:
        const velocity = reader.uint8()
        return {
          type,
          subType: velocity === 0 ? ("noteOff" as "noteOff") : ("noteOn" as "noteOn"),
          typeByte,
          deltaTime,
          channel,
          note: value,
          velocity,
        }
      case 0x0a:
        return {
          type,
          subType: "noteAftertouch" as "noteAftertouch",
          typeByte,
          deltaTime,
          channel,
          note: value,
          amount: reader.uint8(),
        }
      case 0x0b:
        return {
          type,
          subType: "controller" as "controller",
          typeByte,
          deltaTime,
          channel,
          controllerType: value,
          value: reader.uint8(),
        }
      case 0x0c:
        return {
          type,
          subType: "programChange" as "programChange",
          typeByte,
          deltaTime,
          channel,
          program: value,
        }
      case 0x0d:
        return {
          type,
          subType: "channelAftertouch" as "channelAftertouch",
          typeByte,
          deltaTime,
          channel,
          amount: value,
        }
      case 0x0e:
        return {
          type,
          subType: "pitchBend" as "pitchBend",
          typeByte,
          deltaTime,
          channel,
          value: value + (reader.uint8() << 7),
        }
    }
  }
  throw "Unrecognised MIDI event type byte: " + typeByte
}

function getFrameRate(hourByte: number) {
  switch (hourByte & 0b1100000) {
    case 0x00:
      return 24
    case 0x20:
      return 25
    case 0x40:
      return 29
    case 0x60:
      return 30
    default:
      return 0
  }
}