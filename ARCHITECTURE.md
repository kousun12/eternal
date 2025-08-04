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

This architecture enables Eternal to function as both a creative tool and a technical platform, supporting complex audio-visual compositions while maintaining code clarity and extensibility.
