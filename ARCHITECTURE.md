# Eternal Architecture Documentation

## Project Overview

**Eternal** is a node-based visual programming environment designed for audio and visual composition. It represents a unique synthesis of functional programming concepts with spatial, graph-based interfaces, allowing users to create complex audio-visual experiences through visual composition of computational nodes.

The project embodies the philosophy that "all art can be described via programs" and treats programming as a creative, gardening-like activity. It enables users to compose audio-visual processes as visual graphs, where each node represents a computational unit and connections define data flow between operations.

### Key Characteristics

- **Visual Programming Interface**: Programs are represented as spatial graphs rather than textual code
- **Real-time Composition**: Live coding capabilities with immediate feedback and parameter exploration
- **Multi-domain Integration**: Seamlessly combines audio synthesis, 3D graphics, mathematical operations, and machine learning
- **Functional Composition**: Based on functional programming principles with reactive data flow
- **Browser-based**: Runs entirely in modern web browsers using Web APIs

## Core Technologies

### Frontend Framework
- **React 18.2.0**: Component-based UI architecture with hooks and modern React patterns
- **Redux**: Centralized state management using the ducks pattern for organization
- **Blueprint.js 3.19.0**: Professional UI component library for consistent interface elements

### Graphics and Audio
- **Three.js 0.148.0**: WebGL-based 3D graphics rendering and scene management
- **Tone.js 13.8.34**: Web Audio API abstraction for audio synthesis and processing
- **Postprocessing 6.29.1**: Advanced post-processing effects for 3D scenes

### Development Tools
- **Flow**: Static type checking for JavaScript with comprehensive type definitions
- **Create React App**: Build system and development server configuration
- **ESLint & Prettier**: Code quality and formatting tools

### Specialized Libraries
- **TensorFlow.js**: Machine learning and neural network capabilities
- **WebMIDI**: MIDI device integration for musical input/output
- **Tonal**: Music theory utilities for harmonic and melodic operations

## Architectural Patterns

### Model-View-Controller (MVC)
The application follows a clear MVC pattern:
- **Models**: Core data structures (`NodeBase`, `Graph`, `Edge`, `AttributeType`)
- **Views**: React components for UI rendering and user interaction
- **Controllers**: Redux actions and reducers for state management

### Plugin Architecture
The node system uses a plugin-based architecture where:
- Each node type extends the base `NodeBase` class
- Nodes are dynamically registered and instantiated
- New node types can be added without modifying core system code

### Reactive Programming
- **Data Flow**: Changes propagate automatically through the node graph
- **Caching**: Output values are cached to prevent unnecessary recomputation
- **Live Updates**: UI reflects changes in real-time as users modify parameters

### Functional Composition
- **Immutable State**: Redux state is managed immutably
- **Pure Functions**: Node computations are designed as pure functions where possible
- **Declarative**: Graph structure declares the computation rather than imperative steps

## Directory Organization

The codebase is organized into logical modules that separate concerns:

```
src/
├── models/           # Core data models and business logic
├── components/       # React UI components
├── redux/           # State management (actions, reducers, selectors)
├── utils/           # Utility functions and helpers
├── threeUtil/       # Three.js specific utilities
├── vendor/          # Third-party code modifications
└── performance/     # Performance monitoring and optimization
```

### Key Configuration Files
- **package.json**: Dependencies, scripts, and project metadata
- **.flowconfig**: Flow type checker configuration
- **jsconfig.json**: JavaScript compiler options with baseUrl set to `src/`
- **deploy.sh**: Automated deployment script for GitHub Pages

## Application Entry Points

### Main Application (`App.js`)
The root component orchestrates:
- Graph rendering and interaction
- Keyboard shortcuts and hotkeys
- Modal dialogs and search interfaces
- File import/export functionality

### Bootstrap (`index.js`, `boot.js`)
- React application mounting
- Redux store initialization
- Service worker registration
- Global polyfills and vendor setup

## Build and Deployment

### Development Workflow
- **Start**: `yarn start` - Development server with hot reloading
- **Build**: `yarn build` - Production build with optimization
- **Deploy**: `yarn deploy` - GitHub Pages deployment via gh-pages

### Type Checking
- Flow type checking integrated into development workflow
- Comprehensive type definitions for all major components
- Static analysis helps prevent runtime errors

### Asset Management
- Static assets served from `public/` directory
- Audio samples, textures, and example graphs included
- Optimized build process with Create React App

