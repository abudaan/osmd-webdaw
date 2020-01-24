import { MidiEvent } from '../midi_events';

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
