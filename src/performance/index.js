// @flow
import * as tf from '@tensorflow/tfjs-core';
import Tone from 'tone';
import 'regenerator-runtime/runtime';

const STEPS_PER_GENERATE_CALL = 10;
const GENERATION_BUFFER_SECONDS = 0.5;
const MAX_GENERATION_LAG_SECONDS = 1;
const MAX_NOTE_DURATION_SECONDS = 3;

const NOTES_PER_OCTAVE = 12;
const DENSITY_BIN_RANGES = [1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0];
const PITCH_HISTOGRAM_SIZE = NOTES_PER_OCTAVE;
const RESET_RNN_FREQUENCY_MS = 20000;
const MIN_MIDI_PITCH = 0;
const MAX_MIDI_PITCH = 127;
const VELOCITY_BINS = 32;
const MAX_SHIFT_STEPS = 100;
const STEPS_PER_SECOND = 100;

export const MIDI_EVENT_ON = 0x90;
export const MIDI_EVENT_OFF = 0x80;
const EVENT_RANGES = [
  ['note_on', MIN_MIDI_PITCH, MAX_MIDI_PITCH],
  ['note_off', MIN_MIDI_PITCH, MAX_MIDI_PITCH],
  ['time_shift', 1, MAX_SHIFT_STEPS],
  ['velocity_change', 1, VELOCITY_BINS],
];
const GAIN = 80;

const calculateEventSize = () => {
  let eventOffset = 0;
  for (const eventRange of EVENT_RANGES) {
    const minValue = eventRange[1];
    const maxValue = eventRange[2];
    eventOffset += maxValue - minValue + 1;
  }
  return eventOffset;
};
const URL_BASE = process.env.PUBLIC_URL || ''

const EVENT_SIZE = calculateEventSize();
const PRIMER_IDX = 355;
const CHECKPOINT_URL = URL_BASE + '/latent/performance';