## Core Architecture Components

The heart of Eternal's architecture lies in its node-based computation system, built around four fundamental classes that work together to create a flexible, reactive programming environment.

### NodeBase (`/src/models/NodeBase.js`)

**NodeBase** is the abstract foundation class for all computational nodes in the system. It implements the core node lifecycle and provides the infrastructure for reactive computation.

#### Key Features:
- **Generic Type System**: Uses Flow generics `<Val, In, Out>` for state, input, and output types
- **Unique Identity**: Each node has a UUID for graph-wide identification
- **State Management**: Maintains internal state separate from props (external parameters)
- **Connection Management**: Tracks input and output edges with lifecycle hooks
- **Output Caching**: Implements intelligent caching to prevent unnecessary recomputation
- **Reactive Updates**: Automatically propagates changes through the computation graph

#### Core Properties:
```javascript
class NodeBase<Val: Object, In: ?Object, Out: ?Object> {
  +id: string;              // Unique identifier
  state: Val;               // Internal node state
  props: $Shape<In>;        // External parameters
  inputs: Edge[] = [];      // Incoming connections
  outputs: Edge[] = [];     // Outgoing connections
  outputCache = {};         // Cached computation results
  live: boolean = false;    // Execution state
}
```

#### Lifecycle Hooks:
- `onAddToGraph()`: Called when node is added to a graph
- `willBecomeLive()`: Fired when all inputs are connected
- `willBeRemoved()`: Cleanup before removal from graph
- Connection hooks for before/after connect/disconnect events

#### Processing Model:
The `process(keys)` method is the core computation function that each node type must implement. It receives a list of output keys to compute and returns the calculated values. The `_process()` method wraps this with caching logic, only forwarding values that have changed.

### Graph (`/src/models/Graph.js`)

**Graph** serves as the container and orchestrator for the entire node network, managing nodes, edges, and their spatial relationships.

#### Key Responsibilities:
- **Node Management**: Add, remove, and track nodes with spatial positioning
- **Edge Management**: Maintain connections between nodes
- **Serialization**: Convert graphs to/from JSON for persistence
- **Spatial Coordination**: Track node positions for visual representation
- **Graph Operations**: Provide utilities for graph traversal and manipulation

#### Core Structure:
```javascript
class Graph {
  id: string;                           // Unique graph identifier
  name: string = 'untitled';           // Human-readable name
  nodes: NodeInSpace[] = [];           // Nodes with positions
  _nodesById: { [string]: NodeInSpace }; // Fast node lookup
  edges: Edge[] = [];                  // All connections
  meta: MetaData = {};                 // Zoom and other metadata
}
```

#### Serialization Support:
The graph implements comprehensive serialization through the `GraphSerialization` type, enabling:
- Save/load functionality for user compositions
- Example graph distribution
- Version control and sharing capabilities

### Edge (`/src/models/Edge.js`)

**Edge** represents the connections between nodes, defining how data flows through the computation graph.

#### Connection Model:
```javascript
class Edge {
  id: string;           // Unique edge identifier
  from: AnyNode;        // Source node
  to: AnyNode;          // Destination node
  fromPort: string;     // Output port name
  toPort: string;       // Input port name
}
```

#### Data Flow Functions:
- `outDataFor(data)`: Transforms output data for transmission
- `inDataFor(change)`: Extracts relevant input data
- `notify()`: Triggers update notifications through the graph

#### Serialization:
Edges can be serialized to `EdgeSerialization` format, storing node IDs and port names for reconstruction during graph loading.

### AttributeType (`/src/models/AttributeType.js`)

**AttributeType** implements the type system that governs data flow and validation throughout the node graph.

#### Type System Features:
- **Flexible Types**: Supports primitives, enums, and complex object types
- **Runtime Validation**: Parse and serialize functions for type safety
- **Schema Definition**: Nested type definitions for complex data structures
- **Default Values**: Automatic initialization of typed attributes
- **Metadata Support**: Additional type configuration and constraints

#### Type Categories:
```javascript
type TypeType = 'primitive' | 'enum' | 'complex';
```

#### Core Interface:
```javascript
interface AttributeType {
  id: Symbol;                    // Runtime unique identifier
  name: string;                  // Type name (lowercase for primitives)
  typeDescription: Node;         // React component for type documentation
  description: ?Node;            // Attribute-specific description
  schema: ?AttributeSchema;      // Nested type definition
  defaultValue: any;             // Default initialization value
  parse: any => any;             // Input validation/transformation
  serialize: ?(any) => any;      // Output serialization
}
```

