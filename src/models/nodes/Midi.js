// @flow
import React from 'react';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
import { arrayOf } from '../../utils/typeUtils';

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

  _loaded: boolean = false;
  available: MIDIDevice[] = [];
  midi: ?MIDIDevice = null;

  loadAll = async () => {
    try {
      const navigator = window.navigator;
      const midi = await navigator.requestMIDIAccess();
      this._loaded = true;
      midi.outputs.forEach((output) => this.available.push(output));
      if (this.available.length > 0) this._setMidi(this.available[0].id);
      this.notifyAllOutputs();
    } catch (e) {
      this._loaded = true;
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
      if (this._loaded) {
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
  _loaded: boolean = false;
  available: MIDIDevice[] = [];
  midi: ?MIDIDevice = null;

  loadAll = async () => {
    try {
      const navigator = window.navigator;
      const midi = await navigator.requestMIDIAccess();
      this._loaded = true;
      midi.inputs.forEach((output) => this.available.push(output));
      if (this.available.length > 0) this.midi = this.available[0];
      this.notifyAllOutputs();
    } catch (e) {
      this._loaded = true;
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
      if (this._loaded) {
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
  _loaded: boolean = false;
  availableOut: MIDIDevice[] = [];
  availableIn: MIDIDevice[] = [];

  loadAll = async () => {
    try {
      const navigator = window.navigator;
      const midi = await navigator.requestMIDIAccess();
      this._loaded = true;
      midi.inputs.forEach((input) => this.availableIn.push(input));
      midi.outputs.forEach((output) => this.availableOut.push(output));
      this.notifyAllOutputs();
    } catch (e) {
      this._loaded = true;
      console.log('no midi devices found');
    }
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
