
# Node Docs

Here's a list of all 81 current nodes, their descriptions, and i/o.


## Vector 2D

A two dimensional vector with keys x and y
  

#### inputs

**`x`**: `number`
  


**`y`**: `number`
  

  
#### outputs

**`out`**: `Vec2`
  
<details>
<summary>Vec2</summary>
A 2D Vector with keys x and y
 default: `{x:0,y:0}`
</details>
  



## Mesh

A WebGL mesh
  

#### inputs

**`geometry`**: `Geometry`
  
The geometry to use with this mesh
<details>
<summary>Geometry</summary>
An abstract geometry that describes verticies in space

</details>

**`material`**: `Material`
  
This mesh's material
<details>
<summary>Material</summary>
An abstract material, usually applied to geometries

</details>

**`rotation`**: `Vec2`
  
The rotation of this mesh node, in radians
<details>
<summary>Vec2</summary>
A 2D Vector with keys x and y
 default: `{x:0,y:0}`
</details>

**`scale`**: `Vec3`
  
The scale of this mesh node
<details>
<summary>Vec3</summary>
A 3D Vector with keys x, y, and z
 default: `{x:0,y:0,z:0}`
</details>
  
#### outputs

**`mesh`**: `Mesh`
  
The resulting Mesh
<details>
<summary>Mesh</summary>
A mesh that can be added to a scene and rendered

</details>
  



## Torus Knot Geometry

A torus knot (buffer) geometry, with most attributes encoded in buffers so that they are more efficiently transported to your GPU.
  

#### inputs

**`radius`**: `number`
  
The radius of this geometry


**`tube`**: `number`
  
The tube radius


**`tubularSegments`**: `number`
  
The number of tubular segments for this geometry


**`radialSegments`**: `number`
  
The number of radial segments for this geometry


**`p`**: `number`
  
The torus knot p


**`q`**: `number`
  
The torus knot q

  
#### outputs

**`geometry`**: `Geometry`
  
this particular geometry
<details>
<summary>Geometry</summary>
An abstract geometry that describes verticies in space

</details>
  



## Plane Geometry

A plane (buffer) geometry, with most attributes encoded in buffers so that they are more efficiently transported to your GPU.
  

#### inputs

**`width`**: `number`
  
The width of this plane


**`height`**: `number`
  
The height of this plane

  
#### outputs

**`geometry`**: `Geometry`
  
this particular geometry
<details>
<summary>Geometry</summary>
An abstract geometry that describes verticies in space

</details>
  



## Sphere Geometry

A sphere (buffer) geometry, with most attributes encoded in buffers so that they are more efficiently transported to your GPU.
  

#### inputs

**`radius`**: `number`
  
The radius of the sphere


**`widthSegments`**: `number`
  
The number of segments along the geometry width


**`heightSegments`**: `number`
  
The number of segments along the geometry height

  
#### outputs

**`geometry`**: `Geometry`
  
this particular geometry
<details>
<summary>Geometry</summary>
An abstract geometry that describes verticies in space

</details>
  



## Box Geometry

A box (buffer) geometry, with most attributes encoded in buffers so that they are more efficiently transported to your GPU.
  

#### inputs

**`width`**: `number`
  
The width of this box


**`height`**: `number`
  
The height of this box


**`depth`**: `number`
  
The depth of this box

  
#### outputs

**`geometry`**: `Geometry`
  
this particular geometry
<details>
<summary>Geometry</summary>
An abstract geometry that describes verticies in space

</details>
  



## Lambert Material

A material for non-shiny surfaces, without specular highlights.The material uses a non-physically based Lambertian model for calculating reflectance. This can simulate some surfaces (such as untreated wood or stone) well, but cannot simulate shiny surfaces with specular highlights (such as varnished wood).Shading is calculated using a Gouraud shading model. This calculates shading per vertex (i.e. in the vertex shader) and interpolates the results over the polygon's faces.
  

#### inputs


  
#### outputs

**`material`**: `Material`
  
The resulting material
<details>
<summary>Material</summary>
An abstract material, usually applied to geometries

</details>
  



## Shader Material

A material rendered with custom shaders. A shader is a small program written in GLSL that runs on the GPU.You can use the directive #pragma unroll_loop in order to unroll a for loop in GLSL by the shader preprocessor. The directive has to be placed right above the loop. The loop should be formatted with the standard spec (normalized, var i, paren spacing)Additionally, all shader materials will be subscribed to global uniforms: `u_mouse` (vec2), `u_time` (float), and `u_resolution` (vec2)
  

#### inputs

**`vertex`**: `ShaderProgram`
  
Vertex shader for this shader material
<details>
<summary>ShaderProgram</summary>
An OpenGL compatible GLSL shader

</details>

**`fragment`**: `ShaderProgram`
  
Fragment shader for this shader material
<details>
<summary>ShaderProgram</summary>
An OpenGL compatible GLSL shader

</details>

**`transparent`**: `boolean`
  
Whether or not this material responds to an alpha component

  
#### outputs

**`material`**: `Material`
  
The resulting material
<details>
<summary>Material</summary>
An abstract material, usually applied to geometries

</details>
  



## Render Scene

This node renders a WebGL scene, by default with a perspective camera
  

#### inputs

**`child`**: `SceneElement`
  
Any scene element[s] to be added
<details>
<summary>SceneElement</summary>
Anything that can be added to a scene, including Meshes, Lights, & Cameras

</details>

**`fx`**: `PostEffect[]`
  
Post render pass(es)
<details>
<summary>PostEffect[]</summary>
An array of PostEffects. A post production render effect