### Component Relationships

The four core components work together in a carefully orchestrated system:

1. **Graph** contains multiple **NodeBase** instances positioned in space
2. **Edge** objects connect **NodeBase** inputs to outputs, defining data flow
3. **AttributeType** governs the types of data that flow through **Edge** connections
4. **NodeBase** uses **AttributeType** definitions to validate inputs and outputs
5. **Graph** serialization preserves the entire network structure for persistence

This architecture enables:
- **Dynamic Graph Construction**: Nodes and edges can be added/removed at runtime
- **Type Safety**: AttributeType system prevents incompatible connections
- **Reactive Updates**: Changes propagate automatically through the graph
- **Visual Programming**: Spatial positioning enables intuitive graph editing
- **Extensibility**: New node types can be added without modifying core classes

## Technology Stack

Eternal leverages a carefully curated set of modern web technologies to deliver a powerful node-based programming environment. The technology stack is organized around core domains: UI framework, graphics rendering, audio processing, state management, type safety, and specialized libraries.

### Frontend Framework & UI

#### React Ecosystem
- **React 18.2.0**: Modern React with concurrent features, hooks, and improved performance
- **React DOM 16.10.2**: DOM rendering layer for React components
- **React Redux 7.1.1**: Official React bindings for Redux state management
- **Redux Starter Kit 0.7.0**: Opinionated Redux utilities for simplified state management

#### UI Component Libraries
- **Blueprint.js 3.19.0**: Professional React UI toolkit providing consistent, accessible components
  - `@blueprintjs/core`: Core components (buttons, inputs, dialogs, etc.)
  - `@blueprintjs/select`: Advanced selection components
- **React Select 1.3.0**: Flexible select input control with search and multi-select capabilities
- **React Draggable 4.0.3**: Drag and drop functionality for node positioning

#### UI Enhancement Libraries
- **FontAwesome 5.5.0**: Comprehensive icon library with React integration
  - `@fortawesome/fontawesome-free`: Free icon set
  - `@fortawesome/react-fontawesome`: React component wrapper
- **React Syntax Highlighter 11.0.2**: Code syntax highlighting for JavaScript nodes
- **React Textarea Autosize 7.1.0**: Auto-resizing text areas for better UX

### Graphics & 3D Rendering

#### Three.js Ecosystem
- **Three.js 0.148.0**: Comprehensive 3D graphics library built on WebGL
  - Scene management and 3D object rendering
  - Material and lighting systems
  - Geometry generation and manipulation
  - Camera controls and animation

#### Post-Processing
- **Postprocessing 6.29.1**: Advanced post-processing effects for Three.js scenes
  - Shader-based visual effects (glitch, scanline, dot screen, vignette, noise)
  - Compositing and render pass management
  - Performance-optimized effect chains

### Audio Processing & Music

#### Web Audio Framework
- **Tone.js 13.8.34**: Comprehensive Web Audio API framework for audio synthesis
  - Synthesizers, effects, and audio routing
  - Transport and timing systems
  - Audio analysis and visualization
  - MIDI integration capabilities

#### Music Theory & Instruments
- **Tonal 4.8.0**: Music theory library for harmonic analysis and composition
  - `tonal-detect`: Chord and scale detection
  - `tonal-key`: Key signature analysis
  - `tonal-scale`: Scale generation and analysis
  - `tonal-pcset`: Pitch class set operations
- **SoundFont Player 0.11.0**: General MIDI instrument playback
- **Tone Piano 0.0.12**: High-quality piano sample library
- **WebMIDI 3.0.25**: MIDI device integration for hardware controllers

### State Management & Data Flow

#### Redux Architecture
- **Redux Starter Kit 0.7.0**: Modern Redux with simplified boilerplate
  - Immutable state updates with Immer
  - Redux Toolkit Query for data fetching
  - DevTools integration

#### Utility Libraries
- **Lodash 4.17.21**: Comprehensive utility library for data manipulation
  - Functional programming utilities
  - Object and array manipulation
  - Performance-optimized operations
- **Flux 3.1.3**: Unidirectional data flow architecture

### Type Safety & Development Tools

