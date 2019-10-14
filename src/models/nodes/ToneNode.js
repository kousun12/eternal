// @flow
import React from 'react';
import { get } from 'lodash';
import Tone from 'tone';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import { arrayOf } from 'utils/typeUtils';
const Piano = require('tone-piano').Piano;
const Types = window.Types;
const URL_BASE = process.env.PUBLIC_URL || '';

// Tone Types
export const TT = {
  AudioNode: Types.object.aliased('AudioNode', 'Any kind of audio node'),
  Config: Types.object.aliased('Config'),
  Synth: Types.object.aliased('Synth', 'Any kind of synth'),
  Signal: Types.object.aliased('Signal', 'An audio signal, like volume, pan, frequency, etc.'),
  Panner: Types.object.aliased('Panner', 'An audio pan'),
  Gain: Types.object.aliased('Gain', 'An audio gain'),
  FeedbackDelay: Types.object.aliased('FeedbackDelay', 'A feedback delay'),
  Note: Types.string.aliased(
    'Note',
    'Note encoding, can be something like A4, a midi index, or a raw frequency in Hz'
  ),
  Call: Types.any
    .aliased('Call', 'Something that is callable')
    .desc(
      "Certain nodes are designated 'callable', i.e. they are operator nodes. Sending a truthy call signal will invoke that node's handler over its parameters"
    ),
};

export class ContextDestinationNode extends NodeBase<{}, {}, { node: Tone.AudioNode }> {
  static +displayName = 'Context Destination';
  static +registryName = 'ContextDestinationNode';
  static description = <span>The current context destination</span>;
  static schema = {
    input: {},
    output: { node: TT.AudioNode.desc('The current context destination node') },
    state: {},
  };

  process = () => ({ node: Tone.context.destination });
}

export class ConnectNode extends NodeBase<
  {},
  { from: Tone.AudioNode, to: Tone.AudioNode },
  { from: Tone.AudioNode, to: Tone.AudioNode }
> {
  static +displayName = 'Connect';
  static +registryName = 'ConnectNode';
  static description = <span>Connect one audio node to another</span>;
  static schema = {
    input: {
      from: TT.AudioNode.desc('Connect from any audio node'),
      to: TT.AudioNode.desc('Connect to any audio node'),
    },
    output: {
      from: TT.AudioNode.desc('The same node, connected'),
      to: TT.AudioNode.desc('The same node, connected'),
    },
    state: {},
  };

  willBecomeLive = () => {
    const { from, to } = this.props;
    logConnect(from, to);
    from.connect(to);
  };

  beforeDisconnectIn: Edge => void = edge => {
    const name = edge.toPort;
    if (name === 'from' || name === 'to') {
      const { from, to } = this.props;
      if (from && to) {
        from.disconnect(to);
      }
    }
  };

  process = () => this.props;
}

export class AudioMasterNode extends NodeBase<
  {},
  { node: Tone.AudioNode },
  { out: Tone.AudioNode }
> {
  static +displayName = 'Audio Master';
  static +registryName = 'AudioMasterNode';
  static description = <span>Connect an audio node to the master audio output</span>;
  static schema = {
    input: {
      node: TT.AudioNode.desc('Any Audio node to connect to the audio master output'),
    },
    output: { out: TT.AudioNode.desc('The same node, connected to the master output') },
    state: {},
  };
  _connectedTo: string = '';

  onInputChange = (edge: Edge, change: Object) => {
    if ('node' === edge.toPort && this._connectedTo !== edge.id) {
      edge.inDataFor(change).toMaster();
      return this.outKeys();
    }
    return [];
  };

  beforeDisconnectIn: Edge => void = edge => {
    const name = edge.toPort;
    if (name === 'node') {
      const { node } = this.props;
      if (node) {
        node.disconnect();
      }
    }
  };

  process = () => ({ out: this.props.node });
}

export class ToContextDestinationNode extends NodeBase<
  {},
  { node: Tone.AudioNode },
  { out: Tone.AudioNode }
> {
  static +displayName = 'To Context Dest.';
  static +registryName = 'ToContextDestinationNode';
  static description = <span>Connect an audio node to audio context destination</span>;
  static schema = {
    input: {
      node: TT.AudioNode.desc('Any Audio node to connect to the context destination'),
    },
    output: { out: TT.AudioNode.desc('The same node, connected to the context destination') },
    state: {},
  };
  _connectedTo: string = '';

  onInputChange = (edge: Edge, change: Object) => {
    if ('node' === edge.toPort && this._connectedTo !== edge.id) {
      Tone.connect(edge.inDataFor(change), Tone.context.destination);
      return this.outKeys();
    }
    return [];
  };

  beforeDisconnectIn: Edge => void = edge => {
    const name = edge.toPort;
    if (name === 'node') {
      const { node } = this.props;
      if (node) {
        node.disconnect();
      }
    }
  };

  process = () => ({ out: this.props.node });
}

