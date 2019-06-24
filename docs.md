
# Node Docs

Here's a list of all 72 current nodes, their descriptions, and i/o.


## Vector 2D

A two dimensional vector with keys x and y
  

##### inputs (2)

`x`: `number` _primitive_

A basic `number` type.

`y`: `number` _primitive_

A basic `number` type.
  
##### outputs (1)

`out`: `Vec2` _complex_ default: `{"x":0,"y":0}`

A 2D Vector with keys `x` and `y`
  



## Mesh

A WebGL mesh
  

##### inputs (4)

`geometry`: `object` _complex_

The geometry to use with this mesh

`material`: `object` _complex_

This mesh's material

`rotation`: `Vec2` _complex_ default: `{"x":0,"y":0}`

The rotation of this mesh node, in radians

`scale`: `Vec3` _complex_ default: `{"x":0,"y":0,"z":0}`

The scale of this mesh node
  
##### outputs (1)

`mesh`: `object` _complex_

An object with arbitrary keys and values
  



## Torus Knot Geometry

A torus knot (buffer) geometry, with most attributes encoded in buffers so that they are more efficiently transported to your GPU.
  

##### inputs (6)

`radius`: `number` _primitive_

The radius of this geometry

`tube`: `number` _primitive_

The tube radius

`tubularSegments`: `number` _primitive_

The number of tubular segments for this geometry

`radialSegments`: `number` _primitive_

The number of radial segments for this geometry

`p`: `number` _primitive_

The torus knot p

`q`: `number` _primitive_

The torus knot q
  
##### outputs (1)

`geometry`: `object` _complex_

this particular geometry
  



## Plane Geometry

A plane (buffer) geometry, with most attributes encoded in buffers so that they are more efficiently transported to your GPU.
  

##### inputs (2)

`width`: `number` _primitive_

The width of this plane

`height`: `number` _primitive_

The height of this plane
  
##### outputs (1)

`geometry`: `object` _complex_

this particular geometry
  



## Sphere Geometry

A sphere (buffer) geometry, with most attributes encoded in buffers so that they are more efficiently transported to your GPU.
  

##### inputs (3)

`radius`: `number` _primitive_

The radius of the sphere

`widthSegments`: `number` _primitive_

The number of segments along the geometry width

`heightSegments`: `number` _primitive_

The number of segments along the geometry height
  
##### outputs (1)

`geometry`: `object` _complex_

this particular geometry
  



## Box Geometry

A box (buffer) geometry, with most attributes encoded in buffers so that they are more efficiently transported to your GPU.
  

##### inputs (3)

`width`: `number` _primitive_

The width of this box

`height`: `number` _primitive_

The height of this box

`depth`: `number` _primitive_

The depth of this box
  
##### outputs (1)

`geometry`: `object` _complex_

this particular geometry
  



## Lambert Material

A material for non-shiny surfaces, without specular highlights.The material uses a non-physically based Lambertian model for calculating reflectance. This can simulate some surfaces (such as untreated wood or stone) well, but cannot simulate shiny surfaces with specular highlights (such as varnished wood).Shading is calculated using a Gouraud shading model. This calculates shading per vertex (i.e. in the vertex shader) and interpolates the results over the polygon's faces.
  

##### inputs (0)


  
##### outputs (1)

`material`: `object` _complex_

An object with arbitrary keys and values
  



## Shader Material

A material rendered with custom shaders. A shader is a small program written in GLSL that runs on the GPU.You can use the directive #pragma unroll_loop in order to unroll a for loop in GLSL by the shader preprocessor. The directive has to be placed right above the loop. The loop should be formatted with the standard spec (normalized, var i, paren spacing)Additionally, all shader materials will be subscribed to global uniforms: `u_mouse` (vec2), `u_time` (float), and `u_resolution` (vec2)
  

##### inputs (3)

`vertex`: `string` _primitive_

Vertex shader for this shader material

