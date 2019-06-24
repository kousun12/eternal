<p align="center">👾 welcome to the eternal 👾</p>

<p align="center"><a href="https://kousun12.github.io/eternal">~~ demo ~~</a></p>

This project was created for gratuitous reasons; it’s an attempt to serve an aesthetic that I appreciate, over a medium which I feel is appropriate for its expression. 

Having spent a lot of time / mind in and around computers, my sense of aesthetics has something to do with not only the things-in-themselves, but their representations, specifically as information processes, i.e. programs. Complex phenomena which are beautiful but also succinctly describable have beauty in both perceptual and abstract senses. This project is one which allows one to describe audio/visual processes as programs, encoded as a visual graph. You can think of it as an extension of Sol LeWitt's process art or Brian Eno's idea of "music as gardening".

##### aside

I've, since making this, discovered tools like max/msp / houdini & many more extremely well thought out versions of this as a tool. While I still like some aspects of this as a tool that those others do not have, note that _this defintely more of an art project than a product._ It was made to juxtapose representations with perceptions, and while you can probably make arbitrary things with it, you will find many other better supported tools that aren't created out of my specific interests. Nevertheless, enjoy. 

<br/><p align="center"><img src="https://i.redd.it/p95xbsfvz4631.png" alt="nude-shot"></p><br/>


<br/><p align="center"><img src="eternal.png" alt="screenshot"></p><br/>

#### examples // myths

There are several example graphs that can be loaded from within the app itself. `cmd|ctrl + e`; you may need to zoom out to fit some graphs `cmd + -`:

###### [nude, eternally](https://kousun12.github.io/eternal?e=nude%2C%20eternally)
this is radiohead, forever. `thom yorke` eternally over `EMaj7 - AMaj9 - G#m7`. don't get any big ideas. an indeterminate, irreducible arpeggio, in 78 nodes.
<details>
  <summary>desc</summary>
  Demonstrates raw synths (sawtooth, sine, triangle), remote sound file loading, music chords, arpeggiators, transport time, raw fragment shaders in glsl. 
</details>


###### [in the gardens of eden](https://kousun12.github.io/eternal?e=in%20the%20gardens%20of%20eden)
et in arcadia, eno. [`brian`](https://www.edge.org/conversation/brian_eno-composers-as-gardeners) plants his seeds as he dreams of aristotle's `prime mover`. along the tides in `C`s of entropy, `terry`'s decomposing soul fertilizes the lilies.
<details>
  <summary>desc</summary>
  Demonstrates musical scheduling and delays, raw fragment shaders in glsl.
</details>

###### [platonic plague](https://kousun12.github.io/eternal?e=platonic%20plague)
manifold<br>
to the realm of forms<br>
man, i fold<br>
to fidelity
<details>
  <summary>desc</summary>
  Demonstrates rendering geometries, material, mesh, lights, within a scene & post processing effects.
</details>

###### [the music while the music lasts](https://kousun12.github.io/eternal?e=the+music+while+the+music+lasts)
i do not know much about gods; but i think that the river<br>
is a strong brown god - sullen, untamed and intractable<br>
i do not know much about the gods<br>
but i bet they sing aloud in the silence of space
<details>
  <summary>desc</summary>
  Demonstrates music scale / chroma, RNN model, raw fragment shaders in glsl.
</details>

###### [stephen wolfram](https://kousun12.github.io/eternal?e=stephen+wolfram)
Stephen Wolfram is an operator that, when given a 1D cellular automata rule number [0-255] and a representation of the world, outputs the subsequent state of the world according to that rule. He will do this indefinitely and is, in fact, Earth's first eternal human.
<details>
  <summary>desc</summary>
  Demonstrates cellular automata, dom rendering, string manipulation, regular interval
</details>

###### [shaders](https://kousun12.github.io/eternal?e=shaders)
sisyphus walks the color tensor, in `YUV`

###### [etc...](https://kousun12.github.io/eternal)
and so on, until the ends.

<br/><p align="center"><img src="public/sierpinski.gif" alt="sierpinskiksnipreis"></p><br/>


#### Development
This might smell in some ways like consumer software, but you should understand it as an art project. While I believe that there's a place for something like this (a flow-based-programming inspired audio / visual creative tool), this has been made only as an aesthetic exploration; I don't intend to support it in any way, but you should feel at liberty to do with it what you please.

`npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

`yarn build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes

`yarn deploy`

Run the gh-pages deploy script