export class PannerNode extends NodeBase<
  { panner: Tone.Panner, _connectedTo: ?string },
  { node: Tone.AudioNode, pan: number },
  { out: Tone.Panner, node: Tone.AudioNode }
> {
  static +displayName = 'Audio Panner';
  static +registryName = 'PannerNode';
  static description = <span>An equal power Left/Right stereo Panner</span>;
  static schema = {
    input: {
      node: TT.AudioNode.desc('The audio node to connect to this panner.'),
      pan: Types.number.desc('The pan control. -1 = hard left, 1 = hard right'),
    },
    output: {
      out: TT.Panner.desc('A node panned to the `pan` value'),
      node: TT.AudioNode.desc('The node that was passed in, connected to the panner'),
    },
    state: { panner: TT.Config.desc('The panner config') },
  };

  onAddToGraph = () => {
    this.state.panner = new Tone.Panner(0);
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (!prevProps || newProps.pan !== prevProps.pan) {
      this.pushToState('panner', { pan: newProps.pan }, [], ['pan', 'value']);
    }
  };

  /**
   * TODO: With this pattern I am concerned that we are being too magical and should
   * just include a connect(from, to) node for connections.
   */
  onInputChange = (edge: Edge, change: Object) => {
    if ('node' === edge.toPort && this.state._connectedTo !== edge.id) {
      logConnect(edge.inDataFor(change), this.state.panner);
      edge.inDataFor(change).connect(this.state.panner);
      return this.outKeys();
    }
    return [];
  };

  beforeDisconnectIn: Edge => void = edge => {
    const name = edge.toPort;
    if (name === 'node') {
      const { node } = this.props;
      if (node) {
        node.disconnect();
      }
    }
  };

  process = () => ({ out: this.state.panner, node: this.props.node });
}

export class VolumeNode extends NodeBase<
  { volume: Tone.Volume, _connectedTo: ?string },
  { node: Tone.AudioNode, volume: number },
  { out: Tone.Volume, node: Tone.AudioNode }
> {
  static +displayName = 'Audio Volume';
  static +registryName = 'VolumeNode';
  static description = <span>A simple volume node, useful for creating a volume fader.</span>;
  static schema = {
    input: {
      node: TT.AudioNode.desc('The audio node to connect to this Volume node.'),
      volume: Types.number.desc('The volume, in decibels'),
    },
    output: {
      out: Types.object.aliased('Volume').desc('The volume node'),
      node: TT.AudioNode.desc('The node that was passed in, connected to this volume node'),
    },
    state: { volume: TT.Config.desc('The volume node') },
  };
  static defaultProps = { volume: 0 };

  onAddToGraph = () => {
    this.state.volume = new Tone.Volume();
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    ['volume'].forEach(k => {
      if (!prevProps || newProps[k] !== prevProps[k]) {
        this.pushToState('volume', { [k]: newProps[k] }, [], [k, 'value']);
      }
    });
  };

  onInputChange = (edge: Edge, change: Object) => {
    if ('node' === edge.toPort && this.state._connectedTo !== edge.id) {
      logConnect(edge.inDataFor(change), this.state.volume);
      edge.inDataFor(change).connect(this.state.volume);
      return this.outKeys();
    }
    return [];
  };

  beforeDisconnectIn: Edge => void = edge => {
    const name = edge.toPort;
    if (name === 'node') {
      const { node } = this.props;
      if (node) {
        node.disconnect();
      }
    }
  };

  process = () => ({ out: this.state.volume, node: this.props.node });
}

export class CompressorNode extends NodeBase<
  { compressor: Tone.Compressor, _connectedTo: ?string },
  { node: Tone.AudioNode, threshold: number, ratio: number },
  { out: Tone.Compressor, node: Tone.AudioNode }
> {
  static +displayName = 'Audio Compressor';
  static +registryName = 'CompressorNode';
  static description = (
    <span>
      A node which compresses signals from its origin. Compression reduces the volume of loud sounds
      or amplifies quiet sounds by narrowing or "compressing" an audio signal's dynamic range.
    </span>
  );
  static schema = {
    input: {
      node: TT.AudioNode.desc('The audio node to connect to this compressor.'),
      threshold: Types.number.desc('The value above which the compression starts to be applied.'),
      ratio: Types.number.desc('The gain reduction ratio'),
    },
    output: {
      out: Types.object.aliased('Compressor').desc('The compressor node'),
      node: TT.AudioNode.desc('The node that was passed in, connected to the compressor'),
    },
    state: { compressor: TT.Config.desc('The compressor') },
  };

  onAddToGraph = () => {
    this.state.compressor = new Tone.Compressor();
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    ['threshold', 'ratio'].forEach(k => {
      if (!prevProps || newProps[k] !== prevProps[k]) {
        this.pushToState('compressor', { [k]: newProps[k] }, [], [k, 'value']);
      }
    });
  };

  onInputChange = (edge: Edge, change: Object) => {
    if ('node' === edge.toPort) {
      logConnect(edge.inDataFor(change), this.state.compressor);
      edge.inDataFor(change).connect(this.state.compressor);
      return this.outKeys();
    }
    return [];
  };

  beforeDisconnectIn: Edge => void = edge => {
    const name = edge.toPort;
    if (name === 'node') {
      const { node } = this.props;
      if (node) {
        node.disconnect();
      }
    }
  };

  process = () => ({ out: this.state.compressor, node: this.props.node });
}

