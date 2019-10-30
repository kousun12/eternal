// @flow
import React from 'react';
import { compact, zipObject } from 'lodash';
import Tone from 'tone';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import Performance from 'performance';
import { TT as ToneTypes } from 'models/nodes/ToneNode';
import type { MidiData, ToneAction } from 'performance';
import * as tf from '@tensorflow/tfjs-core';
import type { Scalar, Tensor1D, Tensor2D, TensorLike, LSTMCellFunc } from '@tensorflow/tfjs-core';
const Piano = require('tone-piano').Piano;
const Types = window.Types;

export const TT = {
  HistType: Types.any.aliased(
    'PitchHistogram',
    <div>
      <p>
        A scale represented as a distribution of pitch classes. Valid inputs are either an array of
        numbers (len 12), or a single string of len 12 that describes relative semitone
        distributions (ranged 0-9). 0-indexed at C.
      </p>
      <p>
        e.g. <code>F Major</code> could be either array:{' '}
        <code>[1, 0, 1, 0, 1, 2, 0, 1, 0, 1, 1, 0]</code> or string:
        <code>"101012010110"</code>
      </p>
    </div>
  ),
  Tensor: Types.object.aliased('Tensor', 'n-dimensional tensor'),
  ToneData: Types.object.aliased('ToneData', 'Directives for an instrument / synth to play.'),
  MidiData: Types.object.aliased(
    'MidiData',
    'Midi signal. Usually a note, action, velocity, and channel information'
  ),
};
export type ToneData = [Tone.Frequency, ToneAction, Tone.Time, ?number];

export class PerformanceRNNNode extends NodeBase<
  {},
  {
    density: number,
    synth: Tone.Synth | Tone.Instrument,
    stepsPerSecond: number,
  },
  {
    midiData: [MidiData, number],
    toneData: ToneData,
  }
> {
  static +displayName = 'Music RNN';
  static +registryName = 'PerformanceRNNNode';
  static defaultProps = { stepsPerSecond: 100 };
  static description = (
    <span>Sample an RNN model trained on the Yamaha e-Piano Competition dataset</span>
  );
  static schema = {
    input: {
      scale: TT.HistType.desc(
        'This pitch distribution will be used as a tonic to condition this model'
      ),
      density: Types.number.desc(
        'A density conditioning variable between 0-6 that serves as a directive for how many notes will be generated per step, in exponential scale. i.e. notes generated per step will be 2^density'
      ),
      stepsPerSecond: Types.number.desc(
        'number of steps per second. effectively a tempo measure for note generation / playback'
      ),
      synth: ToneTypes.Synth.desc(
        'Optionally attach a synth to this node and trigger its attack / release'
      ),
      midiOut: Types.object
        .aliased('MidiOut', 'A connected MIDI output')
        .desc('Optionally attach a midi output to this node and send midi signals to that device'),
    },
    output: {
      midiData: Types.object.desc('midi data out'),
      toneData: TT.ToneData.desc('tone out node'),
    },
    state: {},
  };
  static shortNames = { stepsPerSecond: 'steps/s' };
  performance: Performance;
  toneOut: ToneData;
  midiOut: [MidiData, number];
  started: boolean = false;
  _map = {};
  _midiMap = {};

  static play(data: ToneData, synth: Tone.Synth | Tone.Instrument | Piano) {
    const [note, action, time, velocity] = data;
    switch (action) {
      case 'attack':
        if (synth instanceof Piano) {
          try {
            synth.keyUp(note.toMidi(), time, velocity);
          } catch (e) {
            console.warn(e);
          }
        } else {
          synth.triggerAttack(note, time, velocity);
        }
        break;
      case 'release':
        if (synth instanceof Piano) {
          synth.keyDown(note.toMidi(), time, velocity);
        } else {
          synth.triggerRelease(note, time, velocity);
        }
        break;
      case 'attackRelease':
        synth.triggerAttackRelease(note, '4n', time, velocity);
        break;
      default:
        break;
    }
  }

  onAddToGraph = () => {
    this.performance = new Performance();
    this.performance.toneListener = (
      note: Tone.Frequency,
      action: ToneAction,
      time: Tone.Time,
      normalizedVelocity?: number
    ) => {
      this.toneOut = [note, action, time, normalizedVelocity];
      this.notifyOutputs(['toneData'], true);
      this._getSynths().forEach(synth => PerformanceRNNNode.play(this.toneOut, synth));
    };
    this.performance.midiListener = (midiData, time) => {
      this.midiOut = [midiData, time];
      this.notifyOutputs(['midiData'], true);
      this._getMidiDevices().forEach(device => {
        device.send(midiData, time);
      });
    };
  };

  willBeRemoved = () => {
    this.performance.toneListener = null;
    this.performance.midiListener = null;
    this.performance.cleanup();
    // $FlowIssue
    this.performance = null;
  };

  _getSynths = () => {
    return compact(this.inputs.map(e => this._map[e.id]));
  };

  _getMidiDevices = () => {
    return compact(this.inputs.map(e => this._midiMap[e.id]));
  };

  _startModel = () => {
    this.setLoading(true);
    this.performance.start(() => this.setLoading(false));
    this.started = true;
  };

  beforeConnectOut = () => {
    if (!this.started) this._startModel();
  };

  beforeConnectIn = (e: Edge) => {
    if (!this.started && e.toPort === 'synth') this._startModel();
    if (!this.started && e.toPort === 'midiOut') this._startModel();
  };

  _compareHistograms = (hist: string | number[], other: string | number[]): boolean => {
    const canon1 = Array.isArray(hist) ? hist.join('') : hist;
    const canon2 = Array.isArray(other) ? other.join('') : other;
    return canon1 === canon2;
  };

  _histForPerformance = (hist: string | any[]): number[] => {
    if (Array.isArray(hist)) {
      return hist.map(a => parseInt(a));
    } else if (typeof hist === 'string') {
      return hist.split('').map(s => parseInt(s));
    }
    throw new Error('cannot parse histogram');
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (!prevProps || (newProps.density !== undefined && newProps.density !== prevProps.density)) {
      this.performance.noteDensityBucket = newProps.density;
      this.performance.refreshConditioning();
    }
    if (
      !prevProps ||
      (newProps.stepsPerSecond !== undefined &&
        newProps.stepsPerSecond !== prevProps.stepsPerSecond)
    ) {
      this.performance.stepsPerSecond = newProps.stepsPerSecond;
      this.performance.refreshConditioning();
    }
    if (
      !prevProps ||
      (newProps.scale !== undefined && !this._compareHistograms(newProps.scale, prevProps.scale))
    ) {
      this.performance.pitchHistArray = this._histForPerformance(newProps.scale);
      this.performance.refreshConditioning();
    }
  };

  onInputChange = (edge: Edge, change: Object) => {
    if (edge.toPort === 'synth') {
      const s = edge.inDataFor(change);
      if (s) this._map[edge.id] = s;
    }
    if (edge.toPort === 'midiOut') {
      const s = edge.inDataFor(change);
      if (s) this._midiMap[edge.id] = s;
    }
    // do not notify on input changes
    return [];
  };

  process = () => ({ midiData: this.midiOut, toneData: this.toneOut });
}

