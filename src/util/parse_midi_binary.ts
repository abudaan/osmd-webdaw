// based on: https://github.com/pravdomil/jasmid.ts

// import { BufferReader } from 'jasmid.ts';
import { BufferReader } from './bufferreader';
import { MidiEvent } from '../midi_events';

const playbackSpeed = 1;

export type ParsedData = {
  event: any,
  deltaTime: number,
  lastTypeByte?: number,
  bpm?: number,
}

export function parseMidiFile(buffer: ArrayBufferLike) {
  const reader = new BufferReader(buffer)

  const header = parseHeader(reader)
  const tracks = parseTracks(reader, header.ticksPerBeat)

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

function parseTracks(reader: BufferReader, ppq: number) {
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
      const { event, lastTypeByte: ltb, deltaTime, bpm } = data;
      ticks += deltaTime;
      if (bpm) {
        millisPerTick = ((1 / playbackSpeed * 60) / bpm / ppq) * 1000;
        console.log(bpm, ppq, millisPerTick);
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

  // meta events: 0xff
  // system events: 0xf0, 0xf7
  // midi events: all other bytes

  if (typeByte === 0xff) {
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
          bpm,
          deltaTime,
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
    // system exclusive
    const length = reader.midiInt()
    return {
      event: {
        type: [0xf0],
        data: reader.read(length),
      },
      deltaTime,
    }
  } else if (typeByte === 0xf7) {
    // divided system exclusive
    const length = reader.midiInt()
    return {
      event: {
        type: [0xf0],
        data: reader.read(length),
      },
      deltaTime,
    }
  } else {
    /**
     * running status - reuse lastEventTypeByte as the event type
     * typeByte is actually the first parameter
     */
    const isRunningStatus = (typeByte & 0b10000000) === 0
    const value = isRunningStatus ? typeByte : reader.uint8()
    typeByte = isRunningStatus ? (lastTypeByte === null ? 0 : lastTypeByte) : typeByte

    console.log(isRunningStatus, typeByte, value);

    const channel = typeByte & 0x0f

    switch (typeByte) {
      // note on
      case 0x80:
        return {
          event: {
            type: [typeByte],
            channel,
            note: value,
            velocity: reader.uint8(),
          },
          deltaTime,
        }
      // note off
      case 0x90:
        const velocity = reader.uint8()
        return {
          event: {
            type: [velocity === 0 ? 0x90 : 0x80],
            channel,
            note: value,
            velocity,
          },
          deltaTime,
        }
      // note aftertouch
      case 0xa0:
        return {
          event: {
            type: [0xa0],
            channel,
            note: value,
            amount: reader.uint8(),
          },
          deltaTime,
        }
      // controller
      case 0xb0:
        return {
          event: {
            type: [0xb0],
            channel,
            controllerNumber: value,
            value: reader.uint8(),
          },
          deltaTime,
        }
      // program change
      case 0xc0:
        return {
          event: {
            type: [0xc0],
            channel,
            program: value,
          },
          deltaTime,
        }
      // channel aftertouch
      case 0xd0:
        return {
          event: {
            type: [0xd0],
            channel,
            amount: value,
          },
          deltaTime,
        }
      // pitch bend
      case 0xe0:
        return {
          event: {
            type: [0xe0],
            channel,
            value: value + (reader.uint8() << 7),
          },
          deltaTime,
        }
    }
  }
  throw `Unrecognised MIDI event type byte: ${typeByte}`;
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