#### Static Type Checking
- **Flow 0.81.0**: Static type checker for JavaScript
  - Gradual typing system
  - Generic type support
  - Interface definitions
  - Runtime type validation

#### Build System & Tooling
- **React Scripts 5.0.1**: Create React App build system
  - Webpack configuration
  - Babel transpilation
  - Development server with hot reloading
  - Production optimization

#### Code Quality
- **ESLint**: Code linting with React-specific rules
- **Prettier 1.18.2**: Code formatting for consistent style
- **Patch Package 6.2.0**: NPM package patching for custom modifications

### Machine Learning & AI

#### TensorFlow Integration
- **TensorFlow.js Core 1.2.11**: Machine learning capabilities in the browser
  - Neural network construction and training
  - Pre-trained model loading
  - GPU acceleration via WebGL
  - Integration with audio and visual processing nodes

### Specialized Libraries

#### Search & Discovery
- **Fuzzy Search 2.1.0**: Intelligent search functionality for node discovery
- **React Base16 Styling 0.6.0**: Consistent color theming system

#### File Processing & Utilities
- **Node Sass 8.0.0**: Sass/SCSS compilation for advanced styling
- **JSON Loader 0.5.7**: JSON file processing and loading
- **CSS Loader 0.28.7**: CSS module processing

#### Polyfills & Compatibility
- **Babel Polyfill 6.26.0**: ES6+ feature support for older browsers
- **Regenerator Runtime 0.11.0**: Async/await support
- **React Lifecycles Compat 3.0.4**: Compatibility layer for React lifecycle methods

### Development & Deployment

#### Version Control & Deployment
- **gh-pages 4.0.0**: GitHub Pages deployment automation
- **Webpack Assets Manifest 5.1.0**: Asset tracking for production builds

#### Runtime Requirements
- **Node.js 16.x**: Specified engine version for development and build processes
- **Modern Browser Support**: Targets browsers with >0.2% usage, excluding IE ≤ 11

### Architecture Integration

The technology stack is architected to support Eternal's core requirements:

1. **Real-time Performance**: Three.js and Tone.js provide hardware-accelerated graphics and audio
2. **Type Safety**: Flow ensures reliable data flow through the node graph
3. **Reactive Updates**: Redux and React enable efficient state propagation
4. **Extensibility**: Modular architecture allows easy addition of new node types
5. **Professional UI**: Blueprint.js provides consistent, accessible interface components
6. **Cross-platform**: Web-based deployment ensures broad compatibility

This carefully balanced stack enables Eternal to deliver professional-grade creative tools while maintaining the flexibility and accessibility of web technologies.

## Directory Structure

The Eternal codebase is organized into a logical hierarchy that separates concerns and promotes maintainability. The source code is primarily contained within the `src/` directory, with each subdirectory serving a specific architectural purpose.

### Root Source Directory (`/src`)

The main source directory contains the application entry points and global configuration:

```
src/
├── App.js              # Main application component with routing and global state
├── App.css             # Global application styles
├── App.test.js         # Application-level tests
├── index.js            # React application entry point
├── boot.js             # Application bootstrap and initialization
├── types.js            # Global Flow type definitions
├── eternal.scss        # Main stylesheet with design system
└── serviceWorker.js    # Progressive Web App service worker
```

### Core Data Models (`/src/models`)

Contains the fundamental data structures and business logic that power the node-based system:

```
models/
├── NodeBase.js         # Abstract base class for all computational nodes
├── Graph.js            # Graph container managing nodes and edges
├── Edge.js             # Connection system between node inputs/outputs
├── AttributeType.js    # Type system for data validation and flow
├── nodes/              # 96+ node implementations (detailed below)
├── examples/           # Pre-built example graphs and compositions
└── types/              # Additional type definitions and schemas
```

#### Core Model Responsibilities:
- **NodeBase.js**: Provides the foundation for all nodes with lifecycle management, caching, and reactive updates
- **Graph.js**: Manages the spatial arrangement of nodes and their connections with serialization support
- **Edge.js**: Handles data flow between nodes with type validation and change propagation
- **AttributeType.js**: Implements the type system that governs data compatibility and validation

### Node Implementations (`/src/models/nodes`)

The heart of Eternal's functionality, containing 96+ specialized node types organized by domain:

