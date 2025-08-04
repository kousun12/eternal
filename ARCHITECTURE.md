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

This architecture enables Eternal to function as both a creative tool and a technical platform, supporting complex audio-visual compositions while maintaining code clarity and extensibility.


