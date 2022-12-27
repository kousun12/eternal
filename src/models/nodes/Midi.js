// @flow
import React from 'react';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import { Input, WebMidi } from 'webmidi';
import { arrayOf } from '../../utils/typeUtils';
import { uniq, get } from 'lodash';

const Types = window.Types;

type MIDIDevice = {
  id: string,
  name: ?string,
  type: string,
};
const TT = {
  MIDIDevice: Types.object.aliased('MIDIDevice', 'Web MIDIDevice object'),
};

export class MidiOutNode extends NodeBase<{}, { id?: string }, { device: ?MIDIDevice }> {
  static +displayName = 'Midi Out';
  static +registryName = 'MidiOutNode';
  static description = (
    <span>
      A midi output device. If no id / name are provided, the first midi device found will be used
    </span>
  );
  static schema = {
    input: {
      id: Types.string.desc(
        'The midi out device id *or* name. The first matching one will be used in the case of collisions'
      ),
    },
    output: { device: TT.MIDIDevice.desc('The midi output, or none if none were found') },
    state: {},
  };

  available: MIDIDevice[] = [];
  midi: ?MIDIDevice = null;

  loadAll = async () => {
    this.setLoading(true);
    try {
      const navigator = window.navigator;
      const midi = await navigator.requestMIDIAccess();
      this.setLoading(false);
      midi.outputs.forEach((output) => this.available.push(output));
      if (this.available.length > 0) this._setMidi(this.available[0].id);
      this.notifyAllOutputs();
    } catch (e) {
      this.setLoading(false);
      console.log('no midi devices found');
    }
  };

  _setMidi = (id: string) => {
    this.midi = this.available.find((o) => o.id === id || o.name === id) || this.midi;
    if (this.midi) {
      console.log('connected to midi out', this.midi.name);
    }
    this.notifyAllOutputs();
  };

  onAddToGraph = () => {
    this.loadAll();
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (newProps.id && (!prevProps || newProps.id !== prevProps.id)) {
      const id = String(newProps.id);
      if (!this.isLoading) {
        this._setMidi(id);
      } else {
        this.loadAll().then(() => {
          this._setMidi(id);
        });
      }
    }
  };

  process = () => ({ device: this.midi });

  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}

export class MidiInNode extends NodeBase<{}, { id?: string }, { device: ?MIDIDevice }> {
  static +displayName = 'Midi In';
  static +registryName = 'MidiInNode';
  static description = (
    <span>
      A midi input device. If no id / name are provided, the first midi device found will be used
    </span>
  );
  static schema = {
    input: {
      id: Types.string.desc(
        'The midi in device id *or* name. The first matching one will be used in the case of collisions'
      ),
    },
    output: { device: TT.MIDIDevice.desc('The midi input, or none if none were found') },
    state: {},
  };
  available: MIDIDevice[] = [];
  midi: ?MIDIDevice = null;

  loadAll = async () => {
    this.setLoading(true);
    try {
      const navigator = window.navigator;
      const midi = await navigator.requestMIDIAccess();
      this.setLoading(false);
      midi.inputs.forEach((output) => this.available.push(output));
      if (this.available.length > 0) this.midi = this.available[0];
      this.notifyAllOutputs();
    } catch (e) {
      this.setLoading(false);
      console.log('no midi devices found');
    }
  };

  _setMidi = (id: string) => {
    this.midi = this.available.find((o) => o.id === id || o.name === id) || this.midi;
    this.notifyAllOutputs();
  };

  onAddToGraph = () => {
    this.loadAll();
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (newProps.id && (!prevProps || newProps.id !== prevProps.id)) {
      const id = String(newProps.id);
      if (!this.isLoading) {
        this._setMidi(id);
      } else {
        this.loadAll().then(() => {
          this._setMidi(id);
        });
      }
    }
  };

  process = () => ({ device: this.midi });

  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}

export class MidiDevicesNode extends NodeBase<
  {},
  {},
  { outputs: MIDIDevice[], inputs: MIDIDevice[] }