export class ReverbNode extends NodeBase<
  { reverb: Tone.Freeverb, _connectedTo: ?string },
  { node: Tone.AudioNode, dampening: number, roomSize: number },
  { out: Tone.Freeverb, node: Tone.AudioNode }
> {
  static +displayName = 'Reverb';
  static +registryName = 'ReverbNode';
  static defaultState = { _connectedTo: null };
  static description = (
    <span>
      A <code>Reverb</code> based on Freeverb (https://ccrma.stanford.edu/~jos/pasp/Freeverb.html).
    </span>
  );
  static schema = {
    input: {
      node: TT.AudioNode.desc('The audio node to connect to this reverb node'),
      dampening: Types.time.desc('The amount of dampening of the reverberant signal'),
      roomSize: Types.number.desc(
        'The roomSize value between [0,1]. A larger roomSize will result in a longer decay'
      ),
    },
    output: {
      out: Types.object.aliased('Reverb').desc('The resulting Reverb Node'),
      node: TT.AudioNode.desc('The node that was passed in, connected to the reverb'),
    },
    state: {},
  };

  onAddToGraph = () => {
    this.state.reverb = new Tone.Freeverb();
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    ['dampening', 'roomSize'].forEach(k => {
      if (!prevProps || newProps[k] !== prevProps[k]) {
        this.pushToState('reverb', { [k]: newProps[k] }, [], [k, 'value']);
      }
    });
  };

  onInputChange = (edge: Edge, change: Object) => {
    if ('node' === edge.toPort && this.state._connectedTo !== edge.id) {
      logConnect(edge.inDataFor(change), this.state.reverb);
      edge.inDataFor(change).connect(this.state.reverb);
      return this.outKeys();
    }
    return [];
  };

  beforeDisconnectIn: Edge => void = edge => {
    const name = edge.toPort;
    if (name === 'node') {
      const { node } = this.props;
      if (node) {
        node.disconnect();
      }
    }
  };

  process = () => ({ out: this.state.reverb, node: this.props.node });
}

export class FeedbackDelayNode extends NodeBase<
  { feedbackDelay: Tone.FeedbackDelay, _connectedTo: ?string },
  { node: Tone.AudioNode, feedback: Tone.Time, delay: number },
  { out: Tone.FeedbackDelay, node: Tone.AudioNode }
> {
  static +displayName = 'Feedback Delay';
  static +registryName = 'FeedbackDelayNode';
  static defaultState = { _connectedTo: null };
  static description = (
    <span>
      A <code>DelayNode</code> in which part of output signal is fed back into the delay
    </span>
  );
  static schema = {
    input: {
      node: TT.AudioNode.desc('The audio node to connect to this feedback delay'),
      delayTime: Types.time.desc('The delay applied to the incoming signal'),
      feedback: Types.number.desc(
        'feedback The amount of the effected signal which is fed back through the delay.'
      ),
    },
    output: {
      out: TT.FeedbackDelay.desc('The resulting FeedbackDelayNode'),
      node: TT.AudioNode.desc('The node that was passed in, connected to the feedback delay'),
    },
    state: {},
  };

  onAddToGraph = () => {
    this.state.feedbackDelay = new Tone.FeedbackDelay('16n', 0.2);
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    ['delayTime', 'feedback'].forEach(k => {
      if (!prevProps || newProps[k] !== prevProps[k]) {
        this.pushToState('feedbackDelay', { [k]: newProps[k] }, [], [k, 'value']);
      }
    });
  };

  onInputChange = (edge: Edge, change: Object) => {
    if ('node' === edge.toPort && this.state._connectedTo !== edge.id) {
      logConnect(edge.inDataFor(change), this.state.feedbackDelay);
      edge.inDataFor(change).connect(this.state.feedbackDelay);
      return this.outKeys();
    }
    return [];
  };

  beforeDisconnectIn: Edge => void = edge => {
    const name = edge.toPort;
    if (name === 'node') {
      const { node } = this.props;
      if (node) {
        node.disconnect();
      }
    }
  };

  process = () => ({ out: this.state.feedbackDelay, node: this.props.node });
}

export class AudioDelayNode extends NodeBase<
  { delay: DelayNode, _connectedTo: ?string },
  { node: Tone.AudioNode, delayTime: number },
  { out: DelayNode, node: Tone.AudioNode }
> {
  static +displayName = 'Audio Delay';
  static +registryName = 'AudioDelayNode';
  // $FlowIssue
  static defaultState = { _connectedTo: null };
  static description = (
    <span>A node which is used to delay the incoming audio signal by a certain amount of time</span>
  );
  static schema = {
    input: {
      node: TT.AudioNode.desc('The audio node to connect to this feedback delay'),
      delayTime: Types.number.desc(
        'An a-rate AudioParam representing the amount of delay to apply'
      ),
    },
    output: {
      out: TT.AudioNode.desc('The resulting DelayNode'),
      node: TT.AudioNode.desc('The node that was passed in, connected to the delay'),
    },
    state: { delay: TT.AudioNode.desc('The delay node') },
  };

  onAddToGraph = () => {
    this.state.delay = Tone.context.createDelay(6.0);
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (!prevProps || newProps.delayTime !== prevProps.delayTime) {
      this.pushToState('delay', { delayTime: newProps.delayTime }, [], ['delayTime', 'value']);
    }
  };

  onInputChange = (edge: Edge, change: Object) => {
    if ('node' === edge.toPort && this.state._connectedTo !== edge.id) {
      logConnect(edge.inDataFor(change), this.state.delay);
      edge.inDataFor(change).connect(this.state.delay);
      return this.outKeys();
    }
    return [];
  };

  beforeDisconnectIn: Edge => void = edge => {
    const name = edge.toPort;
    if (name === 'node') {
      const { node } = this.props;
      if (node) {
        node.disconnect();
      }
    }
  };

  process = () => ({ out: this.state.delay, node: this.props.node });
}

export class AudioGainNode extends NodeBase<
  { gain: GainNode, _connectedTo: ?string },
  { node: Tone.AudioNode, gain: number },
  { gain: GainNode, node: Tone.AudioNode }
> {
  static +displayName = 'Audio Gain';
  static +registryName = 'AudioGainNode';
  static defaultState = { _connectedTo: null };
  static description = (
    <span>
      The GainNode interface represents a change in volume. It is an AudioNode audio-processing
      module that causes a given gain to be applied to the input data before its propagation to the
      output
    </span>
  );
  static schema = {
    input: {
      node: TT.AudioNode.desc('The audio node to connect to this feedback delay'),
      gain: Types.number.desc('An a-rate AudioParam representing the amount of gain to apply'),
    },
    output: {
      gain: TT.Gain.desc('The resulting GainNode'),
      node: TT.AudioNode.desc('The node that was passed in, connected to the gain'),
    },
    state: { gain: TT.Gain.desc('The gain node') },
  };

  onAddToGraph = () => {
    this.state.gain = Tone.context.createGain();
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (!prevProps || newProps.gain !== prevProps.gain) {
      this.pushToState('gain', { gain: newProps.gain }, [], ['gain', 'value']);
    }
  };

  onInputChange = (edge: Edge, change: Object) => {
    if ('node' === edge.toPort && this.state._connectedTo !== edge.id) {
      logConnect(edge.inDataFor(change), this.state.gain);
      edge.inDataFor(change).connect(this.state.gain);
      return this.outKeys();
    }
    return [];
  };

  beforeDisconnectIn: Edge => void = edge => {
    const name = edge.toPort;
    if (name === 'node') {
      const { node } = this.props;
      if (node) {
        node.disconnect();
      }
    }
  };

  process = () => ({ gain: this.state.gain, node: this.props.node });
}

export class AttackReleaseNode extends NodeBase<
  {},
  { synth: Tone.Synth, note: Tone.Frequency, duration: ?Tone.Time, time: Tone.Time, call: any },
  { draw: { note: Tone.Frequency, duration: Tone.Time } }
> {
  static +displayName = 'Attack-Release';
  static +registryName = 'AttackReleaseNode';
  static description = (
    <span>
      Trigger the attack and then the release after the duration. Omitting a duration and calling{' '}
      <code>call</code> results in an attack without release.
    </span>
  );
  static schema = {
    input: {
      synth: TT.Synth.desc('The synth to use'),
      note: TT.Note.desc('The frequency to play'),
      duration: Types.time.desc('The duration to play the note for'),
      time: Types.time.desc('When the note should be triggered'),
      call: TT.Call,
    },
    output: {
      draw: Types.object.desc(
        'An note / duration object that is signalled when this node triggers its attack'
      ),
    },
    state: {},
  };

  onInputChange = (edge: Edge, change: Object) => {
    if ('call' === edge.toPort) {
      if (edge.inDataFor(change)) {
        const { synth, note, duration, time } = this.props;
        if (synth && note && duration) {
          if (time) {
            synth.triggerAttackRelease(note, duration, time);
            Tone.Draw.schedule(() => {
              this.notifyAllOutputs();
            }, time);
          } else {
            synth.triggerAttackRelease(note, duration);
            return this.outKeys();
          }
        } else if (synth && note) {
          if (time) {
            synth.triggerAttack(note, time);
            Tone.Draw.schedule(() => {
              this.notifyAllOutputs();
            }, time);
          } else {
            synth.triggerAttack(note);
            return this.outKeys();
          }
        }
      }
    }
    // Return no updates here, since out signals will happen in the scheduled draw callback if not played now
    return [];
  };

  process = () => ({ draw: this.props });
}

export class PlayerNode extends NodeBase<{}, { url: string, call: any }, { player: Tone.Player }> {
  static +displayName = 'Remote Player';
  static +registryName = 'PlayerNode';
  static description = <span>Play a sound file from a remote source</span>;
  static schema = {
    input: {
      url: Types.string.aliased('url').desc('the url to fetch the sound file from.'),
      call: TT.Call,
      loop: Types.boolean.desc('Whether or not the player should loop its contents indefinitely'),
    },
    output: { player: Types.object.aliased('Player').desc('The player node') },
    state: {},
  };
  _loaded: string = '';
  _player: Tone.Player = new Tone.Player();

  _makePlayer = (url: string) => {
    this.setLoading(true)
    if (url.startsWith('/')) {
      url = URL_BASE + url;
    }
    this._player = new Tone.Player(url, () => {
      this.notifyAllOutputs(true);
      this._loaded = url;
      this._checkStarted();
    });
    this._player.autostart = false;
    this._setPlayerAttrs();
  };

  _setPlayerAttrs = () => {
    ['loop'].forEach(k => (this._player[k] = get(this.props, k)));
  };

  _checkStarted = () => {
    if (this.props.call && this._loaded && this._player.state !== 'started') {
      this._player.start();
    }
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (newProps.url && (!prevProps || newProps.url !== prevProps.url)) {
      if (this._loaded !== newProps.url) {
        this._makePlayer(newProps.url);
      }
    }
    this._checkStarted();
    this._setPlayerAttrs();
  };

  onInputChange = (edge: Edge, change: Object) => {
    return this.outKeys();
  };

  process = () => ({ player: this._player });
}

export class SetNoteNode extends NodeBase<
  {},
  { synth: Tone.Synth, note: Tone.Frequency, time: Tone.Time, call: any },
  null
> {
  static +displayName = 'Set Note';
  static +registryName = 'SetNoteNode';
  static description = <span>Set the note for a Synth</span>;
  static schema = {
    input: {
      synth: TT.Synth.desc('The synth to use'),
      note: TT.Note.desc('The frequency to set on the synth'),
      time: Types.time.desc('Time which the note should be set on the synth'),
      call: TT.Call,
    },
    output: {},
    state: {},
  };

  onInputChange = (edge: Edge, change: Object) => {
    if ('call' === edge.toPort) {
      if (edge.inDataFor(change)) {
        const { synth, note, time } = this.props;
        if (synth && note) {
          if (synth.setNote) {
            synth.setNote(note, time || undefined);
          } else if (synth.voices) {
            synth.voices.forEach(v => v.setNote(note, time || undefined));
          }
          time && Tone.Draw.schedule(this.notifyAllOutputs, time);
        }
      }
    }
    return [];
  };

  process = () => null;
}

export class SignalRampNode extends NodeBase<
  {},
  { signal: Tone.Signal, toValue: number, rampTime: Tone.Time },
  null
> {
  static +displayName = 'Signal Ramp';
  static +registryName = 'SignalRampNode';
  static description = <span>Ramp a signal to a value over a time</span>;
  static schema = {
    input: {
      signal: TT.Signal.desc('The signal to ramp'),
      toValue: Types.time.desc('The value to ramp to'),
      rampTime: Types.time.desc('The amount of time it takes to ramp'),
    },
    output: {},
    state: {},
  };
  _deferStart: boolean = false;

  onAddToGraph = () => {
    Tone.Transport.on('start', this._manageLoop);
  };

  _manageLoop = () => {
    if (this._deferStart) {
      this._deferStart = false;
      this._ramp();
    }
  };

  _ramp = () => {
    const { signal, toValue, rampTime } = this.props;
    if (signal && toValue !== undefined && rampTime) {
      if (Tone.Transport.state === 'started') {
        signal.linearRampTo(toValue, rampTime);
      } else {
        this._deferStart = true;
      }
    }
  };

  onInputChange = (edge: Edge, change: Object) => {
    this._ramp();
    return [];
  };
}

export class ArpeggiateNode extends NodeBase<
  {},
  {
    pattern: string,
    notes: string[],
    humanize: boolean | number,
    interval: Tone.Time,
  },
  { note: string, time: Tone.Time }
> {
  static +displayName = 'Arpeggiate';
  static +registryName = 'ArpeggiateNode';
  static defaultProps = {
    interval: '1m',
    pattern: 'upDown',
    notes: [],
    humanize: false,
  };
  static description = <span>Arpeggiate between the given notes in a number of patterns</span>;
  pattern: Tone.Pattern;
  // $FlowIssue
  _out: { note: string, time: Tone.Time } = {};
  static schema = {
    input: {
      notes: arrayOf(TT.Note).desc('Notes to arpeggiate over'),
      interval: Types.time.desc('The interval at which this node loops'),
      pattern: Types.string
        .aliased(
          'Pattern',
          <div>
            <p>Arpeggio pattern. Possible values are</p>
            <ul>
              <li>`up` - cycles upward</li> <li>`down` - cycles downward</li>
              <li>`upDown` - up then and down</li> <li>`downUp` - cycles down then and up</li>
              <li>`alternateUp` - jump up two and down one</li>
              <li>`alternateDown` - jump down two and up one</li>
              <li>`random` - randomly select an index</li>
              <li>`randomWalk` - randomly moves one index away from the current position</li>
              <li>
                `randomOnce` - randomly select an index without repeating until all values have been
                chosen.
              </li>
            </ul>
          </div>
        )
        .desc('The arpeggiation pattern. See the `Pattern` type for options.'),
      humanize: Types.boolean.desc(
        'Random variation +/-0.01s to the scheduled time. Or give it a time value which it will randomize by'
      ),
      probability: Types.number.desc('probability that each iteration will play, [0,1]'),
    },
    output: {
      note: TT.Note.desc('The note'),
      time: Types.time.desc('Time accompanying the note'),
    },
    state: {},
  };

  onAddToGraph = () => {
    this.pattern = new Tone.Pattern((time, note) => {
      this._out = { note, time };
      this.notifyOutputs(this.outKeys(), true);
    }, this.props.notes);
    Tone.Transport.on('start', this._manageLoop);
  };

  _manageLoop = () => {
    if (this.pattern.state !== 'started' && Tone.Transport.state === 'started') {
      this.pattern.start();
    }
  };

  willReceiveProps = (newProps: Object) => {
    ['humanize', 'interval', 'pattern', 'probability'].forEach(k => {
      this.pattern[k] = newProps[k];
    });
    if (newProps.notes) {
      this.pattern.values = newProps.notes;
    }
  };

  onInputChange = () => {
    this._manageLoop();
    return this.outKeys();
  };

  process = () => this._out;
}

export class TimeLoopNode extends NodeBase<
  {},
  {
    interval: Tone.Time,
    playbackRate: Tone.Time,
    iterations: number,
    mute: boolean,
    humanize: boolean | number,
  },
  { i: number }
> {
  static +displayName = 'Time Loop';
  static +registryName = 'TimeLoopNode';
  static defaultProps = {
    playbackRate: 1,
    iterations: Infinity,
    mute: false,
    humanize: false,
  };
  static description = <span>Set the note for a Synth</span>;
  loop: Tone.Loop;
  count: number = 0;
  static schema = {
    input: {
      interval: Types.time.desc('The interval at which this node loops'),
      playbackRate: Types.number.desc(
        'The playback rate of the loop. The normal playback rate is 1 (no change). A playbackRate of 2 would be twice as fast'
      ),
      iterations: Types.number.desc(
        'The number of iterations of the loop. The default value is Infinity (loop eternally)'
      ),
      mute: Types.boolean.desc('Muting the Loop means that no callbacks are invoked'),
      humanize: Types.boolean.desc(
        'Random variation +/-0.01s to the scheduled time. Or give it a time value which it will randomize by'
      ),
    },
    output: {
      i: Types.number.desc('The number of times this node has looped so far.'),
    },
    state: {},
  };

  onAddToGraph = () => {
    this.loop = new Tone.Loop(() => {
      this.count += 1;
      this.notifyOutputs(this.outKeys(), true);
    }, this.props.interval);
    Tone.Transport.on('start', this._manageLoop);
  };

  _recreateLoop = () => {
    this.loop && this.loop.dispose();
    this.count = 0;
    this.loop = new Tone.Loop(() => {
      this.count += 1;
      this.notifyOutputs(this.outKeys(), true);
    }, this.props.interval);
  };

  _manageLoop = () => {
    if (
      this.props.interval &&
      this.loop.state !== 'started' &&
      Tone.Transport.state === 'started'
    ) {
      this.loop.start();
    }
  };

  requireForOutput = () => typeof this.props.interval !== 'undefined';

  onInputChange = (edge: Edge, change: Object) => {
    if (['humanize', 'loop', 'iterations', 'playbackRate'].includes(edge.toPort)) {
      this._recreateLoop();
      this.loop[edge.toPort] = edge.inDataFor(change);
      this._manageLoop();
      return this.outKeys();
    } else if (edge.toPort === 'interval') {
      this._recreateLoop();
      this._manageLoop();
      return this.outKeys();
    }
    return [];
  };

  process = () => ({ i: this.count });
}

export class SynthNode extends NodeBase<
  { value: Tone.DuoSynth },
  { volume: number, oscillator: Object, envelope: Object },
  { out: Tone.DuoSynth }
> {
  static fwdSignals = ['frequency', 'volume'];
  static +displayName = 'Synth';
  static +registryName = 'SynthNode';
  static defaultEnv = {};
  static defaultProps = { volume: 0, envelope: SynthNode.defaultEnv };
  static description = (
    <span>A Synth is composed by routing an OmniOscillator through a AmplitudeEnvelope.</span>
  );

  static schema = {
    input: {
      volume: Types.number.desc('The volume of the output in decibels'),
      oscillator: Types.string
        .aliased(
          'OscillatorType',
          <div>
            The type of the oscillator: either sine, square, triangle, or sawtooth. Also capable of
            setting the first x number of partials of the oscillator. For example: `sine4` would set
            be the first 4 partials of the sine wave and `triangle8` would set the first 8 partials
            of the triangle wave.
          </div>
        )
        .desc('The type of oscillator'),
      envelope: Types.object
        .aliased(
          'AmplitudeEnvelope',
          <div>
            AmplitudeEnvelope is an Envelope connected to a gain node. Unlike Envelope, which
            outputs the envelope’s value, AmplitudeEnvelope accepts an audio signal as the input and
            will apply the envelope to the amplitude of the signal.
          </div>
        )
        .desc('The amplitude envelope for this synth'),
    },
    output: { out: TT.Synth.desc('Resulting Synth') },
    state: { value: TT.Synth.desc('The synth') },
  };

  onAddToGraph = () => {
    this.state.value = SynthNode.defaultSynth();
  };

  _recreateSynth = () => {
    this.state.value && this.state.value.dispose();
    this.state.value = new Tone.Synth({
      oscillator: { type: this.props.oscillator },
      envelope: this.props.envelope,
    });
  };

  willBecomeLive = () => {
    this._recreateSynth();
  };

  willReceiveProps = (newProps: Object, prevProps: Object, manual: boolean) => {
    if (manual) {
      SynthNode.fwdSignals.forEach(k => {
        if (!prevProps || newProps[k] !== prevProps[k]) {
          this.pushToState('value', { [k]: newProps[k] }, [], [k, 'value']);
        }
      });
    }
  };

  onInputChange = (edge: Edge, change: Object) => {
    if (SynthNode.fwdSignals.includes(edge.toPort)) {
      const changed = this.pushToState('value', change, [], [edge.toPort, 'value']);
      return changed ? this.outKeys() : [];
    }
    if (
      ['envelope', 'oscillator'].includes(edge.toPort) &&
      this.props.envelope &&
      this.props.oscillator
    ) {
      this._recreateSynth();
    }
    return [];
  };

  process = () => {
    return { out: this.state.value };
  };

  static defaultSynth() {
    return new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: SynthNode.defaultEnv });
  }
}