</details>

**`clearColor`**: `RGBColor`
  
The renderer's clear color
<details>
<summary>RGBColor</summary>
RGB representation of a color

</details>

**`clearAlpha`**: `number`
  
The alpha component for the renderer's clear color

  
#### outputs


  



## DuoSynth

A DuoSynth is a monophonic synth composed of two MonoSynths run in parallel with control over the frequency ratio between the two voices and vibrato effect.
  

#### inputs

**`frequency`**: `number`
  
The frequency control


**`volume`**: `number`
  
The volume of the output in decibels


**`harmonicity`**: `number`
  
Harmonicity is the ratio between the two voices. A harmonicity of 1 is no change. Harmonicity = 2 means a change of an octave.


**`vibratoAmount`**: `number`
  
The amount of vibrato


**`vibratoRate`**: `number`
  
The frequency of vibrato

  
#### outputs

**`out`**: `Synth`
  
Resulting Synth
<details>
<summary>Synth</summary>
Any kind of synth

</details>
  



## Synth

A Synth is composed by routing an OmniOscillator through a AmplitudeEnvelope.
  

#### inputs

**`volume`**: `number`
  
The volume of the output in decibels


**`oscillator`**: `OscillatorType`
  
The type of oscillator
<details>
<summary>OscillatorType</summary>
The type of the oscillator: either sine, square, triangle, or sawtooth. Also capable of setting the first x number of partials of the oscillator. For example: sine4 would set be the first 4 partials of the sine wave and triangle8 would set the first 8 partials of the triangle wave.

</details>

**`envelope`**: `AmplitudeEnvelope`
  
The amplitude envelope for this synth
<details>
<summary>AmplitudeEnvelope</summary>
AmplitudeEnvelope is an Envelope connected to a gain node. Unlike Envelope, which outputs the envelope’s value, AmplitudeEnvelope accepts an audio signal as the input and will apply the envelope to the amplitude of the signal.

</details>
  
#### outputs

**`out`**: `Synth`
  
Resulting Synth
<details>
<summary>Synth</summary>
Any kind of synth

</details>
  



## Attack-Release

Trigger the attack and then the release after the duration. Omitting a duration and calling call results in an attack without release.
  

#### inputs

**`synth`**: `Synth`
  
The synth to use
<details>
<summary>Synth</summary>
Any kind of synth

</details>

**`note`**: `Note`
  
The frequency to play
<details>
<summary>Note</summary>
Note encoding, can be something like A4, a midi index, or a raw frequency in Hz

</details>

**`duration`**: `time`
  
The duration to play the note for


**`time`**: `time`
  
When the note should be triggered


**`call`**: `Call`
  
Certain nodes are designated 'callable', i.e. they are operator nodes. Sending a truthy call signal will invoke that node's handler over its parameters
<details>
<summary>Call</summary>
Something that is callable

</details>
  
#### outputs

**`draw`**: `object`
  
An note / duration object that is signalled when this node triggers its attack
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  



## Audio Master

Connect an audio node to the master audio output
  

#### inputs

**`node`**: `AudioNode`
  
Any Audio node to connect to the audio master output
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  
#### outputs

**`out`**: `AudioNode`
  
The same node, connected to the master output
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## Audio Panner

An equal power Left/Right stereo Panner
  

#### inputs

**`node`**: `AudioNode`
  
The audio node to connect to this panner.
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>

**`pan`**: `number`
  
The pan control. -1 = hard left, 1 = hard right

  
#### outputs

**`out`**: `Panner`
  
A node panned to the `pan` value
<details>
<summary>Panner</summary>
An audio pan

</details>

**`node`**: `AudioNode`
  
The node that was passed in, connected to the panner
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## Feedback Delay

A DelayNode in which part of output signal is fed back into the delay
  

#### inputs

**`node`**: `AudioNode`
  
The audio node to connect to this feedback delay
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>

**`delayTime`**: `time`
  
The delay applied to the incoming signal


**`feedback`**: `number`
  
feedback The amount of the effected signal which is fed back through the delay.

  
#### outputs

**`out`**: `FeedbackDelay`
  
The resulting FeedbackDelayNode
<details>
<summary>FeedbackDelay</summary>
A feedback delay

</details>

**`node`**: `AudioNode`
  
The node that was passed in, connected to the feedback delay
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## Audio Delay

A node which is used to delay the incoming audio signal by a certain amount of time
  

#### inputs

**`node`**: `AudioNode`
  
The audio node to connect to this feedback delay
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>

**`delayTime`**: `number`
  
An a-rate AudioParam representing the amount of delay to apply

  
#### outputs

**`out`**: `AudioNode`
  
The resulting DelayNode
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>

**`node`**: `AudioNode`
  
The node that was passed in, connected to the delay
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## Audio Gain

The GainNode interface represents a change in volume. It is an AudioNode audio-processing module that causes a given gain to be applied to the input data before its propagation to the output
  

#### inputs

**`node`**: `AudioNode`
  
The audio node to connect to this feedback delay
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>

**`gain`**: `number`
  
An a-rate AudioParam representing the amount of gain to apply

  
#### outputs

**`gain`**: `Gain`
  
The resulting GainNode
<details>
<summary>Gain</summary>
An audio gain

</details>

**`node`**: `AudioNode`
  
The node that was passed in, connected to the gain
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## Mapper


  

#### inputs

**`input`**: `object`
  
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  
#### outputs

**`out`**: `object`
  
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  



## Interval

