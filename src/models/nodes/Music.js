// @flow
import React from 'react';
import { get } from 'lodash';
import * as Key from 'tonal-key';
import { transpose } from 'tonal-distance';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import { arrayOf } from 'utils/typeUtils';
import { chroma } from 'tonal-pcset';
import { Chord, ChordType, Scale, Note } from 'tonal';
import Tuning from '../../utils/tuning';

const Types = window.Types;
// window.Chord = Chord;
// window.ChordType = ChordType;
// window.Key = Key;
// window.Scale = Scale;
window.Note = Note;

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
        {Scale.names().map(n => (
          <span style={{ marginRight: 4, marginBottom: 6 }} key={n}>
            <code>{n}</code>{' '}
          </span>
        ))}
      </p>
    </div>
  ),
  TuningSystem: Types.object.aliased('TuningSystem', 'A tuning system'),
  Chord: Types.string.aliased(
    'ChordName',
    <div>
      <p>One of:</p>
      <p style={{ display: 'flex', flexWrap: 'wrap' }}>
        {ChordType.symbols().map(n => (
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
    const str = [this.props.tonic, this.props.name].filter(a => a).join(' ');
    const s = Scale.get(str);
    return {
      notes: s.notes,
      intervals: s.intervals,
    };
  };

  onInputChange = () => this.outKeys();
}

export class NoteNode extends NodeBase<
  {},
  { name: string },
  { chroma: number, frequency: number, octave: number }
> {
  static +displayName = 'Note';
  static +registryName = 'NoteNode';
  static description = (<span>A Musical note</span>);
  static schema = {
    input: {
      name: Types.string.desc('The name of the note. e.g. A or Gb4'),
    },
    output: {
      chroma: Types.number.desc('Chroma index of this note, normalized on C'),
      frequency: Types.number.desc('Frequency of this note'),
      octave: Types.number.desc('Octave of this note'),
    },
    state: {},
  };

  process = () => {
    if (!get(this.props, 'name')) {
      return { chroma: 0, frequency: 0, octave: 0 };
    }
    const s = Note.get(this.props.name);
    return {
      chroma: s.chroma,
      frequency: s.freq,
      octave: s.oct,
    };
  };

  onInputChange = () => this.outKeys();
}

export class TuningNode extends NodeBase<
  {},
  { scale: string[], tonic?: string[] | string },
  { frequencies: number[], tuning: Tuning | null }
> {
  static +displayName = 'Tuning';
  static +registryName = 'TuningNode';
  static description = (<span>A tuning system</span>);
  static schema = {
    input: {
      scale: arrayOf(Types.string).desc(
        'A list of either ratios or cents, omitting the tonic, and including the octave (i.e. .scl format lines)'
      ),
      tonic: Types.string.desc(
        'Either a raw value in Hz, or a tuple pinning a scale degree to a frequency, e.g. [440, 6]'
      ),
    },
    output: {
      frequencies: arrayOf(Types.number).desc('Frequencies of the scale, beginning at the tonic'),
      tuning: TT.TuningSystem.desc(
        'The output tuning system for use in e.g. Tuning Frequency node'
      ),
    },
    state: {},
  };

  process = () => {
    if (!get(this.props, 'scale')) {
      return { frequencies: [], tuning: null };
    }
    const t = new Tuning(this.props.scale, this.props.tonic);
    return {
      frequencies: t.frequencies(),
      tuning: t,
    };
  };

  onInputChange = () => this.outKeys();
}

export class TuningFrequencyNode extends NodeBase<
  {},
  { tuning: Tuning, degree: number, octaveOffset?: number },
  { frequency: number }
> {
  static +displayName = 'Tuning Frequency';
  static +registryName = 'TuningFrequencyNode';
  static description = (
    <span>Given a Tuning system, compute a frequency for a scale degree and octave offset</span>
  );
  static schema = {
    input: {
      tuning: TT.TuningSystem.desc('The input Tuning system, as given by a Tuning node'),
      degree: Types.number.desc('The scale degree to get a frequency for, zero-indexed'),
      octaveOffset: Types.number.desc(
        'The octave offset from the tuning system tonic for the scale degree, optional.'
      ),
    },
    output: {
      frequency: Types.number.desc('Frequency of the scale degree, given the tuning system'),
    },
    state: {},
  };

  process = () => {
    if (!get(this.props, 'tuning') || typeof get(this.props, 'degree') !== 'number') {
      return { frequency: 0 };
    }
    const t = this.props.tuning;
    return {
      frequency: t.frequency(this.props.degree, this.props.octaveOffset),
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
        .map(s => parseInt(s)),
    };
  };

  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}
