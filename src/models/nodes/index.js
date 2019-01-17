// @flow
import { fromPairs } from 'lodash';
import {
  DuoSynthNode,
  SynthNode,
  AttackReleaseNode,
  AudioMasterNode,
  PannerNode,
  FeedbackDelayNode,
  AudioDelayNode,
  AudioGainNode,
  SetNoteNode,
  TimeLoopNode,
  StartTransportNode,
  TransportTimeNode,
  ConnectNode,
  ContextDestinationNode,
  ToContextDestinationNode,
  PianoNode,
  ArpeggiateNode,
  CompressorNode,
  ReverbNode,
  PlayerNode,
  VolumeNode,
} from './ToneNode';
import { SoundFontNode, SoundFontPlayerNode } from './SoundFont';
import MapperNode from './MapperNode';
import IntervalNode from './IntervalNode';
import ThreeNode, {
  Color,
  DirectionalLightNode,
  AmbientLightNode,
  GlitchPassNode,
  ScanlinePassNode,
  DotScreenPassNode,
  VignettePassNode,
  NoisePassNode,
} from './ThreeNode';
import {
  TorusKnotGeometryNode,
  PlaneGeometryNode,
  SphereGeometryNode,
  BoxGeometryNode,
} from './Geometries';
import { LambertMaterialNode, ShaderMaterialNode } from './MaterialNode';
import { AndNode, OrNode, NotNode, EqualsNode } from './Logic';
import MeshNode from './MeshNode';
import { MidiOutNode, MidiInNode } from './Midi';
import {
  InfoLog,
  JSONParse,
  ExtractNode,
  StephenWolfram,
  HistoryNode,
  JoinNode,
  RegexReplace,
} from './UtilNodes';
import Vector2D from './Vector2D';
import Vector3D from './Vector3D';
import { DomNode } from './Dom';
import { PlusNode } from './String';
import { ScaleNode, ChromaNode, ChordNode, TransposeNode } from './Music';
import { PerformanceRNNNode } from './Neural';
import { DivideNode, SumNode, ProductNode, IntToIntMathNode } from './MathNodes';
import { number, string, boolean, date } from './primitives';

/**
 * Aggregator file to export all the nodes from a single place.
 * Eventually this should be separated to packages (maybe)
 *
 * Eventually this should be code-gen'd.
 */
export {
  Vector2D,
  MeshNode,
  TorusKnotGeometryNode,
  LambertMaterialNode,
  ShaderMaterialNode,
  ThreeNode,
  DuoSynthNode,
  SynthNode,
  AttackReleaseNode,
  AudioMasterNode,
  PannerNode,
  FeedbackDelayNode,
  AudioDelayNode,
  AudioGainNode,
  MapperNode,
  IntervalNode,
  SetNoteNode,
  TimeLoopNode,
  StartTransportNode,
  TransportTimeNode,
  ConnectNode,
  ContextDestinationNode,
  ToContextDestinationNode,
  PianoNode,
  ArpeggiateNode,
  CompressorNode,
  ReverbNode,
  PlayerNode,
  VolumeNode,
  SoundFontNode,
  SoundFontPlayerNode,
  DivideNode,
  SumNode,
  ProductNode,
  IntToIntMathNode,
  Color,
  DirectionalLightNode,
  AmbientLightNode,
  GlitchPassNode,
  ScanlinePassNode,
  DotScreenPassNode,
  VignettePassNode,
  NoisePassNode,
  Vector3D,
  AndNode,
  OrNode,
  NotNode,
  EqualsNode,
  PerformanceRNNNode,
  InfoLog,
  ScaleNode,
  ChromaNode,
  ChordNode,
  TransposeNode,
  MidiOutNode,
  MidiInNode,
  JSONParse,
  ExtractNode,
  StephenWolfram,
  HistoryNode,
  JoinNode,
  RegexReplace,
  DomNode,
  PlusNode,
  number,
  string,
  boolean,
  date,
};

const allNodes = [
  Vector2D,
  MeshNode,
  TorusKnotGeometryNode,
  PlaneGeometryNode,
  SphereGeometryNode,
  BoxGeometryNode,
  LambertMaterialNode,
  ShaderMaterialNode,
  ThreeNode,
  DuoSynthNode,
  SynthNode,
  AttackReleaseNode,
  AudioMasterNode,
  PannerNode,
  FeedbackDelayNode,
  AudioDelayNode,
  AudioGainNode,
  MapperNode,
  IntervalNode,
  SetNoteNode,
  TimeLoopNode,
  StartTransportNode,
  TransportTimeNode,
  ConnectNode,
  ContextDestinationNode,
  ToContextDestinationNode,
  PianoNode,
  ArpeggiateNode,
  CompressorNode,
  ReverbNode,
  PlayerNode,
  VolumeNode,
  SoundFontNode,
  SoundFontPlayerNode,
  DivideNode,
  SumNode,
  ProductNode,
  IntToIntMathNode,
  Color,
  DirectionalLightNode,
  AmbientLightNode,
  GlitchPassNode,
  ScanlinePassNode,
  DotScreenPassNode,
  VignettePassNode,
  NoisePassNode,
  Vector3D,
  AndNode,
  OrNode,
  NotNode,
  EqualsNode,
  PerformanceRNNNode,
  InfoLog,
  ScaleNode,
  ChromaNode,
  ChordNode,
  TransposeNode,
  MidiOutNode,
  MidiInNode,
  JSONParse,
  ExtractNode,
  StephenWolfram,
  HistoryNode,
  JoinNode,
  RegexReplace,
  DomNode,
  PlusNode,
  number,
  string,
  boolean,
  date,
];

window.allNodes = allNodes;

const NodeRegistry = fromPairs(allNodes.map(n => [n.getRegistryName(), n]));
if (Object.keys(NodeRegistry).length !== allNodes.length) {
  throw Error('duplicate node by registryName in node registry');
}
window.NodeRegistry = NodeRegistry;
