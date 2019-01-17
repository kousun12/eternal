// @flow
import React from 'react';
import { get } from 'lodash';
import { Chord, Scale } from 'tonal';
import { chroma } from 'tonal-pcset';
import { transpose } from 'tonal-distance';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
const Types = window.Types;

export class ScaleNode extends NodeBase<
  {},
  { name: string, tonic: string },
  { notes: string[], intervals: string[] }
> {
  static +displayName = 'Music Scale';
  static +registryName = 'ScaleNode';
  static description = <span>A Musical scale</span>;
  static schema = {
    input: {
      tonic: Types.string.desc(
        'The tonic for this scale, e.g. "C" or "Ab4". ' +
          'You can optionally specify the scale name here too, and omit the name input, e.g. "C minor pentatonic"' +
          ' See the name param info for possible scale names.'
      ),
      name: Types.string.desc(
        <dirom>
          <p>The name of the scale. Possible values:</p>
          <p>
            <code>{Scale.names().join(', ')}</code>
          </p>
        </dirom>
      ),
    },
    output: {
      notes: Types.object.desc('The notes in this scale'),
      intervals: Types.object.desc('The intervals between notes in this scale'),
    },
    state: {},
  };

  process = () => {
    if (!get(this.props, 'tonic')) {
      return { notes: [], intervals: [] };
    }
    return {
      notes: Scale.notes(this.props.tonic, this.props.name),
      intervals: Scale.intervals(this.props.name || this.props.tonic),
    };
  };

  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}

export class ChordNode extends NodeBase<
  {},
  { name: string, tonic: string },
  { notes: string[], intervals: string[] }
> {
  static +displayName = 'Music Chord';
  static +registryName = 'ChordNode';
  static description = <span>A Chord</span>;
  static schema = {
    input: {
      tonic: Types.string.desc(
        'The tonic for this scale, e.g. "C" or "Ab4". ' +
          'You can optionally specify the chord name here too, and omit the name input, e.g. "EMaj7"' +
          ' See the name param info for recognized chord names.'
      ),
      name: Types.string.desc(
        <dirom>
          <p>The name of the chord. Recognized names:</p>
          <p>
            <code>{Chord.names().join(', ')}</code>
          </p>
        </dirom>
      ),
    },
    output: {
      notes: Types.object.desc('The notes in this chord'),
      intervals: Types.object.desc('The intervals between notes in this chord'),
    },
    state: {},
  };

  process = () => {
    if (!get(this.props, 'tonic')) {
      return { notes: [], intervals: [] };
    }
    return {
      notes: Chord.notes(this.props.tonic, this.props.name),
      intervals: Chord.intervals(this.props.name || this.props.tonic),
    };
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
  static description = <span>Transpose a note by an interval. e.g. transpose(A4, M3) -> C#5 </span>;
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
      notes: Types.object.desc('A list of notes to compute a chroma for'),
    },
    output: {
      chroma: Types.object.desc(
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