export const pentatonic = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
export const cMajor = [2, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
export const fMajor = [1, 0, 1, 0, 1, 2, 0, 1, 0, 1, 1, 0];
export const dMinor = [1, 0, 2, 0, 1, 1, 0, 1, 0, 1, 1, 0];

const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const map = {};
for (let i = 0; i < 128; i++) {
  map[i] = notes[i % 12];
}

export type ToneAction = 'attack' | 'release' | 'attackRelease';
// [event, note, velocity]
export type MidiData = [number, number, number];

export default class Performance {
  // midi num -> velocity
  velocityMapListener: ?(Map<number, number>) => void = null;
  midiListener: ?(midiData: MidiData, time: number) => void = null;
  toneListener: ?(
    note: Tone.Frequency,
    action: ToneAction,
    time: Tone.Time,
    normalizedVelocity?: number
  ) => void = null;
  velocityMapListener: (Map<number, number>) => void;
  activeVelocities = new Map<number, number>();
  activeNotes = new Map<number, number>();
  forgetBias = tf.scalar(1.0);

  lstmKernel1: tf.Tensor2D;
  lstmBias1: tf.Tensor1D;
  lstmKernel2: tf.Tensor2D;
  lstmBias2: tf.Tensor1D;
  lstmKernel3: tf.Tensor2D;
  lstmBias3: tf.Tensor1D;
  c: tf.Tensor2D[];
  h: tf.Tensor2D[];
  fcB: tf.Tensor1D;
  fcW: tf.Tensor2D;
  pitchHistArray: number[] = pentatonic;
  pitchHistogram: tf.Tensor1D;
  noteDensityBucket: number = 0;
  noteDensityEncoding: tf.Tensor1D;
  currentTime = 0;
  startTime = 0;
  currentVelocity = 100;
  currentLoopId = 0;
  lastSample = tf.scalar(PRIMER_IDX, 'int32');
  initialized = false;
  modelReady = false;
  intervalId: ?TimeoutID;
  generationInterval: ?TimeoutID;
  stopped = false;

  constructor() {}

  start = () => {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    fetch(`${CHECKPOINT_URL}/weights_manifest.json`)
      .then(response => response.json())
      .then((manifest: tf.WeightsManifestConfig) => tf.io.loadWeights(manifest, CHECKPOINT_URL))
      .then((vars: { [varName: string]: tf.Tensor }) => {
        this.lstmKernel1 = vars['rnn/multi_rnn_cell/cell_0/basic_lstm_cell/kernel'];
        this.lstmBias1 = vars['rnn/multi_rnn_cell/cell_0/basic_lstm_cell/bias'];
        this.lstmKernel2 = vars['rnn/multi_rnn_cell/cell_1/basic_lstm_cell/kernel'];
        this.lstmBias2 = vars['rnn/multi_rnn_cell/cell_1/basic_lstm_cell/bias'];
        this.lstmKernel3 = vars['rnn/multi_rnn_cell/cell_2/basic_lstm_cell/kernel'];
        this.lstmBias3 = vars['rnn/multi_rnn_cell/cell_2/basic_lstm_cell/bias'];
        this.fcB = vars['fully_connected/biases'];
        this.fcW = vars['fully_connected/weights'];
        this.modelReady = true;
        this.resetRnn();
      })
      .then(() => {
        setTimeout(this.resetRnnRepeatedly, RESET_RNN_FREQUENCY_MS);
      });
    this.refreshConditioning();
  };

  cleanup = () => {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
    if (this.generationInterval) {
      clearTimeout(this.generationInterval);
    }
    this.stopped = true;
  };

  refreshConditioning = () => {
    if (this.noteDensityEncoding != null) {
      this.noteDensityEncoding.dispose();
      this.noteDensityEncoding = null;
    }
    this.noteDensityEncoding = tf
      .oneHot(tf.tensor1d([this.noteDensityBucket], 'int32'), DENSITY_BIN_RANGES.length + 1)
      .as1D();
    if (this.pitchHistogram != null) {
      this.pitchHistogram.dispose();
      this.pitchHistogram = null;
    }
    const buffer = tf.buffer([PITCH_HISTOGRAM_SIZE], 'float32');
    const pitchHistogramTotal = this.pitchHistArray.reduce((prev, val) => prev + val, 0);
    for (let i = 0; i < PITCH_HISTOGRAM_SIZE; i++) {
      buffer.set(this.pitchHistArray[i] / pitchHistogramTotal, i);
    }
    this.pitchHistogram = buffer.toTensor();
  };

  resetRnn = () => {
    this.c = [
      tf.zeros([1, this.lstmBias1.shape[0] / 4]),
      tf.zeros([1, this.lstmBias2.shape[0] / 4]),
      tf.zeros([1, this.lstmBias3.shape[0] / 4]),
    ];
    this.h = [
      tf.zeros([1, this.lstmBias1.shape[0] / 4]),
      tf.zeros([1, this.lstmBias2.shape[0] / 4]),
      tf.zeros([1, this.lstmBias3.shape[0] / 4]),
    ];
    if (this.lastSample != null) {
      this.lastSample.dispose();
    }
    this.lastSample = tf.scalar(PRIMER_IDX, 'int32');
    this.currentTime = Tone.now();
    this.startTime = performance.now() - this.currentTime * 1000;
    this.currentLoopId++;
    // todo await
    this.generateStep(this.currentLoopId);
  };

  getConditioning = () => {
    return tf.tidy(() => {
      const axis = 0;
      const conditioning = this.noteDensityEncoding.concat(this.pitchHistogram, axis);
      return tf.tensor1d([0], 'int32').concat(conditioning, axis);
    });
  };

  getOutputs = () => {
    const lstm1 = (data, c, h) =>
      tf.basicLSTMCell(this.forgetBias, this.lstmKernel1, this.lstmBias1, data, c, h);
    const lstm2 = (data, c, h) =>
      tf.basicLSTMCell(this.forgetBias, this.lstmKernel2, this.lstmBias2, data, c, h);
    const lstm3 = (data, c, h) =>
      tf.basicLSTMCell(this.forgetBias, this.lstmKernel3, this.lstmBias3, data, c, h);

    const [_c, _h, outputs] = tf.tidy(() => {
      // Generate some notes.
      const innerOuts: tf.Scalar[] = [];
      for (let i = 0; i < STEPS_PER_GENERATE_CALL; i++) {
        // Use last sampled output as the next input.
        const eventInput = tf.oneHot(this.lastSample.as1D(), EVENT_SIZE).as1D();
        // Dispose the last sample from the previous generate call, since we
        // kept it.
        if (i === 0) {
          this.lastSample.dispose();
        }
        const conditioning = this.getConditioning();
        const axis = 0;
        const input = conditioning.concat(eventInput, axis).toFloat();
        const output = tf.multiRNNCell([lstm1, lstm2, lstm3], input.as2D(1, -1), this.c, this.h);
        this.c.forEach(c => c.dispose());
        this.h.forEach(h => h.dispose());
        this.c = output[0];
        this.h = output[1];
        const outputH = this.h[2];
        const logits = outputH.matMul(this.fcW).add(this.fcB);
        const sampledOutput = tf.multinomial(logits.as1D(), 1).asScalar();
        innerOuts.push(sampledOutput);
        this.lastSample = sampledOutput;
      }
      return [this.c, this.h, innerOuts];
    });
    this.c = _c;
    this.h = _h;
    return outputs;
  };

  generateStep = async (loopId: number) => {
    if (loopId < this.currentLoopId) return;
    const outputs = this.getOutputs();
    for (let i = 0; i < outputs.length; i++) {
      this.playOutput(outputs[i].dataSync()[0]);
    }
    if (Tone.now() - this.currentTime > MAX_GENERATION_LAG_SECONDS) {
      this.currentTime = Tone.now();
    }
    const delta = Math.max(0, this.currentTime - Tone.now() - GENERATION_BUFFER_SECONDS);
    this.generationInterval = setTimeout(() => this.generateStep(loopId), delta * 1000);
  };

  playOutput = (index: number) => {
    if (this.stopped) return;
    let offset = 0;
    for (const eventRange of EVENT_RANGES) {
      const eventType = eventRange[0];
      const minValue = eventRange[1];
      const maxValue = eventRange[2];
      if (offset <= index && index <= offset + maxValue - minValue) {
        if (eventType === 'note_on') {
          const noteNum = index - offset;
          this.activeNotes.set(noteNum, this.currentTime);
          this.activeVelocities.set(noteNum, this.currentVelocity * GAIN);
          this.velocityMapListener && this.velocityMapListener(this.activeVelocities);
          this.midiListener &&
            // $FlowIssue - not sure
            this.midiListener(
              [MIDI_EVENT_ON, noteNum, this.currentVelocity * GAIN],
              Math.floor(1000 * this.currentTime) - this.startTime
            );
          this.toneListener &&
            // $FlowIssue - not sure
            this.toneListener(
              Tone.Frequency(noteNum, 'midi'),
              'attack',
              this.currentTime,
              (this.currentVelocity * GAIN) / 100
            );
          return;
        } else if (eventType === 'note_off') {
          const noteNum = index - offset;
          const activeNoteEndTimeSec = this.activeNotes.get(noteNum);
          if (activeNoteEndTimeSec === null || activeNoteEndTimeSec === undefined) {
            return;
          }
          const timeSec = Math.max(this.currentTime, activeNoteEndTimeSec + 0.5);
          this.midiListener &&
            // $FlowIssue - not sure
            this.midiListener(
              [MIDI_EVENT_OFF, noteNum, this.currentVelocity * GAIN],
              Math.floor(timeSec * 1000) - this.startTime
            );
          this.toneListener &&
            // $FlowIssue - not sure
            this.toneListener(
              Tone.Frequency(noteNum, 'midi'),
              'release',
              this.currentTime,
              (this.currentVelocity * GAIN) / 100
            );
          this.activeNotes.delete(noteNum);
          this.activeVelocities.delete(noteNum);
          this.velocityMapListener && this.velocityMapListener(this.activeVelocities);
          return;
        } else if (eventType === 'time_shift') {
          this.currentTime += (index - offset + 1) / STEPS_PER_SECOND;
          this.activeNotes.forEach((timeSec, noteNum) => {
            if (this.currentTime - timeSec > MAX_NOTE_DURATION_SECONDS) {
              this.midiListener &&
                // $FlowIssue - not sure
                this.midiListener([MIDI_EVENT_OFF, noteNum, this.currentVelocity * GAIN]);
              this.toneListener &&
                // $FlowIssue - not sure
                this.toneListener(Tone.Frequency(noteNum, 'midi'), 'release', this.currentTime);
              this.activeNotes.delete(noteNum);
              this.activeVelocities.delete(noteNum);
              this.velocityMapListener && this.velocityMapListener(this.activeVelocities);
            }
          });
          return this.currentTime;
        } else if (eventType === 'velocity_change') {
          this.currentVelocity = (index - offset + 1) * Math.ceil(127 / VELOCITY_BINS);
          this.currentVelocity = this.currentVelocity / 127;
          return this.currentVelocity;
        } else {
          throw new Error('Could not decode eventType: ' + eventType);
        }
      }
      offset += maxValue - minValue + 1;
    }
    throw new Error(`Could not decode index: ${index}`);
  };
  resetRnnRepeatedly = () => {
    if (this.stopped) return;
    if (this.modelReady) this.resetRnn();
    this.intervalId = setTimeout(this.resetRnnRepeatedly, RESET_RNN_FREQUENCY_MS);
  };
}