```
nodes/
├── index.js            # Node registry and export management
├── primitives.js       # Basic data type nodes (number, string, boolean, date)
├── ToneNode.js         # Audio synthesis and processing nodes (40+ nodes)
├── ThreeNode.js        # 3D graphics and rendering nodes (18+ nodes)
├── MathNodes.js        # Mathematical operations and utilities
├── Neural.js           # Machine learning and neural network nodes
├── Geometries.js       # 3D geometry generation nodes
├── MaterialNode.js     # 3D material and shader nodes
├── MeshNode.js         # 3D mesh composition nodes
├── Music.js            # Music theory and composition nodes
├── Midi.js             # MIDI input/output and processing
├── SoundFont.js        # General MIDI instrument nodes
├── GPGPU.js            # GPU computation and parallel processing
├── Logic.js            # Boolean logic and conditional operations
├── UtilNodes.js        # Utility functions and data manipulation
├── Code.js             # JavaScript code execution nodes
├── Dom.js              # DOM manipulation and web integration
├── Vector2D.js         # 2D vector mathematics
├── Vector3D.js         # 3D vector mathematics
├── String.js           # String manipulation utilities
├── IntervalNode.js     # Timing and interval operations
└── MapperNode.js       # Data mapping and transformation
```

#### Node Categories:
- **Audio Nodes** (ToneNode.js): Synthesizers, effects, sequencers, and audio analysis
- **Visual Nodes** (ThreeNode.js): 3D objects, lights, cameras, and post-processing effects
- **Mathematical Nodes** (MathNodes.js): Arithmetic, trigonometry, and advanced mathematics
- **Neural Network Nodes** (Neural.js): TensorFlow.js integration for machine learning
- **Music Theory Nodes** (Music.js): Scales, chords, progressions, and harmonic analysis
- **Utility Nodes** (UtilNodes.js): Data structures, control flow, and general utilities

### Example Graphs (`/src/models/examples`)

Pre-built compositions demonstrating various capabilities:

```
examples/
├── welcome.json                        # Introduction graph for new users
├── nude, eternally.json               # Radiohead-inspired eternal composition
├── in the gardens of eden.json       # Complex audio-visual composition
├── stephen wolfram.json               # Cellular automata visualization
├── gpgpu wolfram.json                 # GPU-accelerated computation example
├── shaders.json                       # GLSL shader demonstration
├── midi chords.json                   # MIDI input processing example
├── percept nets.json                  # Neural network perception demo
├── platonic plague.json               # Geometric audio-visual piece
├── soundfont-midi.json                # General MIDI instrument demo
├── the music while the music lasts.json # Temporal composition example
└── tuning-lmy.json                    # Microtonal tuning exploration
```

### React UI Components (`/src/components`)

User interface components organized by functionality:

```
components/
├── NodeGraph.js            # Main graph editing canvas (20k+ lines)
├── Node.js                 # Individual node rendering and interaction
├── AllEdges.js             # Edge rendering and connection visualization
├── Spline.js               # Curved connection lines between nodes
├── AttributePane/          # Node property editing interface
│   ├── index.js           # Main attribute editor component
│   └── InfoPopup.js       # Contextual help and documentation
├── Toolbar.js              # Main application toolbar
├── SearchBar.js            # Global search functionality
├── NodeSearcher.js         # Node type discovery and insertion
├── ExampleSearch.js        # Example graph browser and loader
├── SaveDialog.js           # Graph export and sharing interface
├── FileUpload.js           # JSON graph import functionality
├── Zoomer.js               # Canvas zoom and pan controls
├── EditInput.js            # Inline text editing component
├── NodeInputList.js        # Node input port rendering
├── NodeInputListItem.js    # Individual input port component
├── NodeOutputList.js       # Node output port rendering
├── NodeOutputListItem.js   # Individual output port component
├── SVGComponent.js         # SVG rendering utilities
├── dialogs/                # Modal dialog components
└── util.js                 # Component utility functions
```