A node which emits any value and a count at a regular time interval.
  

#### inputs

**`value`**: `any`
  
Any input to emit at this interval


**`interval`**: `number`
  
The interval at which this node will emit, in miliseconds

  
#### outputs

**`count`**: `number`
  
The number of times this node has emitted so far.


**`value`**: `any`
  
The input value passed in

  



## Set Note

Set the note for a Synth
  

#### inputs

**`synth`**: `Synth`
  
The synth to use
<details>
<summary>Synth</summary>
Any kind of synth

</details>

**`note`**: `Note`
  
The frequency to set on the synth
<details>
<summary>Note</summary>
Note encoding, can be something like A4, a midi index, or a raw frequency in Hz

</details>

**`time`**: `time`
  
Time which the note should be set on the synth


**`call`**: `Call`
  
Certain nodes are designated 'callable', i.e. they are operator nodes. Sending a truthy call signal will invoke that node's handler over its parameters
<details>
<summary>Call</summary>
Something that is callable

</details>
  
#### outputs


  



## Time Loop

Set the note for a Synth
  

#### inputs

**`interval`**: `time`
  
The interval at which this node loops


**`playbackRate`**: `number`
  
The playback rate of the loop. The normal playback rate is 1 (no change). A playbackRate of 2 would be twice as fast


**`iterations`**: `number`
  
The number of iterations of the loop. The default value is Infinity (loop eternally)


**`mute`**: `boolean`
  
Muting the Loop means that no callbacks are invoked


**`humanize`**: `boolean`
  
Random variation +/-0.01s to the scheduled time. Or give it a time value which it will randomize by

  
#### outputs

**`i`**: `number`
  
The number of times this node has looped so far.

  



## Start Transport

Start a transport time. This will put all Transport time schedules into motion
  

#### inputs

**`transport`**: `object`
  
The Transport Time to start
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  
#### outputs


  



## Transport Time

Transport for timing musical events. Supports tempo curves and time changes. Unlike event-loop timing (IntervalNode), events backed by this scheduler need to specify the exact time of their schedules.   It is useful to think of there only being one governing Transport Time for your whole graph, i.e. don't define more than one of these, or if you do, recognize that you are modifying a single global transport time.
  

#### inputs

**`bpm`**: `number`
  
The tempo to set for this transport. See the docs on the time type to understand how time can be expressed in terms of metered time.

  
#### outputs

**`out`**: `object`
  
Resulting transport
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  



## Connect

Connect one audio node to another
  

#### inputs

**`from`**: `AudioNode`
  
Connect from any audio node
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>

**`to`**: `AudioNode`
  
Connect to any audio node
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  
#### outputs

**`from`**: `AudioNode`
  
The same node, connected
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>

**`to`**: `AudioNode`
  
The same node, connected
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## Context Destination

The current context destination
  

#### inputs


  
#### outputs

**`node`**: `AudioNode`
  
The current context destination node
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## To Context Dest.

Connect an audio node to audio context destination
  

#### inputs

**`node`**: `AudioNode`
  
Any Audio node to connect to the context destination
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  
#### outputs

**`out`**: `AudioNode`
  
The same node, connected to the context destination
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## Piano

A virtual Salamander grand piano as a Tone Node
  

#### inputs


  
#### outputs

**`out`**: `AudioNode`
  
A piano node
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## Arpeggiate

Arpeggiate between the given notes in a number of patterns
  

#### inputs

**`notes`**: `Note[]`
  
Notes to arpeggiate over
<details>
<summary>Note[]</summary>
An array of Notes. Note encoding, can be something like A4, a midi index, or a raw frequency in Hz

</details>

**`interval`**: `time`
  
The interval at which this node loops


**`pattern`**: `Pattern`
  
The arpeggiation pattern. See the `Pattern` type for options.
<details>
<summary>Pattern</summary>
Arpeggio pattern. Possible values areup - cycles upward h - cycles downwardupDown - up then and down downUp - cycles down then and upalternateUp - jump up two and down onealternateDown - jump down two and up onerandom - randomly select an indexrandomWalk - randomly moves one index away from the current positionrandomOnce - randomly select an index without repeating until all values have been chosen.

</details>

**`humanize`**: `boolean`
  
Random variation +/-0.01s to the scheduled time. Or give it a time value which it will randomize by


**`probability`**: `number`
  
probability that each iteration will play, [0,1]

  
#### outputs

**`note`**: `Note`
  
The note
<details>
<summary>Note</summary>
Note encoding, can be something like A4, a midi index, or a raw frequency in Hz

</details>

**`time`**: `time`
  
Time accompanying the note

  



## Audio Compressor

A node which compresses signals from its origin. Compression reduces the volume of loud sounds or amplifies quiet sounds by narrowing or "compressing" an audio signal's dynamic range.
  

#### inputs

**`node`**: `AudioNode`
  
The audio node to connect to this compressor.
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>

**`threshold`**: `number`
  
The value above which the compression starts to be applied.


**`ratio`**: `number`
  
The gain reduction ratio

  
#### outputs

**`out`**: `Compressor`
  
The compressor node
<details>
<summary>Compressor</summary>
An object with arbitrary keys and values

</details>

**`node`**: `AudioNode`
  
The node that was passed in, connected to the compressor
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## Reverb