export class DuoSynthNode extends NodeBase<{ value: Tone.DuoSynth }, {}, { out: Tone.DuoSynth }> {
  static fwdSignals = ['frequency', 'harmonicity', 'volume', 'vibratoAmount', 'vibratoRate'];
  static +displayName = 'DuoSynth';
  static +registryName = 'DuoSynthNode';
  static description = (
    <span>
      A DuoSynth is a monophonic synth composed of two <code>MonoSynths</code> run in parallel with
      control over the frequency ratio between the two voices and vibrato effect.
    </span>
  );

  static schema = {
    input: {
      frequency: Types.number.desc('The frequency control'),
      volume: Types.number.desc('The volume of the output in decibels'),
      harmonicity: Types.number.desc(
        'Harmonicity is the ratio between the two voices. A harmonicity of 1 is no change. Harmonicity = 2 means a change of an octave.'
      ),
      vibratoAmount: Types.number.desc('The amount of vibrato'),
      vibratoRate: Types.number.desc('The frequency of vibrato'),
    },
    output: { out: TT.Synth.desc('Resulting Synth') },
    state: { value: TT.Synth.desc('The synth') },
  };

  static shortNames = {
    vibratoAmount: 'vibrato',
    vibratoRate: 'vibratoF',
    harmonicity: 'ratio',
    frequency: 'freq',
  };