#### Component Architecture:
- **NodeGraph.js**: The central canvas component handling node positioning, selection, and interaction
- **Node.js**: Renders individual nodes with their inputs, outputs, and visual representation
- **AttributePane/**: Provides dynamic property editing based on node type and schema
- **Search Components**: Enable discovery and insertion of nodes and examples

### State Management (`/src/redux`)

Redux-based state management following the ducks pattern:

```
redux/
├── rootStore.js            # Redux store configuration and middleware
├── rootReducer.js          # Root reducer combining all state slices
├── types.js                # Redux action type definitions
└── ducks/                  # Feature-based state modules
    └── graph.js           # Graph state management (positions, selection, UI)
```

#### State Architecture:
- **graph.js**: Manages node positions, selection state, zoom level, and UI visibility
- Follows the ducks pattern for co-locating actions, reducers, and selectors
- Integrates with React components via react-redux hooks and selectors

### Three.js Utilities (`/src/threeUtil`)

Specialized utilities for 3D graphics and WebGL integration:

```
threeUtil/
├── Base.js                 # Core Three.js scene management and rendering
├── Stats.js                # Performance monitoring and FPS display
└── WebVR.js                # Virtual reality support and controls
```

#### Graphics Infrastructure:
- **Base.js**: Provides the foundation for 3D scene management, camera controls, and render loops
- **Stats.js**: Integrates performance monitoring for optimization and debugging
- **WebVR.js**: Enables VR experiences and immersive audio-visual compositions

### Utility Functions (`/src/utils`)

Common utilities and helper functions used throughout the application:

```
utils/
├── index.js                # Main utility exports and re-exports
├── array.js                # Array manipulation and functional utilities
├── string.js               # String processing and UUID generation
├── vector.js               # Vector mathematics and spatial calculations
├── typeUtils.js            # Type checking and validation utilities
├── tuning.js               # Musical tuning systems and frequency calculations
├── docgen.js               # Documentation generation for node types
└── url.js                  # URL parsing and manipulation
```

#### Utility Categories:
- **Mathematical**: Vector operations, tuning calculations, and numerical utilities
- **Data Processing**: Array manipulation, string processing, and type validation
- **Documentation**: Automated generation of node documentation and schemas
- **System**: URL handling, UUID generation, and general-purpose functions

### Additional Directories

#### Performance Monitoring (`/src/performance`)
```
performance/
└── index.js                # Performance tracking and optimization utilities
```

#### Vendor Code (`/src/vendor`)
```
vendor/
└── JsonTree/               # Modified third-party JSON tree component
```

#### Static Assets (`/src/img`)
```
img/
├── bg-img.png              # Background images for UI theming
├── bg-poly.png             # Geometric background patterns
└── bg-texture-dark.png     # Dark theme texture assets
```

### Directory Design Principles

The directory structure follows several key principles:

1. **Separation of Concerns**: Each directory has a clear, single responsibility
2. **Feature-Based Organization**: Related functionality is co-located (e.g., AttributePane components)
3. **Scalability**: The node system can accommodate new types without restructuring
4. **Discoverability**: Logical naming and organization make the codebase navigable
5. **Modularity**: Components and utilities can be imported and used independently

This organization enables developers to quickly locate relevant code, understand system boundaries, and extend functionality without disrupting existing features.

## Node System Architecture

The node system is the computational heart of Eternal, implementing a sophisticated plugin-based architecture that enables reactive, type-safe data flow through a graph of interconnected processing units. With 96+ specialized node types spanning multiple domains, the system provides a flexible foundation for audio-visual composition and computational creativity.

### Plugin-Based Node Architecture

#### Node Registration System
All nodes are registered through a centralized registry system (`/src/models/nodes/index.js`) that provides:

```javascript
const NodeRegistry = fromPairs(allNodes.map(n => [n.getRegistryName(), n]));
```

**Key Features:**
- **Dynamic Discovery**: Nodes are automatically registered by registry name
- **Collision Detection**: Prevents duplicate node registrations
- **Runtime Access**: Global registry enables dynamic node instantiation
- **Type Safety**: Flow types ensure proper node class structure

#### Node Class Hierarchy
Every node extends the abstract `NodeBase` class, inheriting core functionality:

```javascript
export default class NodeBase<Val: Object, In: ?Object, Out: ?Object>
```

**Generic Type Parameters:**
- `Val`: Internal state type for node-specific data
- `In`: Input schema defining expected input types
- `Out`: Output schema defining produced output types

#### Static Node Metadata
Each node class defines static properties for system integration:

```javascript
static +displayName: ?string;        // Human-readable name
static +registryName: string;        // Unique system identifier
static +description: ?Node;          // React component documentation
static +schema: Schema;              // Input/output/state type definitions
static +defaultState: ?$Shape<Val>;  // Default internal state
static +defaultProps: ?$Shape<In>;   // Default input values
```

### Reactive Execution Model

#### Change Propagation System
The reactive model ensures automatic updates throughout the node graph:

1. **Input Change Detection**: Nodes monitor input changes via edge notifications
2. **Selective Processing**: Only affected outputs are recomputed
3. **Downstream Propagation**: Changes cascade through connected nodes
4. **Cycle Prevention**: Graph topology prevents infinite loops

#### Processing Pipeline
Each node implements a standardized processing pipeline:

```javascript
process: (string[]) => Out = keys => {
  // Node-specific computation logic
  // Returns object with computed output values
};
```

**Pipeline Stages:**
1. **Input Validation**: Verify required inputs are available
2. **State Access**: Read current node state and input props
3. **Computation**: Execute node-specific processing logic
4. **Output Generation**: Return computed values for specified keys
5. **Cache Update**: Store results for future reference

#### Lifecycle Management
Nodes participate in a comprehensive lifecycle system:

- `onAddToGraph()`: Initialize when added to graph
- `willBecomeLive()`: Activate when all inputs connected
- `willBeRemoved()`: Cleanup before removal
- Connection hooks for edge management

### Type System Integration

#### AttributeType Framework
The type system governs data flow and ensures compatibility:

```javascript
interface AttributeType {
  name: string;                    // Type identifier
  typeDescription: Node;           // Documentation component
  schema: ?AttributeSchema;        // Nested type definition
  defaultValue: any;               // Default initialization
  parse: any => any;               // Input validation
  serialize: ?(any) => any;        // Output serialization
}
```

#### Type Categories
- **Primitives**: `number`, `string`, `boolean`, `date`
- **Complex Objects**: `Vec2`, `Vec3`, `Mesh`, `Material`, `Geometry`
- **Audio Types**: `AudioNode`, `Synth`, `Signal`, `Note`
- **Specialized**: `JSFunction`, `GLSL`, `Tensor`

#### Type Validation
- **Connection Validation**: Prevents incompatible type connections
- **Runtime Checking**: Validates data at node boundaries
- **Automatic Conversion**: Handles compatible type transformations
- **Error Reporting**: Provides clear feedback for type mismatches

### Caching Mechanisms

#### Output Caching Strategy
Intelligent caching prevents unnecessary recomputation:

```javascript
outputCache = {};  // Stores computed results by output key

_process: (string[], boolean) => Out = (keys, force) => {
  const val = this.process(keys);
  const forward = force ? val : omitBy(val, (v, k) => 
    isEqual(v, this.outputCache[k])
  );
  this.outputCache = { ...this.outputCache, ...val };
  return forward;
};
```

**Caching Benefits:**
- **Performance Optimization**: Avoids redundant calculations
- **Change Detection**: Only propagates actual value changes
- **Memory Efficiency**: Selective cache invalidation
- **Consistency**: Ensures deterministic behavior

#### Cache Invalidation
- **Input Changes**: Automatically invalidate affected outputs
- **State Updates**: Clear cache when internal state changes
- **Manual Clearing**: Force recomputation when needed
- **Selective Updates**: Invalidate only specific output keys

### Node Categories and Implementations

The 96+ node types are organized into specialized categories, each serving specific computational domains:

#### Audio Processing Nodes (ToneNode.js - 27 nodes)
**Synthesis Nodes:**
- `SynthNode`: Basic oscillator synthesis
- `DuoSynthNode`: Dual-oscillator synthesis
- `AttackReleaseNode`: Envelope-controlled synthesis
- `PianoNode`: Piano sample playback
- `NoiseNode`: Noise generation

**Effects and Processing:**
- `ReverbNode`: Convolution reverb effects
- `CompressorNode`: Dynamic range compression
- `FeedbackDelayNode`: Echo and delay effects
- `AudioGainNode`: Volume and amplitude control
- `PannerNode`: Stereo positioning

**Sequencing and Control:**
- `TimeLoopNode`: Rhythmic pattern generation
- `ArpeggiateNode`: Arpeggio pattern creation
- `TransportTimeNode`: Global timing synchronization
- `SetNoteNode`: Note triggering and scheduling

#### 3D Graphics Nodes (ThreeNode.js - 18 nodes)
**Scene Objects:**
- `ThreeNode`: Base 3D object with transform controls
- `DirectionalLightNode`: Directional lighting
- `AmbientLightNode`: Ambient scene lighting
- `Color`: Color value generation

**Post-Processing Effects:**
- `GlitchPassNode`: Digital glitch effects
- `ScanlinePassNode`: CRT scanline simulation
- `DotScreenPassNode`: Halftone dot patterns
- `VignettePassNode`: Lens vignetting effects
- `NoisePassNode`: Film grain and noise

#### Geometry Generation (Geometries.js - 5 nodes)
- `BoxGeometryNode`: Cubic geometry generation
- `SphereGeometryNode`: Spherical geometry
- `PlaneGeometryNode`: Flat surface geometry
- `TorusKnotGeometryNode`: Complex knot geometry
- `GeometryBase`: Abstract geometry foundation

#### Material System (MaterialNode.js - 4 nodes)
- `LambertMaterialNode`: Diffuse surface materials
- `ShaderMaterialNode`: Custom GLSL shader materials
- `ParticleMaterialNode`: Point sprite materials
- `LoadTextureNode`: Texture loading and management

#### Mathematical Operations (MathNodes.js - 4 nodes)
- `SumNode`: Addition operations
- `ProductNode`: Multiplication operations
- `DivideNode`: Division operations
- `IntToIntMathNode`: Integer mathematics

#### Music Theory (Music.js - 9 nodes)
- `ScaleNode`: Musical scale generation
- `ChordNode`: Chord construction
- `NoteNode`: Note representation and manipulation
- `TuningNode`: Alternative tuning systems
- `TransposeNode`: Pitch transposition
- `KeyTriadsNode`: Key-based chord progressions
- `ChordDetectNode`: Harmonic analysis

#### Neural Networks (Neural.js - 3 nodes)
- `PerformanceRNNNode`: Music generation RNN
- `LSTMCellNode`: LSTM neural network cell
- `MultiRNNCellNode`: Multi-layer RNN architecture

#### MIDI Integration (Midi.js - 4 nodes)
- `MidiInNode`: MIDI input device handling
- `MidiOutNode`: MIDI output device control
- `MidiDevicesNode`: Device enumeration
- `MidiListenNode`: MIDI event monitoring

#### GPU Computation (GPGPU.js - 2 nodes)
- `GPGPUProgramNode`: GPU shader program compilation
- `RunGPGPUProgramNode`: GPU program execution

#### Logic and Control Flow (Logic.js - 5 nodes)
- `AndNode`: Boolean AND operations
- `OrNode`: Boolean OR operations
- `NotNode`: Boolean NOT operations
- `EqualsNode`: Equality comparison
- `SwitchNode`: Conditional routing

#### Utility and Data Processing (UtilNodes.js - 10 nodes)
- `JSONParse`: JSON data parsing
- `ExtractNode`: Object property extraction
- `CollectNode`: Array aggregation
- `ArrayFillNode`: Array generation
- `RegexReplace`: String pattern replacement
- `StephenWolfram`: Cellular automata simulation

#### Primitive Data Types (primitives.js - 4 nodes)
- `number`: Numeric value input
- `string`: Text value input
- `boolean`: Boolean value input
- `date`: Date/time value input

### Node Development Patterns

#### Creating New Node Types
New nodes follow established patterns:

1. **Extend NodeBase**: Inherit core functionality
2. **Define Schema**: Specify input/output types
3. **Implement Process**: Core computation logic
4. **Register Node**: Add to node registry
5. **Add Documentation**: Provide usage examples

#### Best Practices
- **Pure Functions**: Minimize side effects in processing
- **Type Safety**: Leverage Flow types for validation
- **Performance**: Optimize for real-time execution
- **Modularity**: Keep nodes focused and composable
- **Documentation**: Provide clear descriptions and examples

### System Integration

#### Graph Execution Engine
The node system integrates with the graph execution engine:

1. **Topological Sorting**: Determines execution order
2. **Dependency Resolution**: Ensures inputs are available
3. **Parallel Execution**: Processes independent branches
4. **Error Handling**: Graceful failure and recovery

#### UI Integration
Nodes integrate seamlessly with the visual interface:

- **Dynamic Rendering**: UI adapts to node schema
- **Type-Aware Inputs**: Input controls match data types
- **Real-time Updates**: Changes reflect immediately
- **Visual Feedback**: Connection validation and status

This sophisticated node system architecture enables Eternal to provide a powerful, extensible platform for creative computation while maintaining type safety, performance, and ease of use.

This architecture enables Eternal to function as both a creative tool and a technical platform, supporting complex audio-visual compositions while maintaining code clarity and extensibility.