A Reverb based on Freeverb (https://ccrma.stanford.edu/~jos/pasp/Freeverb.html).
  

#### inputs

**`node`**: `AudioNode`
  
The audio node to connect to this reverb node
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>

**`dampening`**: `time`
  
The amount of dampening of the reverberant signal


**`roomSize`**: `number`
  
The roomSize value between [0,1]. A larger roomSize will result in a longer decay

  
#### outputs

**`out`**: `Reverb`
  
The resulting Reverb Node
<details>
<summary>Reverb</summary>
An object with arbitrary keys and values

</details>

**`node`**: `AudioNode`
  
The node that was passed in, connected to the reverb
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## Remote Player

Play a sound file from a remote source
  

#### inputs

**`url`**: `url`
  
the url to fetch the sound file from.
<details>
<summary>url</summary>
A basic string type

</details>

**`call`**: `Call`
  
Certain nodes are designated 'callable', i.e. they are operator nodes. Sending a truthy call signal will invoke that node's handler over its parameters
<details>
<summary>Call</summary>
Something that is callable

</details>

**`loop`**: `boolean`
  
Whether or not the player should loop its contents indefinitely

  
#### outputs

**`player`**: `Player`
  
The player node
<details>
<summary>Player</summary>
An object with arbitrary keys and values

</details>
  



## Audio Volume

A simple volume node, useful for creating a volume fader.
  

#### inputs

**`node`**: `AudioNode`
  
The audio node to connect to this Volume node.
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>

**`volume`**: `number`
  
The volume, in decibels

  
#### outputs

**`out`**: `Volume`
  
The volume node
<details>
<summary>Volume</summary>
An object with arbitrary keys and values

</details>

**`node`**: `AudioNode`
  
The node that was passed in, connected to this volume node
<details>
<summary>AudioNode</summary>
Any kind of audio node

</details>
  



## Signal Ramp

Ramp a signal to a value over a time
  

#### inputs

**`signal`**: `Signal`
  
The signal to ramp
<details>
<summary>Signal</summary>
An audio signal, like volume, pan, frequency, etc.

</details>

**`toValue`**: `time`
  
The value to ramp to


**`rampTime`**: `time`
  
The amount of time it takes to ramp

  
#### outputs


  



## SoundFont

A virtual instrument
  

#### inputs

**`name`**: `string`
  
The name of the soundfont to use. Possible values:accordion, acoustic_bass, acoustic_grand_piano, acoustic_guitar_nylon, acoustic_guitar_steel, agogo, alto_sax, applause, bagpipe, banjo, baritone_sax, bassoon, bird_tweet, blown_bottle, brass_section, breath_noise, bright_acoustic_piano, celesta, cello, choir_aahs, church_organ, clarinet, clavinet, contrabass, distortion_guitar, drawbar_organ, dulcimer, electric_bass_finger, electric_bass_pick, electric_grand_piano, electric_guitar_clean, electric_guitar_jazz, electric_guitar_muted, electric_piano_1, electric_piano_2, english_horn, fiddle, flute, french_horn, fretless_bass, fx_1_rain, fx_2_soundtrack, fx_3_crystal, fx_4_atmosphere, fx_5_brightness, fx_6_goblins, fx_7_echoes, fx_8_scifi, glockenspiel, guitar_fret_noise, guitar_harmonics, gunshot, harmonica, harpsichord, helicopter, honkytonk_piano, kalimba, koto, lead_1_square, lead_2_sawtooth, lead_3_calliope, lead_4_chiff, lead_5_charang, lead_6_voice, lead_7_fifths, lead_8_bass__lead, marimba, melodic_tom, music_box, muted_trumpet, oboe, ocarina, orchestra_hit, orchestral_harp, overdriven_guitar, pad_1_new_age, pad_2_warm, pad_3_polysynth, pad_4_choir, pad_5_bowed, pad_6_metallic, pad_7_halo, pad_8_sweep, pan_flute, percussive_organ, piccolo, pizzicato_strings, recorder, reed_organ, reverse_cymbal, rock_organ, seashore, shakuhachi, shamisen, shanai, sitar, slap_bass_1, slap_bass_2, soprano_sax, steel_drums, string_ensemble_1, string_ensemble_2, synth_bass_1, synth_bass_2, synth_brass_1, synth_brass_2, synth_choir, synth_drum, synth_strings_1, synth_strings_2, taiko_drum, tango_accordion, telephone_ring, tenor_sax, timpani, tinkle_bell, tremolo_strings, trombone, trumpet, tuba, tubular_bells, vibraphone, viola, violin, voice_oohs, whistle, woodblock, xylophone


**`attack`**: `number`
  
The attack to use for this instrument


**`decay`**: `number`
  
The decay to use for this instrument


**`release`**: `number`
  
The release to use for this instrument


**`sustain`**: `number`
  
The sustain to use for this instrument

  
#### outputs

**`out`**: `SoundFont`
  
Resulting SoundFont
<details>
<summary>SoundFont</summary>
A sample set assembled to be a virtual instrument

</details>
  



## SoundFont Player

A Node which plays tone data to a SoundFont instrument
  

#### inputs

**`soundFont`**: `SoundFont`
  
The particular sound font to use.
<details>
<summary>SoundFont</summary>
A sample set assembled to be a virtual instrument

</details>

**`toneData`**: `ToneData`
  
Data fed in through this channel will be sent to the sound font instrument to play
<details>
<summary>ToneData</summary>
Directives for an instrument / synth to play.

</details>

**`midiData`**: `MidiData`
  
Data fed in through this channel will be sent to the sound font instrument to play
<details>
<summary>MidiData</summary>
Midi signal. Usually a note, action, velocity, and channel information

</details>

**`midiDevice`**: `MidiInput`
  
Optionally attach a midi input to this node to send signals to the soundfont
<details>
<summary>MidiInput</summary>
A connected MIDI input

</details>
  
#### outputs


  



## Divide

Divide one number by another
  

#### inputs

**`dividend`**: `number`
  


**`divisor`**: `number`
  

  
#### outputs

**`result`**: `number`
  


**`int`**: `number`
  

  



## Sum

Sum across numbers
  

#### inputs

**`numbers`**: `number`
  
All numbers to add together

  
#### outputs

**`result`**: `number`
  
Sum

  



## Product

Multiply over numbers
  

#### inputs

**`numbers`**: `number`
  
All numbers to multiply together

  
#### outputs

**`result`**: `number`
  
Product

  



## Math: Int -> Int

Admittedly a node borne of laziness -- given a standard js math package operation name, this node performs that operation. Constants are included. Full signature list in MathFnIntInt help. For non unary functions like min, an array argument can be spread into the args.
  

#### inputs

**`fn`**: `MathFn`
  
The function name. Check type info for options
<details>
<summary>MathFn</summary>
Signatures for the available functionsE: number; LN10: number; LN2: number; LOG10E: number; LOG2E: number; PI: number; SQRT1_2: number; SQRT2: number; abs(x: number): number; acos(x: number): number; acosh(x: number): number; asin(x: number): number; asinh(x: number): number; atan(x: number): number; atan2(y: number, x: number): number; atanh(x: number): number; cbrt(x: number): number; ceil(x: number): number; cos(x: number): number; cosh(x: number): number; exp(x: number): number; expm1(x: number): number; floor(x: number): number; fround(x: number): number; log(x: number): number; log10(x: number): number; log1p(x: number): number; log2(x: number): number; pow(x: number, y: number): number; random(): number; round(x: number): number; sign(x: number): number; sin(x: number): number; sinh(x: number): number; sqrt(x: number): number; tan(x: number): number; tanh(x: number): number; trunc(x: number): number; max(...args: number[]); min(...args: number[])

</details>

**`in`**: `number`
  

  
#### outputs

**`result`**: `number`
  

  



## Color

A color representation
  

#### inputs

**`r`**: `number`
  
red channel, [0,255]


**`g`**: `number`
  
green channel, [0,255]


**`b`**: `number`
  
blue channel, [0,255]

  
#### outputs

**`hex`**: `number`
  
hex representation of this color


**`rgb`**: `RGBColor`
  
rgb representation
<details>
<summary>RGBColor</summary>
RGB representation of a color

</details>
  



## Directional Light

A focused light, intended to be added to a scene
  

#### inputs

**`color`**: `RGBColor`
  
The color of this directional light
<details>
<summary>RGBColor</summary>
RGB representation of a color

</details>
  
#### outputs

**`light`**: `Light`
  
The directional light source
<details>
<summary>Light</summary>
A light source in a scene

</details>
  



## Ambient Light

An ambient light, intended to be added to a scene
  

#### inputs

**`color`**: `RGBColor`
  
The color of this ambient light
<details>
<summary>RGBColor</summary>
RGB representation of a color

</details>
  
#### outputs

**`light`**: `Light`
  
The ambient light source
<details>
<summary>Light</summary>
A light source in a scene

</details>
  



## Glitch Pass

A holy perturbation
  

#### inputs

**`delay`**: `Vec2`
  
the min and max delay between glitches, as a 2d vector in second units
<details>
<summary>Vec2</summary>
A 2D Vector with keys x and y
 default: `{x:0,y:0}`
</details>
  
#### outputs

**`glitch`**: `PostEffect`
  
glitchy pass that can be applied to a render
<details>
<summary>PostEffect</summary>
A post production render effect

</details>
  



## Scanline Pass

A scanline post-process effect
  

#### inputs


  
#### outputs

**`pass`**: `PostEffect`
  
a scanline pass that can be applied to a render
<details>
<summary>PostEffect</summary>
A post production render effect

</details>

**`effect`**: `object`
  
the effect info
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  



## DotScreen Pass

A Dot-screen post-process effect
  

#### inputs


  
#### outputs

**`pass`**: `PostEffect`
  
a dotscreen pass that can be applied to a render
<details>
<summary>PostEffect</summary>
A post production render effect

</details>

**`effect`**: `object`
  
the effect info
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  



## Vignette Pass

A Vignette post-process effect
  

#### inputs

**`opacity`**: `number`
  
The vignette opacity [0,1]


**`offset`**: `number`
  
The vignette offset [0,1]


**`darkness`**: `number`
  
The vignette darkness [0,1]

  
#### outputs

**`pass`**: `PostEffect`
  
a vignette pass that can be applied to a render
<details>
<summary>PostEffect</summary>
A post production render effect

</details>

**`effect`**: `object`
  
the effect info
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  



## Noise Pass

A noise post-process effect
  

#### inputs

**`opacity`**: `number`
  
the blending opacity

  
#### outputs

**`pass`**: `PostEffect`
  
a noise pass that can be applied to a render
<details>
<summary>PostEffect</summary>
A post production render effect

</details>

**`effect`**: `object`
  
the effect info
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  



## Vector 3D

A two dimensional vector with x y and y components
  

#### inputs

**`x`**: `number`
  


**`y`**: `number`
  


**`z`**: `number`
  

  
#### outputs

**`out`**: `Vec3`
  
<details>
<summary>Vec3</summary>
A 3D Vector with keys x, y, and z
 default: `{x:0,y:0,z:0}`
</details>
  



## AND

Logical AND over inputs
  

#### inputs

**`input`**: `any`
  
Any set of members to logical `AND` over

  
#### outputs

**`result`**: `number`
  
Logical and of inputs

  



## OR

Logical OR over inputs
  

#### inputs

**`input`**: `any`
  
Any set of members to logical `OR` over

  
#### outputs

**`result`**: `number`
  
Logical OR of inputs

  



## Not

logical not
  

#### inputs

**`in`**: `any`
  
anything. negation follows regular js semantics

  
#### outputs

**`result`**: `boolean`
  

  



## Equals

Strict equals operator
  

#### inputs

**`input`**: `any`
  
Any set of members to perform strict equals over

  
#### outputs

**`result`**: `number`
  
Logical equals over inputs

  



## Switch

An If-Else switch on value equality
  

#### inputs

**`value`**: `any`
  
Any value, as input to the switch


**`not`**: `any`
  
Any value to use to compare the input to


**`else`**: `any`
  
Any value to return if not logically equal

  
#### outputs

**`result`**: `any`
  
Result of the switch

  



## Music RNN

Sample an RNN model trained on the Yamaha e-Piano Competition dataset
  

#### inputs

**`scale`**: `PitchHistogram`
  
This pitch distribution will be used as a tonic to condition this model
<details>
<summary>PitchHistogram</summary>
A scale represented as a distribution of pitch classes. Valid inputs are either an array of numbers (len 12), or a single string of len 12 that describes relative semitone distributions (ranged 0-9). 0-indexed at C.e.g. F Major could be either array: [1, 0, 1, 0, 1, 2, 0, 1, 0, 1, 1, 0] or string:"101012010110"

</details>

**`density`**: `number`
  
A density conditioning variable between 0-6 that serves as a directive for how many notes will be generated per step, in exponential scale. i.e. notes generated per step will be 2^density


**`stepsPerSecond`**: `number`
  
number of steps per second. effectively a tempo measure for note generation / playback


**`synth`**: `Synth`
  
Optionally attach a synth to this node and trigger its attack / release
<details>
<summary>Synth</summary>
Any kind of synth

</details>

**`midiOut`**: `MidiOut`
  
Optionally attach a midi output to this node and send midi signals to that device
<details>
<summary>MidiOut</summary>
A connected MIDI output

</details>
  
#### outputs

**`midiData`**: `object`
  
midi data out
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>

**`toneData`**: `ToneData`
  
tone out node
<details>
<summary>ToneData</summary>
Directives for an instrument / synth to play.

</details>
  



## InfoLog

Log any inputs as they come to console info
  

#### inputs

**`anything`**: `any`
  
Anything you would like to log

  
#### outputs

**`anything`**: `any`
  
The input, passed through

  



## Music Scale

A Musical scale
  

#### inputs

**`tonic`**: `string`
  
The tonic for this scale, e.g. "C" or "Ab4". You can optionally specify the scale name here too, and omit the name input, e.g. "C minor pentatonic" See the name param info for possible scale names.


**`name`**: `ScaleName`
  
The name of the scale. Check type for possible values
<details>
<summary>ScaleName</summary>
One of:aeolian altered augmented augmented heptatonic balinese bebop bebop dominant bebop locrian bebop major bebop minor chromatic composite blues diminished dorian dorian #4 double harmonic lydian double harmonic major egyptian enigmatic flamenco flat six pentatonic flat three pentatonic half-whole diminished harmonic major harmonic minor hirajoshi hungarian major hungarian minor ichikosucho in-sen ionian augmented ionian pentatonic iwato kafi raga kumoijoshi leading whole tone locrian locrian #2 locrian major locrian pentatonic lydian lydian #5P pentatonic lydian #9 lydian augmented lydian diminished lydian dominant lydian dominant pentatonic lydian minor lydian pentatonic major major blues major flat two pentatonic major pentatonic malkos raga melodic minor melodic minor fifth mode melodic minor second mode minor #7M pentatonic minor bebop minor blues minor hexatonic minor pentatonic minor six diminished minor six pentatonic mixolydian mixolydian pentatonic mystery #1 neopolitan neopolitan major neopolitan major pentatonic neopolitan minor oriental pelog persian phrygian phrygian dominant piongio prometheus prometheus neopolitan purvi raga ritusen romanian minor scriabin six tone symmetric spanish heptatonic super locrian pentatonic todi raga vietnamese 1 vietnamese 2 whole tone whole tone pentatonic 

</details>
  
#### outputs

**`notes`**: `Note[]`
  
The notes in this scale
<details>
<summary>Note[]</summary>
An array of Notes. Note encoding, can be something like A4, a midi index, or a raw frequency in Hz

</details>

**`intervals`**: `Interval[]`
  
The intervals between notes in this scale
<details>
<summary>Interval[]</summary>
An array of Intervals. Natural interval name, e.g. 1P, 2M, 3M, 4P, 5P, 6m, 7m

</details>
  



## Scale Chroma

A chroma representation of a pitchset as a 12-digit binary array, with each index presenting one semitone of the octave
  

#### inputs

**`notes`**: `Note[]`
  
A list of notes to compute a chroma for
<details>
<summary>Note[]</summary>
An array of Notes. Note encoding, can be something like A4, a midi index, or a raw frequency in Hz

</details>
  
#### outputs

**`chroma`**: `number[]`
  
the chroma output: 12-digit binary array, with each index presenting one semitone of the octave
<details>
<summary>number[]</summary>
An array of numbers. A basic number type

</details>
  



## Music Chord

A Chord
  

#### inputs

**`tonic`**: `string`
  
The tonic for this scale, e.g. "C" or "Ab4". You can optionally specify the chord name here too, and omit the name input, e.g. "E Maj7" See the name param info for recognized chord names.


**`name`**: `ChordName`
  
The name of the chord. Check type for possible values
<details>
<summary>ChordName</summary>
One of:+add#9 11 11b9 13 13#11 13#9 13#9#11 13b5 13b9 13b9#11 13no5 13sus4 4 5 64 69#11 7 7#11 7#11b13 7#5 7#5#9 7#5b9 7#5b9#11 7#5sus4 7#9 7#9#11 7#9#11b13 7#9b13 7add6 7b13 7b5 7b6 7b9 7b9#11 7b9#9 7b9b13 7b9b13#11 7no5 7sus4 7sus4b9 7sus4b9b13 9 9#11 9#11b13 9#5 9#5#11 9b13 9b5 9no5 9sus4 M M#5 M#5add9 M13 M13#11 M6 M6#11 M69 M69#11 M7#11 M7#5 M7#5sus4 M7#9#11 M7add13 M7b5 M7b6 M7b9 M7sus4 M9 M9#11 M9#5 M9#5sus4 M9b5 M9sus4 Madd9 Maddb9 Maj7 Mb5 Mb6 Msus2 Msus4 m m#5 m11 m11A 5 m11b5 m13 m6 m69 m7 m7#5 m7add11 m7b5 m9 m9#5 m9b5 mM9 mM9b6 mMaj7 mMaj7b6 madd4 madd9 mb6M7 mb6b9 o o7 o7M7 oM7 sus24 

</details>
  
#### outputs

**`notes`**: `Note[]`
  
The notes in this chord
<details>
<summary>Note[]</summary>
An array of Notes. Note encoding, can be something like A4, a midi index, or a raw frequency in Hz

</details>

**`intervals`**: `Interval[]`
  
The intervals between notes in this chord
<details>
<summary>Interval[]</summary>
An array of Intervals. Natural interval name, e.g. 1P, 2M, 3M, 4P, 5P, 6m, 7m

</details>
  



## Transpose

Transpose a note by an interval. e.g. transpose(A4, M3) -> C#5 
  

#### inputs

**`note`**: `string`
  
The note to transpose. This can be abstract or a concrete pitch, i.e. C or C4


**`interval`**: `string`
  
The interval to transpose by, e.g. P5 or M3

  
#### outputs

**`out`**: `string`
  
The note, transposed by the interval

  



## Key Triads

Triads For a Key
  

#### inputs

**`key`**: `string`
  
The name of the key (a tonic + a mode), e.g. C major, Db dorian

  
#### outputs

**`notes`**: `Note[]`
  
Triad lead-sheet symbols for this key
<details>
<summary>Note[]</summary>
An array of Notes. Note encoding, can be something like A4, a midi index, or a raw frequency in Hz

</details>
  



## Midi Out

A midi output device. If no id / name are provided, the first midi device found will be used
  

#### inputs

**`id`**: `string`
  
The midi out device id *or* name. The first matching one will be used in the case of collisions

  
#### outputs

**`device`**: `object`
  
The midi output, or none if none were found
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  



## Midi In

A midi input device. If no id / name are provided, the first midi device found will be used
  

#### inputs

**`id`**: `string`
  
The midi in device id *or* name. The first matching one will be used in the case of collisions

  
#### outputs

**`device`**: `object`
  
The midi input, or none if none were found
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  



## JSON Parse

Parse a string into an object
  

#### inputs

**`in`**: `string`
  
String serialization

  
#### outputs

**`out`**: `object`
  
Parsed object
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>
  



## Extract

Extract a value from an object. Complement of SetNode
  

#### inputs

**`from`**: `object`
  
Object to extract from
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>

**`get`**: `string`
  
The key to get. You can traverse an object with dot notation, i.e. foo.bar

  
#### outputs

**`out`**: `any`
  
The extracted value, or undefined

  



## Set Value

Set a value on any object / array. Complement of ExtractNode
  

#### inputs

**`target`**: `object`
  
Object / array to set to
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>

**`path`**: `string`
  
The path to set at. You can use dot notation, i.e. foo.bar


**`value`**: `any`
  
The value to set at path.

  
#### outputs

**`out`**: `any`
  
The extracted value, or undefined

  



## Stephen Wolfram

Stephen Wolfram is an operator that, when given a 1D cellular automata rule number [0-255] and a binary representation of the world, outputs the subsequent state of the world according to that rule. He can do this indefinitely and is, in fact, Earth's first eternal human.
  

#### inputs

**`rule`**: `number`
  
The rule number. Given a binary state and two neighbors (2^3 states), a transition rule set can be encoded with a binary number with each digit slot representing the next state of that configuration (2^(2^3) rule sets).


**`initialState`**: `any`
  
He doesn't know or care where it comes from, but Wolfram needs an initial state in order to operate. His world is probably circular, so the first index and last index are assumed to be neighbors for rule application. Both binary strings and binary arrays are acceptable.


**`call`**: `Call`
  
Certain nodes are designated 'callable', i.e. they are operator nodes. Sending a truthy call signal will invoke that node's handler over its parameters
<details>
<summary>Call</summary>
Something that is callable

</details>
  
#### outputs

**`out`**: `number[]`
  
The resulting binary array
<details>
<summary>number[]</summary>
An array of numbers. A basic number type

</details>
  



## Collect

Buffer values from an input stream. If memory capacity is reached, oldest values are purged first
  

#### inputs

**`capacity`**: `number`
  
The max number of elements to keep. Omitting this means no limit


**`value`**: `any`
  
Any value. This will be pushed into the output collector

  
#### outputs

**`out`**: `any[]`
  
The collected queue, oldest to newest.
<details>
<summary>any[]</summary>
An array of anys. This can be anything

</details>
  



## Join

Join an array of values together with a separator
  

#### inputs

**`array`**: `object`
  
Array of any data. Ideally this data is string serializable.
<details>
<summary>object</summary>
An object with arbitrary keys and values

</details>

**`separator`**: `string`
  
Separator string to join elements together with

  
#### outputs

**`out`**: `string`
  
The joined array, as a string

  



## Regex Replace

Replace a regex match with something else
  

#### inputs

**`string`**: `string`
  
The string over which to perform the replace


**`regex`**: `string`
  
the regexp


**`replacement`**: `string`
  
The string to replace matches with

  
#### outputs

**`out`**: `string`
  
The joined array, as a string

  



## Array Fill

Create an array filled with a value
  

#### inputs

**`length`**: `number`
  
The length of this array


**`fillWith`**: `any`
  
The value to fill with

  
#### outputs

**`out`**: `any[]`
  
An array, filled to length by value
<details>
<summary>any[]</summary>
An array of anys. This can be anything

</details>
  



## Count Source

Create an array filled with a value
  

#### inputs


  
#### outputs

**`count`**: `number`
  
The output count

  



## Zip

Zip elements from an input stream
  

#### inputs

**`arg1`**: `any`
  
Any object to zip


**`arg2`**: `any`
  
Any object to zip


**`arg3`**: `any`
  
Any object to zip


**`arg4`**: `any`
  
Any object to zip

  
#### outputs

**`zipped`**: `any[]`
  
The zipped object
<details>
<summary>any[]</summary>
An array of anys. This can be anything

</details>
  



## HTML Element

A node that renders HTML to the screen
  

#### inputs

**`html`**: `string`
  
The html for this element


**`text`**: `string`
  
The inner text of this element


**`style`**: `string`
  
The style attribute for this node

  
#### outputs


  



## Plus

A plus operator. Usable with both strings and numbers.
  

#### inputs

**`left`**: `any`
  
left hand side


**`right`**: `any`
  
right hand side

  
#### outputs

**`out`**: `any`
  
The result

  



## GPGPU Program

Define a GPGPU program to be run on your machine's compatible backend
  

#### inputs

**`userCode`**: `GPGPUKernel`
  
Your user code for the kernel to be uploaded to your graphics hardware. Syntax is specific to your backend, but a good strategy is conforming to the OpenGL/WebGL standards that most GPUs will support. In order to set an output to your kernel call setOutput in your kernel's main function. To get the output coords in your computation call getOutputCoords.
<details>
<summary>GPGPUKernel</summary>
An open frameworks compliant shader program

</details>

**`outputShape`**: `number[]`
  
A tensor shape describing the kernel output, e.g. [100, 100]. if omitted, output shape is assumed to be the same as the input shape
<details>
<summary>number[]</summary>
An array of numbers. A basic number type

</details>

**`variableNames`**: `string[]`
  
A list of variable names that your kernel will use. This gives you access to functions inside your program kernel. i.e. variable named X gives you the methods getXAtOutCoords and getX
<details>
<summary>string[]</summary>
An array of strings. A basic string type

</details>
  
#### outputs

**`program`**: `GPGPUProgram`
  
Program info output. Use the "Run GPGPU" node to compile and run this over inputs
<details>
<summary>GPGPUProgram</summary>
An uncompiled GPGPU program

</details>
  



## Run GPGPU

Compile and run a GPGPU program. Kernels passed in will be compiled and cached, so that subsequent calls to kernels will not create new binaries.
  

#### inputs

**`program`**: `GPGPUProgram`
  
The uncompiled program info to be turned into a full WebGL shader
<details>
<summary>GPGPUProgram</summary>
An uncompiled GPGPU program

</details>

**`input`**: `any[]`
  
The input tensor to run through the compiled program kernel
<details>
<summary>any[]</summary>
An array of anys. This can be anything

</details>
  
#### outputs

**`result`**: `any[]`
  
Program output
<details>
<summary>any[]</summary>
An array of anys. This can be anything

</details>
  



## JS Code

Define arbitrary JS code in this node. Runtime compatibility is based on your browser
  

#### inputs

**`userCode`**: `JSFunction`
  
A JS code block that returns something over the inputs. You can reference variables by input name, e.g. arg1
<details>
<summary>JSFunction</summary>
A valid JS code block. You should call return at the end of your function to provide an output.

</details>

**`arg1`**: `any`
  
Any arg to supply to the user code block, accessible via arg1


**`arg2`**: `any`
  
Any arg to supply to the user code block, accessible via arg2


**`arg3`**: `any`
  
Any arg to supply to the user code block, accessible via arg3


**`arg4`**: `any`
  
Any arg to supply to the user code block, accessible via arg4


**`arg5`**: `any`
  
Any arg to supply to the user code block, accessible via arg5

  
#### outputs

**`return`**: `any`
  
Whatever was returned in the userCode block

  



## number


  

#### inputs


  
#### outputs

**`out`**: `number`
  

  



## string


  

#### inputs


  
#### outputs

**`out`**: `string`
  

  



## boolean


  

#### inputs


  
#### outputs

**`out`**: `boolean`
  

  



## date


  

#### inputs


  
#### outputs

**`out`**: `date`
  

  
    
