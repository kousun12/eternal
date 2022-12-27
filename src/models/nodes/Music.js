// @flow
import React from 'react';
import { get } from 'lodash';
import * as Key from 'tonal-key';
import { transpose } from 'tonal-distance';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import { arrayOf } from 'utils/typeUtils';
import { chroma } from 'tonal-pcset';
import { Chord, ChordType, Scale } from 'tonal';

const Types = window.Types;
// window.Chord = Chord;
// window.ChordType = ChordType;
// window.Key = Key;
// window.Scale = Scale;

const TT = {
  Note: Types.string.aliased(
    'Note',
    'Note encoding, can be something like A4, a midi index, or a raw frequency in Hz'
  ),
  Interval: Types.string.aliased(
    'Interval',
    'Natural interval name, e.g. 1P, 2M, 3M, 4P, 5P, 6m, 7m'
  ),
  Scale: Types.string.aliased(
    'ScaleName',
    <div>
      <p>One of:</p>
      <p style={{ display: 'flex', flexWrap: 'wrap' }}>
        {Scale.names().map((n) => (
          <span style={{ marginRight: 4, marginBottom: 6 }} key={n}>
            <code>{n}</code>{' '}
          </span>
        ))}
      </p>
    </div>
  ),
  Chord: Types.string.aliased(
    'ChordName',
    <div>
      <p>One of:</p>
      <p style={{ display: 'flex', flexWrap: 'wrap' }}>
        {ChordType.symbols().map((n) => (
          <span style={{ marginRight: 4, marginBottom: 6 }} key={n}>
            <code>{n}</code>{' '}
          </span>
        ))}
      </p>
    </div>
  ),
};
export class ScaleNode extends NodeBase<
  {},
  { name: string, tonic: string },
  { notes: string[], intervals: string[] }
> {
  static +displayName = 'Music Scale';
  static +registryName = 'ScaleNode';
  static description = (<span>A Musical scale</span>);
  static schema = {
    input: {
      tonic: Types.string.desc(
        'The tonic for this scale, e.g. "C" or "Ab4". ' +
          'You can optionally specify the scale name here too, and omit the name input, e.g. "C minor pentatonic"' +
          ' See the name param info for possible scale names.'
      ),
      name: TT.Scale.desc('The name of the scale. Check type for possible values'),
    },
    output: {
      notes: arrayOf(TT.Note).desc('The notes in this scale'),
      intervals: arrayOf(TT.Interval).desc('The intervals between notes in this scale'),
    },
    state: {},
  };

  process = () => {
    if (!get(this.props, 'tonic')) {
      return { notes: [], intervals: [] };
    }
    const str = [this.props.tonic, this.props.name].filter((a) => a).join(' ');
    const s = Scale.get(str);
    return {
      notes: s.notes,
      intervals: s.intervals,
    };
  };

  onInputChange = () => this.outKeys();
}

export class ChordNode extends NodeBase<
  {},
  { name: string, tonic: string },
  { notes: string[], intervals: string[] }
> {
  static +displayName = 'Music Chord';
  static +registryName = 'ChordNode';
  static description = (<span>A Chord</span>);
  static schema = {
    input: {
      tonic: Types.string.desc(
        'The tonic for this scale, e.g. "C" or "Ab4". ' +
          'You can optionally specify the chord name here too, and omit the name input, e.g. "E Maj7"' +
          ' See the name param info for recognized chord names.'
      ),
      name: TT.Chord.desc('The name of the chord. Check type for possible values'),
    },
    output: {
      notes: arrayOf(TT.Note).desc('The notes in this chord'),
      intervals: arrayOf(TT.Interval).desc('The intervals between notes in this chord'),
    },
    state: {},
  };

  process = () => {
    if (!get(this.props, 'tonic')) {
      return { notes: [], intervals: [] };
    }
    const c = Chord.getChord(this.props.name, this.props.tonic);
    return {
      notes: c.notes,
      intervals: c.intervals,
    };
  };

  onInputChange = () => this.outKeys();
}

export class KeyTriadsNode extends NodeBase<{}, { key: string }, { notes: string[] }> {
  static +displayName = 'Key Triads';
  static +registryName = 'KeyTriadsNode';
  static description = (<span>Triads For a Key</span>);
  static schema = {
    input: {
      key: Types.string.desc('The name of the key (a tonic + a mode), e.g. C major, Db dorian'),
    },
    output: {
      notes: arrayOf(TT.Note).desc('Triad lead-sheet symbols for this key'),
    },
    state: {},
  };

  process = () => {
    if (!get(this.props, 'key')) {
      return { notes: [] };
    }
    return { notes: Key.triads(this.props.key) };
  };

  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}

export class ChordDetectNode extends NodeBase<{}, { notes: string[] }, { chords: string[] }> {
  static +displayName = 'Chord Detect';
  static +registryName = 'ChordDetectNode';
  static description = (<span>Given a list of notes, get possible chord names.</span>);
  static schema = {
    input: {
      notes: arrayOf(TT.Note).desc('List of input notes'),
    },
    output: {
      chords: arrayOf(TT.Chord).desc('Possible chord names'),
    },
    state: {},
  };

  process = () => {
    if (!get(this.props, 'notes')) {
      return { chords: [] };
    }
    return { chords: Chord.detect(this.props.notes) };
  };

  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}

export class TransposeNode extends NodeBase<
  {},
  { note: string, interval: string },
  { out: ?string }
> {
  static +displayName = 'Transpose';
  static +registryName = 'TransposeNode';
  static description = (
    <span>Transpose a note by an interval. e.g. transpose(A4, M3) -> C#5 </span>
  );
  static schema = {
    input: {
      note: Types.string.desc(
        'The note to transpose. This can be abstract or a concrete pitch, i.e. C or C4'
      ),
      interval: Types.string.desc('The interval to transpose by, e.g. P5 or M3'),
    },
    output: { out: Types.string.desc('The note, transposed by the interval') },
    state: {},
  };

  process = () => {
    if (this.props.note && this.props.interval) {
      return { out: transpose(this.props.note, this.props.interval) };
    }
    return { out: undefined };
  };

  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}

export class ChromaNode extends NodeBase<{}, { notes: string[] }, { chroma: number[] }> {
  static +displayName = 'Scale Chroma';
  static +registryName = 'ChromaNode';
  static description = (
    <span>
      A chroma representation of a pitchset as a 12-digit binary array, with each index presenting
      one semitone of the octave
    </span>
  );
  static schema = {
    input: {
      notes: arrayOf(TT.Note).desc('A list of notes to compute a chroma for'),
    },
    output: {
      chroma: arrayOf(Types.number).desc(
        'the chroma output: 12-digit binary array, with each index presenting one semitone of the octave'
      ),
    },
    state: {},
  };

  process = () => {
    if (!get(this.props, 'notes') || !Array.isArray(this.props.notes)) {
      return { chroma: [] };
    }
    return {
      chroma: chroma(this.props.notes)
        .split('')
        .map((s) => parseInt(s)),
    };
  };

  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}
