// based on: https://github.com/pravdomil/jasmid.ts

// import { BufferReader } from 'jasmid.ts';
import { BufferReader } from './bufferreader';

const descriptions: { [index: number]: { [index: number]: string } | string } = {
  0xff: {
    0x00: 'sequence number',
    0x01: 'text',
    0x02: 'copyright notice',
    0x03: 'track name',
    0x04: 'instrument name',
    0x05: 'lyrics',
    0x06: 'marker',
    0x07: 'cue point',
    0x20: 'channel prefix',
    0x2f: 'end of track',
    0x51: 'tempo',
    0x54: 'smpte offset',
    0x58: 'time signature',
    0x59: 'key signature',
    0x7f: 'sequencer specific',
  },
  0xf0: 'system exclusive',
  0xf7: 'divided sysex',
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

const playbackSpeed = 1;

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

export type SequenceNumberEvent = {
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

export type InstrumentNameEvent = {
  type: [0xff, 0x04],
  text: string,
  ticks: number,
  millis: number,
}

export type LyricsEvent = {
  type: [0xff, 0x05],
  text: string,
  ticks: number,
  millis: number,
}

export type MarkerEvent = {
  type: [0xff, 0x06],
  text: string,
  ticks: number,
  millis: number,
}

export type CuePointEvent = {
  type: [0xff, 0x07],
  text: string,
  ticks: number,
  millis: number,
}

export type ChannelPrefixEvent = {
  type: [0xff, 0x20],
  channel: number,
  ticks: number,
  millis: number,
}

export type EndOfTrackEvent = {
  type: [0xff, 0x2f],
  channel: number,
  ticks: number,
  millis: number,
}

export type TempoEvent = {
  type: [0xff, 0x51],
  ticks: number,
  millis: number,
  bpm: number,
}

export type SMPTEOffsetEvent = {
  type: [0xff, 0x54],
  ticks: number,
  millis: number,
  frameRate: number,
  hour: number,
  min: number,
  sec: number,
  frame: number,
  subFrame: number,
}

export type TimeSignatureEvent = {
  type: [0xff, 0x58],
  ticks: number,
  millis: number,
  numerator: number,
  denominator: number,
  metronome: number,
  thirtySeconds: number,
}

export type KeySignatureEvent = {
  type: [0xff, 0x59],
  ticks: number,
  millis: number,
  key: number,
  scale: number,
}

export type SequenceSpecificEvent = {
  type: [0xff, 0x7f],
  ticks: number,
  millis: number,
  key: number,
  scale: number,
}


export type MidiEvent = NoteOnEvent | NoteOffEvent | TempoEvent | TimeSignatureEvent | SequenceNumberEvent;

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
      // sequence number
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
      // text
      case 0x01:
        return {
          event: {
            type: [typeByte, subTypeByte],
            text: reader.string(length),
          },
          deltaTime,
        }
      // copyright
      case 0x02:
        return {
          event: {
            type: [typeByte, subTypeByte],
            text: reader.string(length),
          },
          deltaTime,
        }
      // track name
      case 0x03:
        return {
          event: {
            type: [typeByte, subTypeByte],
            text: reader.string(length),
          },
          deltaTime,
        }
      // instrument name
      case 0x04:
        return {
          event: {
            type: [typeByte, subTypeByte],
            text: reader.string(length),
          },
          deltaTime,
        }
      // lyrics
      case 0x05:
        return {
          event: {
            type: [typeByte, subTypeByte],
            text: reader.string(length),
          },
          deltaTime,
        }
      // marker
      case 0x06:
        return {
          event: {
            type: [typeByte, subTypeByte],
            text: reader.string(length),
          },
          deltaTime,
        }
      // cue point
      case 0x07:
        return {
          event: {
            type: [typeByte, subTypeByte],
            text: reader.string(length),
          },
          deltaTime,
        }
      // channel prefix
      case 0x20:
        if (length !== 1) {
          throw "Expected length for midiChannelPrefix event is 1, got " + length
        }
        return {
          event: {
            type: [typeByte, subTypeByte],
            channel: reader.uint8(),
          },
          deltaTime,
        }
      // end of track
      case 0x2f:
        if (length !== 0) {
          throw "Expected length for endOfTrack event is 0, got " + length
        }
        return {
          event: {
            type: [typeByte, subTypeByte],
          },
          deltaTime,
        }
      // tempo
      case 0x51:
        if (length !== 3) {
          throw "Expected length for setTempo event is 3, got " + length
        }
        const microsecondsPerBeat = (reader.uint8() << 16) + (reader.uint8() << 8) + reader.uint8();
        const bpm = 60000000 / microsecondsPerBeat;
        return {
          event: {
            type: [typeByte, subTypeByte],
            bpm,
          },
          deltaTime,
          millisPerTick: (1 / playbackSpeed * 60) / bpm / ppq,
        }
      // smpte offset
      case 0x54:
        if (length != 5) {
          throw "Expected length for smpteOffset event is 5, got " + length
        }
        const hourByte = reader.uint8()
        return {
          event: {
            type: [typeByte, subTypeByte],
            frameRate: getFrameRate(hourByte),
            hour: hourByte & 0x1f,
            min: reader.uint8(),
            sec: reader.uint8(),
            frame: reader.uint8(),
            subFrame: reader.uint8(),
          },
          deltaTime,
        }
      // time signature
      case 0x58:
        if (length != 4) {
          throw "Expected length for timeSignature event is 4, got " + length
        }
        return {
          event: {
            type: [typeByte, subTypeByte],
            numerator: reader.uint8(),
            denominator: Math.pow(2, reader.uint8()),
            metronome: reader.uint8(),
            thirtySeconds: reader.uint8(),
          },
          deltaTime,
        }
      // key signature
      case 0x59:
        if (length != 2) {
          throw "Expected length for keySignature event is 2, got " + length
        }
        return {
          event: {
            type: [typeByte, subTypeByte],
            key: reader.int8(),
            scale: reader.uint8(),
          },
          deltaTime,
        }
      // sequencer specific
      case 0x7f:
        return {
          event: {
            type: [typeByte, subTypeByte],
            data: reader.read(length),
          },
          deltaTime,
        }
      // undefined
      default:
        return {
          event: {
            type: [typeByte, subTypeByte],
            data: reader.read(length),
          },
          deltaTime,
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