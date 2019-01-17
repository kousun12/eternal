// @flow
import React from 'react';
import Tone from 'tone';
import { get } from 'lodash';
import NodeBase from 'models/NodeBase';
import SoundFont from 'soundfont-player';
import { TT as NTypes, type ToneData } from 'models/nodes/Neural';
import type { MidiData } from 'performance';
import { MIDI_EVENT_OFF, MIDI_EVENT_ON } from 'performance';
const Types = window.Types;

export const TT = {
  SoundFont: Types.object.aliased('SoundFont', 'A sample set assembled to be a virtual instrument'),
};

export class SoundFontNode extends NodeBase<
  {},
  { name: string, attack: number, decay: number, release: number, sustain: number },
  { out: ?Object }
> {
  instrument: Object;
  _loaded: ?string = null;
  static +registryName = 'SoundFontNode';
  static +displayName = 'SoundFont';
  static description = <span>A virtual instrument</span>;
  static defaultProps = { attack: 0.5, decay: 1, release: 1, sustain: 0.9 };

  static schema = {
    input: {
      name: Types.string.desc(
        <div>
          <p>The name of the soundfont to use. Possible values:</p>
          <p>
            accordion, acoustic_bass, acoustic_grand_piano, acoustic_guitar_nylon,
            acoustic_guitar_steel, agogo, alto_sax, applause, bagpipe, banjo, baritone_sax, bassoon,
            bird_tweet, blown_bottle, brass_section, breath_noise, bright_acoustic_piano, celesta,
            cello, choir_aahs, church_organ, clarinet, clavinet, contrabass, distortion_guitar,
            drawbar_organ, dulcimer, electric_bass_finger, electric_bass_pick, electric_grand_piano,
            electric_guitar_clean, electric_guitar_jazz, electric_guitar_muted, electric_piano_1,
            electric_piano_2, english_horn, fiddle, flute, french_horn, fretless_bass, fx_1_rain,
            fx_2_soundtrack, fx_3_crystal, fx_4_atmosphere, fx_5_brightness, fx_6_goblins,
            fx_7_echoes, fx_8_scifi, glockenspiel, guitar_fret_noise, guitar_harmonics, gunshot,
            harmonica, harpsichord, helicopter, honkytonk_piano, kalimba, koto, lead_1_square,
            lead_2_sawtooth, lead_3_calliope, lead_4_chiff, lead_5_charang, lead_6_voice,
            lead_7_fifths, lead_8_bass__lead, marimba, melodic_tom, music_box, muted_trumpet, oboe,
            ocarina, orchestra_hit, orchestral_harp, overdriven_guitar, pad_1_new_age, pad_2_warm,
            pad_3_polysynth, pad_4_choir, pad_5_bowed, pad_6_metallic, pad_7_halo, pad_8_sweep,
            pan_flute, percussive_organ, piccolo, pizzicato_strings, recorder, reed_organ,
            reverse_cymbal, rock_organ, seashore, shakuhachi, shamisen, shanai, sitar, slap_bass_1,
            slap_bass_2, soprano_sax, steel_drums, string_ensemble_1, string_ensemble_2,
            synth_bass_1, synth_bass_2, synth_brass_1, synth_brass_2, synth_choir, synth_drum,
            synth_strings_1, synth_strings_2, taiko_drum, tango_accordion, telephone_ring,
            tenor_sax, timpani, tinkle_bell, tremolo_strings, trombone, trumpet, tuba,
            tubular_bells, vibraphone, viola, violin, voice_oohs, whistle, woodblock, xylophone
          </p>
        </div>
      ),
      attack: Types.number.desc('The attack to use for this instrument'),
      decay: Types.number.desc('The decay to use for this instrument'),
      release: Types.number.desc('The release to use for this instrument'),
      sustain: Types.number.desc('The sustain to use for this instrument'),
    },
    output: { out: TT.SoundFont.desc('Resulting SoundFont') },
    state: {},
  };

  _options = () => {
    const attack = this.props.attack || 0;
    const decay = this.props.decay || 0;
    const release = this.props.release || 0;
    const sustain = this.props.sustain | 0;
    return { attack, release, decay, sustain };
  };

  _setFont = (name: string) => {
    SoundFont.instrument(Tone.context, name, this._options()).then(inst => {
      this.instrument = inst;
      this.instrument.opts = { ...this.instrument.opts, ...this._options() };
      this.notifyAllOutputs(true);
      this._loaded = name;
    });
  };

  willReceiveProps = (newProps: Object, prevProps: Object) => {
    if (newProps.name && (!prevProps || newProps.name !== prevProps.name)) {
      if (this._loaded !== newProps.name) {
        this._setFont(newProps.name);
      }
    }
    ['attack', 'decay', 'release', 'sustain'].forEach(k => {
      if (typeof prevProps !== 'number' || newProps[k] !== prevProps[k]) {
        if (this.instrument) {
          this.instrument.opts[k] = newProps[k];
        }
      }
    });
  };

  process = () => {
    return { out: this.instrument };
  };
}