`fragment`: `string` _primitive_

Fragment shader for this shader material

`transparent`: `boolean` _primitive_

Whether or not this material responds to an alpha component
  
##### outputs (1)

`material`: `object` _complex_

An object with arbitrary keys and values
  



## Render Scene

This node renders a WebGL scene, by default with a perspective camera
  

##### inputs (4)

`child`: `object` _complex_

Any scene element[s] to be added

`fx`: `object` _complex_

Post render pass(es)

`clearColor`: `RGBColor` _complex_

The renderer's clear color

`clearAlpha`: `number` _primitive_

The alpha component for the renderer's clear color
  
##### outputs (0)


  



## DuoSynth

A DuoSynth is a monophonic synth composed of two MonoSynths run in parallel with control over the frequency ratio between the two voices and vibrato effect.
  

##### inputs (5)

`frequency`: `number` _primitive_

The frequency control

`volume`: `number` _primitive_

The volume of the output in decibels

`harmonicity`: `number` _primitive_

Harmonicity is the ratio between the two voices. A harmonicity of 1 is no change. Harmonicity = 2 means a change of an octave.

`vibratoAmount`: `number` _primitive_

The amount of vibrato

`vibratoRate`: `number` _primitive_

The frequency of vibrato
  
##### outputs (1)

`out`: `Synth` _complex_

Resulting Synth
  



## Synth

A Synth is composed by routing an OmniOscillator through a AmplitudeEnvelope.
  

##### inputs (3)

`volume`: `number` _primitive_

The volume of the output in decibels

`oscillator`: `OscillatorType` _primitive_

The type of oscillator

`envelope`: `AmplitudeEnvelope` _complex_

The frequency of vibrato
  
##### outputs (1)

`out`: `Synth` _complex_

Resulting Synth
  



## Attack-Release

Trigger the attack and then the release after the duration.
  

##### inputs (5)

`synth`: `Synth` _complex_

The synth to use

`note`: `string` _primitive_

The frequency to play

`duration`: `time` _primitive_

The duration to play the note for

`time`: `time` _primitive_

When the note should be triggered

`call`: `Call` _primitive_

Certain nodes are designated 'callable', i.e. they are operator nodes. Sending a truthy call signal will invoke that node's handler over its parameters
  
##### outputs (1)

`draw`: `object` _complex_

An note / duration object that is signalled when this node triggers its attack
  



## Audio Master

Connect an audio node to the master audio output
  

##### inputs (1)

`node`: `AudioNode` _complex_

Any Audio node to connect to the audio master output
  
##### outputs (1)

`out`: `AudioNode` _complex_

The same node, connected to the master output
  



## Audio Panner

An equal power Left/Right stereo Panner
  

##### inputs (2)

`node`: `AudioNode` _complex_

The audio node to connect to this panner.

`pan`: `number` _primitive_

The pan control. -1 = hard left, 1 = hard right
  
##### outputs (2)

`out`: `Panner` _complex_

A node panned to the `pan` value

`node`: `AudioNode` _complex_

The node that was passed in, connected to the panner
  



## Feedback Delay

A DelayNode in which part of output signal is fed back into the delay
  

##### inputs (3)

`node`: `AudioNode` _complex_

The audio node to connect to this feedback delay

`delayTime`: `time` _primitive_

The delay applied to the incoming signal

`feedback`: `number` _primitive_

feedback The amount of the effected signal which is fed back through the delay.
  
##### outputs (2)

`out`: `FeedbackDelay` _complex_

The resulting FeedbackDelayNode

`node`: `AudioNode` _complex_

The node that was passed in, connected to the feedback delay
  



## Audio Delay

A node which is used to delay the incoming audio signal by a certain amount of time
  

##### inputs (2)

`node`: `AudioNode` _complex_

The audio node to connect to this feedback delay

`delayTime`: `number` _primitive_

An a-rate AudioParam representing the amount of delay to apply
  
##### outputs (2)