  onAddToGraph = () => {
    this.state.value = DuoSynthNode.defaultSynth();
  };

  willReceiveProps = (newProps: Object, prevProps: Object, manual: boolean) => {
    if (manual) {
      DuoSynthNode.fwdSignals.forEach(k => {
        if (!prevProps || newProps[k] !== prevProps[k]) {
          this.pushToState('value', { [k]: newProps[k] }, [], [k, 'value']);
        }
      });
    }
  };

  onInputChange = (edge: Edge, change: Object) => {
    if (DuoSynthNode.fwdSignals.includes(edge.toPort)) {
      this.pushToState('value', change, [], [edge.toPort, 'value']);
      return [];
    }
    return [];
  };

  process = () => {
    return { out: this.state.value };
  };

  static defaultSynth() {
    let envelope = { attack: 1.4, release: 4, releaseCurve: 'linear', attackCurve: 'sine' };
    let filterEnvelope = {
      baseFrequency: 200,
      octaves: 2,
      attack: 0,
      decay: 0,
      release: 1000,
    };
    const synthOpts = {
      harmonicity: 1,
      volume: -20,
      voice0: { oscillator: { type: 'sawtooth' }, envelope, filterEnvelope },
      voice1: { oscillator: { type: 'sine' }, envelope, filterEnvelope },
      vibratoRate: 0.5,
      vibratoAmount: 0.1,
    };
    return new Tone.DuoSynth(synthOpts);
  }
}