export class LSTMCellNode extends NodeBase<
  {},
  {
    forgetBias: Scalar | TensorLike,
    lstmKernel: Tensor2D | TensorLike,
    lstmBias: Tensor1D | TensorLike,
    data: Tensor2D | TensorLike,
    c: Tensor2D | TensorLike,
    h: Tensor2D | TensorLike,
  },
  { newC: Tensor2D, newH: Tensor2D }
> {
  static +displayName = 'LSTM Cell';
  static +registryName = 'LSTMCell';
  static description = <span>Computes the next state and output of a BasicLSTMCell</span>;
  static schema = {
    input: {
      forgetBias: TT.Tensor.desc('Forget bias for the cell'),
      lstmKernel: TT.Tensor.desc('The weights for the cell'),
      lstmBias: TT.Tensor.desc('The bias for the cell'),
      data: TT.Tensor.desc('The input to the cell'),
      c: TT.Tensor.desc('Previous cell state'),
      h: TT.Tensor.desc('Previous cell output'),
    },
    output: {
      newC: TT.Tensor.desc('Next cell state'),
      newH: TT.Tensor.desc('Next cell output'),
    },
    state: {},
  };

  requireForOutput = () =>
    [
      this.props.forgetBias,
      this.props.lstmKernel,
      this.props.lstmBias,
      this.props.data,
      this.props.c,
      this.props.h,
    ]
      .map(v => typeof v)
      .filter(t => t === 'undefined').length === 0;

  process = () =>
    zipObject(
      ['newC', 'newH'],
      tf.basicLSTMCell(
        this.props.forgetBias,
        this.props.lstmKernel,
        this.props.lstmBias,
        this.props.data,
        this.props.c,
        this.props.h
      )
    );

  onInputChange = () => this.outKeys();
}

export class MultiRNNCellNode extends NodeBase<
  {},
  {
    lstmCells: LSTMCellFunc[],
    data: Tensor2D | TensorLike,
    c: Array<Tensor2D | TensorLike>,
    h: Array<Tensor2D | TensorLike>,
  },
  { newC: Tensor2D[], newH: Tensor2D[] }
> {
  static +displayName = 'MultiRNN Cell';
  static +registryName = 'MultiRNNCell';
  static description = <span>Computes the next states and outputs of a stack of LSTMCells.</span>;
  static schema = {
    input: {
      lstmCells: TT.Tensor.desc('The weights for the cell'),
      data: TT.Tensor.desc('The input to the cell'),
      c: TT.Tensor.desc('Previous cell state'),
      h: TT.Tensor.desc('Previous cell output'),
    },
    output: {
      newC: TT.Tensor.desc('Next cell state'),
      newH: TT.Tensor.desc('Next cell output'),
    },
    state: {},
  };

  requireForOutput = () =>
    [this.props.lstmCells, this.props.data, this.props.c, this.props.h]
      .map(v => typeof v)
      .filter(t => t === 'undefined').length === 0;

  process = () =>
    zipObject(
      ['newC', 'newH'],
      tf.multiRNNCell(this.props.lstmCells, this.props.data, this.props.c, this.props.h)
    );

  onInputChange = () => this.outKeys();
}