`out`: `AudioNode` _complex_

The resulting DelayNode

`node`: `AudioNode` _complex_

The node that was passed in, connected to the delay
  



## Audio Gain

The GainNode interface represents a change in volume. It is an AudioNode audio-processing module that causes a given gain to be applied to the input data before its propagation to the output
  

##### inputs (2)

`node`: `AudioNode` _complex_

The audio node to connect to this feedback delay

`gain`: `number` _primitive_

An a-rate AudioParam representing the amount of gain to apply
  
##### outputs (2)

`gain`: `Gain` _complex_

The resulting GainNode

`node`: `AudioNode` _complex_

The node that was passed in, connected to the gain
  



## Mapper


  

##### inputs (1)

`input`: `object` _complex_

An object with arbitrary keys and values
  
##### outputs (1)

`out`: `object` _complex_

An object with arbitrary keys and values
  



## Interval

A node which emits any value and a count at a regular time interval.
  

##### inputs (2)

`value`: `any` _primitive_

Any input to emit at this interval

`interval`: `number` _primitive_

The interval at which this node will emit, in miliseconds
  
##### outputs (2)

`count`: `number` _primitive_

The number of times this node has emitted so far.

`value`: `any` _primitive_

The input value passed in
  



## Set Note

Set the note for a Synth
  

##### inputs (4)

`synth`: `Synth` _complex_

The synth to use

`note`: `string` _primitive_

The frequency to set on the synth

`time`: `time` _primitive_

Time which the note should be set on the synth

`call`: `Call` _primitive_

Certain nodes are designated 'callable', i.e. they are operator nodes. Sending a truthy call signal will invoke that node's handler over its parameters
  
##### outputs (0)


  



## Time Loop

Set the note for a Synth
  

##### inputs (5)

`interval`: `time` _primitive_

The interval at which this node loops

`playbackRate`: `number` _primitive_

The playback rate of the loop. The normal playback rate is 1 (no change). A playbackRate of 2 would be twice as fast

`iterations`: `number` _primitive_

The number of iterations of the loop. The default value is Infinity (loop eternally)

`mute`: `boolean` _primitive_

Muting the Loop means that no callbacks are invoked

`humanize`: `boolean` _primitive_

Random variation +/-0.01s to the scheduled time. Or give it a time value which it will randomize by
  
##### outputs (1)

`i`: `number` _primitive_

The number of times this node has looped so far.
  



## Start Transport

Start a transport time. This will put all Transport time schedules into motion
  

##### inputs (1)

`transport`: `object` _complex_

The Transport Time to start
  
##### outputs (0)


  



## Transport Time

Transport for timing musical events. Supports tempo curves and time changes. Unlike event-loop timing (IntervalNode), events backed by this scheduler need to specify the exact time of their schedules.   It is useful to think of there only being one governing Transport Time for your whole graph, i.e. don't define more than one of these, or if you do, recognize that you are modifying a single global transport time.
  

##### inputs (1)

`bpm`: `number` _primitive_

The tempo to set for this transport. See the docs on the time type to understand how time can be expressed in terms of metered time.
  
##### outputs (1)

`out`: `object` _complex_

Resulting transport
  



## Connect

Connect one audio node to another
  

##### inputs (2)

`from`: `AudioNode` _complex_

Connect from any audio node

`to`: `AudioNode` _complex_

Connect to any audio node
  
##### outputs (2)

`from`: `AudioNode` _complex_

The same node, connected

`to`: `AudioNode` _complex_

The same node, connected
  



## Context Destination

The current context destination
  

##### inputs (0)


  
##### outputs (1)

`node`: `AudioNode` _complex_

The current context destination node
  



## To Context Dest.

Connect an audio node to audio context destination
  

##### inputs (1)

`node`: `AudioNode` _complex_

Any Audio node to connect to the context destination
  
##### outputs (1)

`out`: `AudioNode` _complex_

The same node, connected to the context destination
  