export class PianoNode extends NodeBase<{}, {}, { out: Piano }> {
  piano: Piano;
  loaded: boolean = false;
  static +displayName = 'Piano';
  static +registryName = 'PianoNode';
  static description = <span>A virtual Salamander grand piano as a Tone Node</span>;

  static schema = {
    input: {},
    output: { out: TT.AudioNode.desc('A piano node') },
    state: {},
  };

  onAddToGraph = () => {
    this.setLoading(true);
    this.piano = new Piano({ velocities: 4 });
    this.piano.load('https://storage.googleapis.com/learnjs-data/Piano/Salamander/').then(() => {
      this.setLoading(false);
      this.loaded = true;
    });
  };

  process = () => ({ out: this.piano });
}

export class TransportTimeNode extends NodeBase<{}, { bpm: number }, { out: Tone.Transport }> {
  static +displayName = 'Transport Time';
  static +registryName = 'TransportTimeNode';
  static defaultProps = { bpm: 120 };
  static description = (
    <span>
      Transport for timing musical events. Supports tempo curves and time changes. Unlike event-loop
      timing (IntervalNode), events backed by this scheduler need to specify the exact time of their
      schedules. <br /> <br /> It is useful to think of there only being one governing Transport
      Time for your whole graph, i.e. don't define more than one of these, or if you do, recognize
      that you are modifying a single global transport time.
    </span>
  );