export class SoundFontPlayerNode extends NodeBase<
  {},
  { soundFont: Object, toneData: ToneData, midiDevice: ?Object },
  null
> {
  static +displayName = 'SoundFont Player';
  static +registryName = 'SoundFontPlayerNode';
  static description = <span>A Node which plays tone data to a SoundFont instrument</span>;

  static schema = {
    input: {
      soundFont: TT.SoundFont.desc('The particular sound font to use.'),
      toneData: NTypes.ToneData.desc(
        'Data fed in through this channel will be sent to the sound font instrument to play'
      ),
      midiData: NTypes.MidiData.desc(
        'Data fed in through this channel will be sent to the sound font instrument to play'
      ),
      midiDevice: Types.object
        .aliased('MidiInput', 'A connected MIDI input')
        .desc('Optionally attach a midi input to this node to send signals to the soundfont'),
    },
    output: {},
    state: {},
  };
  _playMap = {};
  listening = [];

  _playToneData = (data: ToneData, sf: Object) => {
    const [freq, action, time, velocity] = data;
    const note = freq.toNote();
    switch (action) {
      case 'attack':
        if (!this._playMap[note]) {
          this._playMap[note] = sf.play(note, time, { ...sf.opts, gain: velocity });
        } else {
          // this._playMap[note].stop();
          this._playMap[note] = sf.play(note, time, { ...sf.opts, gain: velocity });
        }
        break;
      case 'release':
        const node = this._playMap[note];
        if (node) {
          node.stop(time);
        }
        break;
      case 'attackRelease':
        sf.play(note, undefined, { duration: 0.5 });
        break;
    }
  };

  _playMidiData = (midi: [MidiData, ?number], sf: Object) => {
    const [data, _time] = midi;
    const [event, note, velocity] = data;
    const time = _time ? _time / 1000 : _time;

    switch (event) {
      case MIDI_EVENT_OFF:
        const node = this._playMap[note];
        if (node) {
          node.stop(time);
        }
        break;
      case MIDI_EVENT_ON:
        if (!this._playMap[note]) {
          this._playMap[note] = sf.play(note, time, { ...sf.opts, gain: velocity / 100 });
        } else {
          this._playMap[note].stop();
          this._playMap[note] = sf.play(note, time, { ...sf.opts, gain: velocity / 100 });
        }
        break;
    }
  };

  _connectMidiIn = () => {
    const { midiDevice, soundFont } = this.props;
    if (soundFont && midiDevice && !this.listening.includes(midiDevice.id)) {
      soundFont.listenToMidi(midiDevice);
      console.log('listen', midiDevice.name, soundFont);
      this.listening.push(midiDevice.id);
    }
  };

  process = () => {
    const sf = get(this.props, 'soundFont', undefined);
    if (sf) {
      this._connectMidiIn();
      const data = get(this.props, 'toneData');
      if (data) this._playToneData(data, sf);
      const midi = get(this.props, 'midiData');
      if (midi) this._playMidiData(midi, sf);
    }
    return null;
  };
}