## Piano

A virtual Salamander grand piano as a Tone Node
  

##### inputs (0)


  
##### outputs (1)

`out`: `AudioNode` _complex_

A piano node
  



## Arpeggiate

Arpeggiate between the given notes in a number of patterns
  

##### inputs (4)

`notes`: `object` _complex_

Notes to arpeggiate over

`interval`: `time` _primitive_

The interval at which this node loops

`pattern`: `Pattern` _primitive_

A basic `string` type.

`humanize`: `boolean` _primitive_

Random variation +/-0.01s to the scheduled time. Or give it a time value which it will randomize by
  
##### outputs (2)

`note`: `string` _primitive_

The note

`time`: `time` _primitive_

Time accompanying the note
  



## Audio Compressor

A node which compresses signals from its origin. Compression reduces the volume of loud sounds or amplifies quiet sounds by narrowing or "compressing" an audio signal's dynamic range.
  

##### inputs (3)

`node`: `AudioNode` _complex_

The audio node to connect to this compressor.

`threshold`: `number` _primitive_

The value above which the compression starts to be applied.

`ratio`: `number` _primitive_

The gain reduction ratio
  
##### outputs (2)

`out`: `Compressor` _complex_

The compressor node

`node`: `AudioNode` _complex_

The node that was passed in, connected to the compressor
  



## Reverb