  static schema = {
    input: {
      bpm: Types.number.desc(
        'The tempo to set for this transport. See the docs on the time type to understand how time can be expressed in terms of metered time.'
      ),
    },
    output: { out: Types.object.desc('Resulting transport') },
    state: {},
  };

  _notifyOut = () => {
    setTimeout(() => this.notifyAllOutputs(true));
  };

  onAddToGraph = () => {
    Tone.Transport.on('start', this._notifyOut);
    Tone.Transport.on('stop', this._notifyOut);
  };

  willReceiveProps = (newProps: Object, prevProps: Object, manual: boolean) => {
    if (manual) {
      if (!prevProps || newProps['bpm'] !== prevProps['bpm']) {
        Tone.Transport.bpm.value = newProps.bpm;
      }
    }
  };

  onInputChange = (edge: Edge, change: Object) => {
    if (edge.toPort === 'bpm') {
      Tone.Transport.bpm.value = edge.inDataFor(change);
      return this.outKeys();
    }
    return [];
  };

  process = () => {
    return { out: Tone.Transport };
  };
}

export class StartTransportNode extends NodeBase<{}, { transport: Tone.Transport }, null> {
  static +displayName = 'Start Transport';
  static +registryName = 'StartTransportNode';
  static description = (
    <span>Start a transport time. This will put all Transport time schedules into motion</span>
  );
  static schema = {
    input: { transport: Types.object.desc('The Transport Time to start') },
    output: {},
    state: {},
  };

  onInputChange = (edge: Edge, change: Object) => {
    if (edge.toPort === 'transport') {
      const transport = edge.inDataFor(change);
      if (transport && transport.state !== 'started') {
        setTimeout(() => transport.start('+1'), 1);
      }
    }
    return [];
  };

  _stopTime = () => {
    const { transport } = this.props;
    if (transport) {
      transport.stop();
    }
  };

  beforeDisconnectIn: Edge => void = edge => {
    const name = edge.toPort;
    if (name === 'transport') {
      this._stopTime();
    }
  };

  willBeRemoved = () => {
    this._stopTime();
  };

  process = () => {
    return null;
  };
}

function logConnect(f, to) {
  const fromName = f.constructor.name || f.__proto__.toString();
  const toName = to.constructor.name || to.__proto__.toString();
  get(window, '$logConnect') && console.log('connect', fromName, toName);
}