> {
  static +displayName = 'Midi Devices';
  static +registryName = 'MidiDevicesNode';
  static description = (<span>Find system MIDI devices</span>);
  static schema = {
    input: {},
    output: {
      outputs: arrayOf(TT.MIDIDevice).desc('MIDI outputs found on your system'),
      inputs: arrayOf(TT.MIDIDevice).desc('MIDI inputs found on your system'),
    },
    state: {},
  };
  availableOut: MIDIDevice[] = [];
  availableIn: MIDIDevice[] = [];

  loadAll = async () => {
    this.setLoading(true);
    try {
      const navigator = window.navigator;
      const midi = await navigator.requestMIDIAccess();
      midi.inputs.forEach((input) => this.availableIn.push(input));
      midi.outputs.forEach((output) => this.availableOut.push(output));
      this.notifyAllOutputs();
    } catch (e) {
      console.log('no midi devices found');
    }
    this.setLoading(false);
  };

  onAddToGraph = () => {
    this.loadAll();
  };

  process = () => {
    const inMapped: MIDIDevice[] = this.availableIn.map(deviceToPOJO);
    const outMapped: MIDIDevice[] = this.availableOut.map(deviceToPOJO);
    return { inputs: inMapped, outputs: outMapped };
  };

  onInputChange = (edge: Edge, change: Object) => this.outKeys();
}

export class MidiListenNode extends NodeBase<
  {},
  { id?: string, eventType?: string },
  { event: ?Object }
> {
  static +displayName = 'Midi Listen';
  static +registryName = 'MidiListenNode';
  static description = (<span>Listen to events from a MIDI device</span>);
  static +defaultProps = { eventType: 'noteon' };
  static schema = {
    input: {
      id: Types.string.desc('The MIDI device ID to listen on'),
      eventType: Types.string.desc(
        'The type of event to listen for. One of noteoff, noteon, midimessage'
      ),
    },
    output: {
      event: Types.object
        .aliased('MIDIEvent', 'Either a noteon, noteoff, or midievent message')
        .desc('Output event'),
      notes: arrayOf(Types.string).desc('Currently playing notes'),
    },
    state: {},
  };
  device: ?Input = null;
  event: Object = {};
  notes: string[] = [];

  loadAll = async () => {
    this.setLoading(true);
    try {
      const enabled = await WebMidi.enable();
      if (enabled && WebMidi.inputs && WebMidi.inputs[0]) {
        this._setMidi(WebMidi.inputs[0].id);
      }
    } catch (e) {
      console.log('no midi devices found');
    }
    this.setLoading(false);
  };

  onAddToGraph = () => {
    this.loadAll();
  };

  process = () => {
    return { event: this.event, notes: this.notes };
  };

  _onEvent = (e: Object) => {
    this.event = e;
    this.notifyOutputs('event');
  };

  _noteOnListener = (event: Object) => {
    const n = get(event, 'note.identifier');
    if (n) {
      this.notes = uniq(this.notes.concat(n));
      this.notifyOutputs('notes');
    }
  };

  _noteOffListener = (event: Object) => {
    const n = get(event, 'note.identifier');
    if (n) {
      this.notes = this.notes.filter((e) => e !== n);
      this.notifyOutputs('notes');
    }
  };

  _setMidi = (id: string) => {
    const oldDevice = this.device;
    const d = WebMidi.getInputById(id);
    if (oldDevice) {
      oldDevice.removeListener('noteon', this._noteOnListener);
      oldDevice.removeListener('noteoff', this._noteOffListener);
      this.notes = [];
    }
    if (d) {
      d.removeListener(this.props.eventType, this._onEvent);
      d.addListener(this.props.eventType, this._onEvent);
      d.addListener('noteon', this._noteOnListener);
      d.addListener('noteoff', this._noteOffListener);
      this.device = d;
    }
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    const d = this.device;
    if (prevProps.eventType && d) {
      d.removeListener(prevProps.eventType, this._onEvent);
      this._setMidi(d.id);
    }
    if (newProps.id && (!prevProps || newProps.id !== prevProps.id)) {
      const id = String(newProps.id);
      if (!this.isLoading) {
        this._setMidi(id);
      } else {
        this.loadAll().then(() => {
          this._setMidi(id);
        });
      }
    }
  };
}

function deviceToPOJO(d: MIDIDevice): MIDIDevice {
  const keys = ['id', 'name', 'type'];
  const r: MIDIDevice = { id: '', name: '', type: '' };
  for (const k in d) {
    if (keys.includes(k)) {
      r[k] = d[k];
    }
  }
  return r;
}