A Reverb based on Freeverb (https://ccrma.stanford.edu/~jos/pasp/Freeverb.html).
  

##### inputs (3)

`node`: `AudioNode` _complex_

The audio node to connect to this reverb node

`dampening`: `time` _primitive_

The amount of dampening of the reverberant signal

`roomSize`: `number` _primitive_

The roomSize value between [0,1]. A larger roomSize will result in a longer decay
  
##### outputs (2)

`out`: `Reverb` _complex_

The resulting Reverb Node

`node`: `AudioNode` _complex_

The node that was passed in, connected to the reverb
  



## Remote Player

Play a sound file from a remote source
  

##### inputs (3)

`url`: `url` _primitive_

the url to fetch the sound file from.

`call`: `Call` _primitive_

Certain nodes are designated 'callable', i.e. they are operator nodes. Sending a truthy call signal will invoke that node's handler over its parameters

`loop`: `boolean` _primitive_

Whether or not the player should loop its contents indefinitely
  
##### outputs (1)

`player`: `Player` _complex_

The player node
  



## Audio Volume

A simple volume node, useful for creating a volume fader.
  

##### inputs (2)

`node`: `AudioNode` _complex_

The audio node to connect to this Volume node.

`volume`: `number` _primitive_

The volume, in decibels
  
##### outputs (2)

`out`: `Volume` _complex_

The volume node

`node`: `AudioNode` _complex_

The node that was passed in, connected to this volume node
  



## SoundFont

A virtual instrument
  

##### inputs (5)

`name`: `string` _primitive_

[object Object]

`attack`: `number` _primitive_

The attack to use for this instrument

`decay`: `number` _primitive_

The decay to use for this instrument

`release`: `number` _primitive_

The release to use for this instrument

`sustain`: `number` _primitive_

The sustain to use for this instrument
  
##### outputs (1)

`out`: `SoundFont` _complex_

Resulting SoundFont
  



## SoundFont Player

A Node which plays tone data to a SoundFont instrument
  

##### inputs (4)

`soundFont`: `SoundFont` _complex_

The particular sound font to use.

`toneData`: `ToneData` _complex_

Data fed in through this channel will be sent to the sound font instrument to play

`midiData`: `MidiData` _complex_

Data fed in through this channel will be sent to the sound font instrument to play

`midiDevice`: `MidiInput` _complex_

Optionally attach a midi input to this node to send signals to the soundfont
  
##### outputs (0)


  



## Divide

Divide one number by another
  

##### inputs (2)

`dividend`: `number` _primitive_

A basic `number` type.

`divisor`: `number` _primitive_

A basic `number` type.
  
##### outputs (1)

`result`: `number` _primitive_

A basic `number` type.
  



## Sum

Sum across numbers
  

##### inputs (1)

`numbers`: `number` _primitive_

All numbers to add together
  
##### outputs (1)

`result`: `number` _primitive_

Sum
  



## Product

Multiply over numbers
  

##### inputs (1)

`numbers`: `number` _primitive_

All numbers to multiply together
  
##### outputs (1)

`result`: `number` _primitive_

Product
  



## Math: Int -> Int

Admittedly a node borne of laziness -- given a standard int -> int math operation name, this node performs that operation over its single input. Constants are included. Full signature list in MathFnIntInt help.
  

##### inputs (2)

`fn`: `MathFnIntInt` _primitive_

[object Object]

`in`: `number` _primitive_

A basic `number` type.
  
##### outputs (1)

`result`: `number` _primitive_

A basic `number` type.
  



## Color

A color representation
  

##### inputs (3)

`r`: `number` _primitive_

red channel

`g`: `number` _primitive_

green channel

`b`: `number` _primitive_

blue channel
  
##### outputs (2)

`hex`: `number` _primitive_

hex representation of this color

`rgb`: `RGBColor` _complex_

rgb representation
  



## Directional Light

A focused light, intended to be added to a scene
  

##### inputs (1)

`color`: `RGBColor` _complex_

The color of this directional light
  
##### outputs (1)

`light`: `object` _complex_

The directional light source
  



## Ambient Light

An ambient light, intended to be added to a scene
  

##### inputs (1)

`color`: `RGBColor` _complex_

The color of this ambient light
  
##### outputs (1)

`light`: `object` _complex_

The ambient light source
  



## Glitch Pass

A holy perturbation
  

##### inputs (1)

`delay`: `Vec2` _complex_ default: `{"x":0,"y":0}`

the min and max delay between glitches, as a 2d vector in second units
  
##### outputs (1)

`glitch`: `object` _complex_

glitchy pass
  



## Scanline Pass

A scanline post-process effect
  

##### inputs (0)


  
##### outputs (2)

`pass`: `object` _complex_

a scanline pass

`effect`: `object` _complex_

the effect itself
  



## DotScreen Pass

A Dot-screen post-process effect
  

##### inputs (0)


  
##### outputs (2)

`pass`: `object` _complex_

a dotscreen pass

`effect`: `object` _complex_

the effect itself
  



## Vignette Pass

A Vignette post-process effect
  

##### inputs (3)

`opacity`: `number` _primitive_

The vignette opacity [0,1]

`offset`: `number` _primitive_

The vignette offset [0,1]

`darkness`: `number` _primitive_

The vignette darkness [0,1]
  
##### outputs (2)

`pass`: `object` _complex_

a vignette pass

`effect`: `object` _complex_

the effect itself
  



## Noise Pass

A noise post-process effect
  

##### inputs (1)

`opacity`: `number` _primitive_

the blending opacity
  
##### outputs (2)

`pass`: `object` _complex_

a noise pass

`effect`: `object` _complex_

the effect itself
  



## Vector 3D

A two dimensional vector with x y and y components
  

##### inputs (3)

`x`: `number` _primitive_

A basic `number` type.

`y`: `number` _primitive_

A basic `number` type.

`z`: `number` _primitive_

A basic `number` type.
  
##### outputs (1)

`out`: `Vec3` _complex_ default: `{"x":0,"y":0,"z":0}`

A 3D Vector with keys `x`, `y` and `z`
  



## AND

Logical AND over inputs
  

##### inputs (1)

`input`: `any` _primitive_

Any set of members to logical `AND` over
  
##### outputs (1)

`result`: `number` _primitive_

Logical and of inputs
  



## OR

Logical OR over inputs
  

##### inputs (1)

`input`: `any` _primitive_

Any set of members to logical `OR` over
  
##### outputs (1)

`result`: `number` _primitive_

Logical OR of inputs
  



## Not

logical not
  

##### inputs (1)

`in`: `any` _primitive_

anything. negation follows regular js semantics
  
##### outputs (1)

`result`: `boolean` _primitive_

A basic `boolean` type.
  



## Equals

Strict equals operator
  

##### inputs (1)

`input`: `any` _primitive_

Any set of members to perform strict equals over
  
##### outputs (1)

`result`: `number` _primitive_

Logical equals over inputs
  



## Performance RNN

Sample an RNN model trained on the Yamaha e-Piano Competition dataset
  

##### inputs (5)

`scale`: `PitchHistogram` _primitive_

This pitch distribution will be used as a tonic to condition this model

`density`: `number` _primitive_

A density conditioning variable between 0-6 that serves as a directive for how many notes will be generated per step, in exponential scale. i.e. notes generated per step will be 2^density

`stepsPerSecond`: `number` _primitive_

number of steps per second. effectively a tempo measure for note generation / playback

`synth`: `Synth` _complex_

Optionally attach a synth to this node and trigger its attack / release

`midiOut`: `MidiOut` _complex_

Optionally attach a midi output to this node and send midi signals to that device
  
##### outputs (2)

`midiData`: `object` _complex_

midi data out

`toneData`: `ToneData` _complex_

tone out node
  



## InfoLog

Log any inputs as they come to console info
  

##### inputs (1)

`anything`: `any` _primitive_

Anything you would like to log
  
##### outputs (1)

`anything`: `any` _primitive_

The input, passed through
  



## Music Scale

A Musical scale
  

##### inputs (2)

`tonic`: `string` _primitive_

The tonic for this scale, e.g. "C" or "Ab4". You can optionally specify the scale name here too, and omit the name input, e.g. "C minor pentatonic" See the name param info for possible scale names.

`name`: `string` _primitive_

[object Object]
  
##### outputs (2)

`notes`: `object` _complex_

The notes in this scale

`intervals`: `object` _complex_

The intervals between notes in this scale
  



## Scale Chroma

A chroma representation of a pitchset as a 12-digit binary array, with each index presenting one semitone of the octave
  

##### inputs (1)

`notes`: `object` _complex_

A list of notes to compute a chroma for
  
##### outputs (1)

`chroma`: `object` _complex_

the chroma output: 12-digit binary array, with each index presenting one semitone of the octave
  



## Music Chord

A Chord
  

##### inputs (2)

`tonic`: `string` _primitive_

The tonic for this scale, e.g. "C" or "Ab4". You can optionally specify the chord name here too, and omit the name input, e.g. "EMaj7" See the name param info for recognized chord names.

`name`: `string` _primitive_

[object Object]
  
##### outputs (2)

`notes`: `object` _complex_

The notes in this chord

`intervals`: `object` _complex_

The intervals between notes in this chord
  



## Transpose

Transpose a note by an interval. e.g. transpose(A4, M3) -> C#5 
  

##### inputs (2)

`note`: `string` _primitive_

The note to transpose. This can be abstract or a concrete pitch, i.e. C or C4

`interval`: `string` _primitive_

The interval to transpose by, e.g. P5 or M3
  
##### outputs (1)

`out`: `string` _primitive_

The note, transposed by the interval
  



## Key Triads

Triads For a Key
  

##### inputs (1)

`key`: `string` _primitive_

The name of the key (a tonic + a mode), e.g. C major, Db dorian
  
##### outputs (1)

`notes`: `object` _complex_

Triad lead-sheet symbols for this key
  



## Midi Out

A midi output device. If no id / name are provided, the first midi device found will be used
  

##### inputs (1)

`id`: `string` _primitive_

The midi out device id *or* name. The first matching one will be used in the case of collisions
  
##### outputs (1)

`device`: `object` _complex_

The midi output, or none if none were found
  



## Midi In

A midi input device. If no id / name are provided, the first midi device found will be used
  

##### inputs (1)

`id`: `string` _primitive_

The midi in device id *or* name. The first matching one will be used in the case of collisions
  
##### outputs (1)

`device`: `object` _complex_

The midi input, or none if none were found
  



## JSON Parse

Parse a string into an object
  

##### inputs (1)

`in`: `string` _primitive_

String serialization
  
##### outputs (1)

`out`: `object` _complex_

Parsed object
  



## Extract

Extract a value from an object
  

##### inputs (2)

`from`: `object` _complex_

Object to extract from

`get`: `string` _primitive_

The key to get. You can traverse an object with dot notation, i.e. 'foo.bar'
  
##### outputs (1)

`out`: `any` _primitive_

The extracted value, or `undefined`
  



## Stephen Wolfram

Stephen Wolfram is an operator that, when given a 1D cellular automata rule number [0-255] and a binary representation of the world, outputs the subsequent state of the world according to that rule. He can do this indefinitely and is, in fact, Earth's first eternal human.
  

##### inputs (3)

`rule`: `number` _primitive_

The rule number. Given a binary state and two neighbors (2^3 states), a transition rule set can be encoded with a binary number with each digit slot representing the next state of that configuration (2^(2^3) rule sets).

`initialState`: `any` _primitive_

He doesn't know or care where it comes from, but Wolfram needs an initial state in order to operate. His world is probably circular, so the first index and last index are assumed to be neighbors for rule application. Both binary strings and binary arrays are acceptable.

`call`: `Call` _primitive_

Certain nodes are designated 'callable', i.e. they are operator nodes. Sending a truthy call signal will invoke that node's handler over its parameters
  
##### outputs (1)

`out`: `any` _primitive_

The resulting binary array
  



## History

Buffer values from input into a linear history. If memory capacity is reached, oldest memories are forgotten first.
  

##### inputs (2)

`capacity`: `number` _primitive_

The max number of events to remember. Omitting this means no limit

`value`: `any` _primitive_

Any value. This will be pushed into a memory queue in the output
  
##### outputs (1)

`out`: `any` _primitive_

The memory queue, from oldest to youngest.
  



## Join

Join an array of values together with a separator
  

##### inputs (2)

`array`: `object` _complex_

Array of any data. Ideally this data is string serializable.

`separator`: `string` _primitive_

Separator string to join elements together with
  
##### outputs (1)

`out`: `string` _primitive_

The joined array, as a string
  



## Regex Replace

Replace a regex match with something else
  

##### inputs (3)

`string`: `string` _primitive_

The string over which to perform the replace

`regex`: `string` _primitive_

the regexp

`replacement`: `string` _primitive_

The string to replace matches with
  
##### outputs (1)

`out`: `string` _primitive_

The joined array, as a string
  



## HTML Element

A node that renders HTML to the screen
  

##### inputs (3)

`html`: `string` _primitive_

The html for this element

`text`: `string` _primitive_

The inner text of this element

`style`: `string` _primitive_

The style attribute for this node
  
##### outputs (0)


  



## Plus

A plus operator. Usable with both strings and numbers.
  

##### inputs (2)

`left`: `any` _primitive_

left hand side

`right`: `any` _primitive_

right hand side
  
##### outputs (1)

`out`: `any` _primitive_

The result
  



## number


  

##### inputs (0)


  
##### outputs (1)

`out`: `number` _primitive_

A basic `number` type.
  



## string


  

##### inputs (0)


  
##### outputs (1)

`out`: `string` _primitive_

A basic `string` type.
  



## boolean


  

##### inputs (0)


  
##### outputs (1)

`out`: `boolean` _primitive_

A basic `boolean` type.
  



## date


  

##### inputs (0)


  
##### outputs (1)

`out`: `date` _primitive_ default: `"2019-06-24T21:34:27.328Z"`

A basic `date` type.
  
    
