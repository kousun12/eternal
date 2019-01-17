// @flow
import Tone from 'tone';

/*
function makeSynth() {
  let envelope = {
    attack: 0.1,
    release: 4,
    releaseCurve: 'linear',
  };
  let filterEnvelope = {
    baseFrequency: 200,
    octaves: 2,
    attack: 0,
    decay: 0,
    release: 1000,
  };

  return new Tone.DuoSynth({
    harmonicity: 1,
    volume: -20,
    voice0: {
      oscillator: { type: 'sawtooth' },
      envelope,
      filterEnvelope,
    },
    voice1: {
      oscillator: { type: 'sine' },
      envelope,
      filterEnvelope,
    },
    vibratoRate: 0.5,
    vibratoAmount: 0.1,
  });
}

let leftSynth = makeSynth();
let rightSynth = makeSynth();
let leftPanner = new Tone.Panner(-1);
let rightPanner = new Tone.Panner(1);
let echo = new Tone.FeedbackDelay('16n', 0.2);
let delay = Tone.context.createDelay(6.0);
let delayFade = Tone.context.createGain();

delay.delayTime.value = 6.0;
delayFade.gain.value = 0.75;

leftSynth.connect(leftPanner);
rightSynth.connect(rightPanner);
leftPanner.connect(echo);
rightPanner.connect(echo);

echo.toMaster();
echo.connect(delay);
delay.connect(Tone.context.destination);
delay.connect(delayFade);
delayFade.connect(delay);

new Tone.Loop(time => {
  leftSynth.triggerAttackRelease('C5', '1:2');
  leftSynth.setNote('D5', '+0:2');
  leftSynth.triggerAttackRelease('E4', '0:2', '+6:0');
  leftSynth.triggerAttackRelease('G4', '0:2', '+11:2');
  leftSynth.triggerAttackRelease('E5', '2:0', '+19:0');
  leftSynth.setNote('G5', '+19:1:2');
  leftSynth.setNote('A5', '+19:3:0');
  leftSynth.setNote('G5', '+19:4:2');
}, '34m').start();

new Tone.Loop(time => {
  rightSynth.triggerAttackRelease('D4', '1:2', '+5:0');
  rightSynth.setNote('E4', '+6:0');

  rightSynth.triggerAttackRelease('B3', '1m', '+11:2:2');
  rightSynth.setNote('G3', '+12:0:2');

  rightSynth.triggerAttackRelease('G4', '0:2', '+23:2');
}, '37m').start();

Tone.Transport.bpm.value = 240;
*/

var sineSynthLeft = new Tone.Synth({
  oscillator: {
    type: 'sine',
  },
  envelope: {
    attack: 1,
    decay: 0.0,
    sustain: 1,
    release: 1,
  },
});

var triangleSynthLeft = new Tone.Synth({
  oscillator: {
    type: 'triangle',
  },
  envelope: {
    attack: 1,
    decay: 0.0,
    sustain: 1,
    release: 1,
  },
});

var squareSynthLeft = new Tone.Synth({
  oscillator: {
    type: 'sawtooth',
  },
  envelope: {
    attack: 1,
    decay: 0.0,
    sustain: 1,
    release: 1,
  },
});

var sineSynthRight = new Tone.Synth({
  oscillator: {
    type: 'sine',
  },
  envelope: {
    attack: 1,
    decay: 0.0,
    sustain: 1,
    release: 1,
  },
});

var triangleSynthRight = new Tone.Synth({
  oscillator: {
    type: 'triangle',
  },
  envelope: {
    attack: 1,
    decay: 0.0,
    sustain: 1,
    release: 1,
  },
});

var squareSynthRight = new Tone.Synth({
  oscillator: {
    type: 'sawtooth',
  },
  envelope: {
    attack: 1,
    decay: 0.0,
    sustain: 1,
    release: 1,
  },
});

// PATTERNS

var bassPattern1 = new Tone.Pattern(
  function(time, note) {
    sineSynthLeft.triggerAttackRelease(note, '1n', time);
  },
  ['B2', 'C#2', 'E2', 'G#2']
);

// C#m7: ["C#", "E", "G#", "B"]
var bassPattern2 = new Tone.Pattern(
  function(time, note) {
    squareSynthRight.triggerAttackRelease(note, '1n', time);
  },
  ['C#2', 'E2', 'G#2', 'B2']
);

//Aadd9: ["A", "C#", "E", "B"]
var middleChords1 = new Tone.Pattern(
  function(time, note) {
    triangleSynthLeft.triggerAttackRelease(note, '1n', time);
  },
  ['A3', 'B3', 'E3', 'G#3']
);

// Amaj9: ["A", "C#", "E", "G#", "B"]
var middleChords2 = new Tone.Pattern(
  function(time, note) {
    sineSynthRight.triggerAttackRelease(note, '1n', time);
  },
  ['E4', 'G#4', 'A4', 'B4']
);

// (7) ["EMaj7", "F#m7", "G#m7", "AMaj7", "B7", "C#m7", "D#m7b5"]

// G#m7: ["G#", "B", "D#", "F#"]
// B7: ["B", "D#", "F#", "A"]
var color1 = new Tone.Pattern(
  function(time, note) {
    triangleSynthRight.triggerAttackRelease(note, '1n', time);
  },
  ['A4', 'D#4', 'F#4', 'G#4', 'A5', 'D#5', 'F#5']
);

var color2 = new Tone.Pattern(
  function(time, note) {
    squareSynthLeft.triggerAttackRelease(note, '1n', time);
  },
  ['G#4', 'D#4', 'F#4', 'A4', 'D#5', 'F#5', 'A5']
);

bassPattern1.pattern = 'random';
bassPattern1.humanize = true;
bassPattern1.start(0);

bassPattern2.pattern = 'random';
bassPattern2.humanize = true;
bassPattern2.start(0);

middleChords1.pattern = 'random';
middleChords1.humanize = true;
middleChords1.start(0);

middleChords2.pattern = 'random';
middleChords2.humanize = true;
middleChords2.start(0);

color1.pattern = 'random';
color1.humanize = true;
color1.start(0);

color2.pattern = 'random';
color2.humanize = true;
color2.start(0);

var leftPanner = new Tone.Panner(-0.5);
var rightPanner = new Tone.Panner(0.5);
var echo2 = new Tone.FeedbackDelay('8n', 0.7);
var reverb2 = new Tone.Freeverb();
reverb2.dampening.value = 200;
reverb2.roomSize.value = 0.4;

var comp = new Tone.Compressor(-2, 3);

sineSynthLeft.connect(leftPanner);
triangleSynthLeft.connect(leftPanner);
squareSynthLeft.connect(leftPanner);
sineSynthRight.connect(rightPanner);
triangleSynthRight.connect(rightPanner);
squareSynthRight.connect(rightPanner);

leftPanner.connect(echo2);
rightPanner.connect(echo2);

echo2.connect(reverb2);

reverb2.connect(comp);

// VOICE

var player = new Tone.Player({
  url: '/Voice.mp3',
  loop: true,
});

var voiceVolume = new Tone.Volume(12);

player.connect(voiceVolume);
voiceVolume.connect(comp);
player.autostart = true;

var masterVolume = new Tone.Volume(-12);

comp.connect(masterVolume);
masterVolume.toMaster();

// original bpm: 63, in 6/8 timing
Tone.Transport.bpm.value = 10;

Tone.Transport.start();
