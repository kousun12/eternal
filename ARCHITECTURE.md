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

This architecture enables Eternal to function as both a creative tool and a technical platform, supporting complex audio-visual compositions while maintaining code clarity and extensibility.

