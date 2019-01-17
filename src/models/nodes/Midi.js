// @flow
import React from 'react';
import { get } from 'lodash';
import NodeBase from 'models/NodeBase';
import Edge from 'models/Edge';
const Types = window.Types;

type MIDIOutput = {
  id: string,
  name: ?string,
  type: string,
};

const noop = () => {};

export class MidiOutNode extends NodeBase<{}, { id?: string }, { device: ?MIDIOutput }> {
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
    output: { device: Types.object.desc('The midi output, or none if none were found') },
    state: {},
  };

  _loaded: boolean = false;
  available: MIDIOutput[] = [];
  midi: ?MIDIOutput = null;

  loadAll = async () => {
    try {
      const navigator = window.navigator;
      const midi = await navigator.requestMIDIAccess();
      this._loaded = true;
      midi.outputs.forEach(output => this.available.push(output));
      if (this.available.length > 0) this._setMidi(this.available[0].id);
      this.notifyAllOutputs();
    } catch (e) {
      this._loaded = true;
      console.log('no midi devices found');
    }
  };

  _setMidi = (id: string) => {
    this.midi = this.available.find(o => o.id === id || o.name === id) || this.midi;
    if (this.midi) {
      console.log('connected to midi out', this.midi.name);
    }
    this.notifyAllOutputs();
  };

  onAddToGraph = () => {
    this.loadAll().then(noop);
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

export class MidiInNode extends NodeBase<{}, { id?: string }, { device: ?MIDIOutput }> {
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
    output: { device: Types.object.desc('The midi input, or none if none were found') },
    state: {},
  };

  _loaded: boolean = false;
  available: MIDIOutput[] = [];
  midi: ?MIDIOutput = null;

  loadAll = async () => {
    try {
      const navigator = window.navigator;
      const midi = await navigator.requestMIDIAccess();
      this._loaded = true;
      midi.inputs.forEach(output => this.available.push(output));
      if (this.available.length > 0) this.midi = this.available[0];
      this.notifyAllOutputs();
    } catch (e) {
      this._loaded = true;
      console.log('no midi devices found');
    }
  };

  _setMidi = (id: string) => {
    this.midi = this.available.find(o => o.id === id || o.name === id) || this.midi;
    this.notifyAllOutputs();
  };

  onAddToGraph = () => {
    this.loadAll().then(noop);
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
