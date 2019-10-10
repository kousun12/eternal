// @flow

import { combineReducers, createSlice, type PayloadAction as PA } from 'redux-starter-kit';
import { fromPairs } from 'lodash';
import type { State } from 'redux/types';
import { range } from 'utils/array';
import type { Pos } from 'types';
import { addVec } from 'utils/vector';

type ViewState = {| zoom: number, pan: Pos |};
export type PosMemo = { [string]: Pos };
export type GraphState = {|
  selected: string[],
  infoOpen: ?string,
  view: ViewState,
  nodePos: PosMemo,
|};

const selectedSlice = createSlice({
  slice: 'selected',
  initialState: [],
  reducers: { selSet: (selected: string[], a: PA<string[]>) => a.payload },
});

const infoOpenSlice = createSlice({
  slice: 'infoOpen',
  initialState: null,
  reducers: { setInfoOpen: (infoOpen: ?string, a: PA<?string>) => a.payload },
});

export const zooms = range([5, 205], 5, 0);
const defView = { pan: { x: 0, y: 0 }, zoom: zooms.indexOf(100) };

// NB using immer to update state, which looks like mutation but is actually not
const viewSlice = createSlice({
  slice: 'view',
  initialState: defView,
  reducers: {
    setScale: (v: ViewState, a: PA<number>) => {
      v.zoom = a.payload;
    },
    zoomIn: (v: ViewState, a: PA<?Pos>) => {
      v.zoom = Math.min(zooms.length - 1, v.zoom + 1);
      if (a.payload) {
        v.pan = addVec(v.pan, a.payload);
      }
    },
    zoomOut: (v: ViewState, a: PA<?Pos>) => {
      v.zoom = Math.max(0, v.zoom - 1);
      if (a.payload) {
        v.pan = addVec(v.pan, a.payload);
      }
    },
    zoomReset: (v: ViewState) => {
      v.zoom = defView.zoom;
      v.pan = defView.pan;
    },
    setPan: (v: ViewState, a: PA<Pos>) => {
      v.pan = a.payload;
    },
  },
});

const nodePosSlice = createSlice({
  slice: 'nodePos',
  initialState: {},
  reducers: { updatePos: (memo: PosMemo, a: PA<PosMemo>) => ({ ...memo, ...a.payload }) },
});

export const selectedS = (s: State) => ({
  selected: fromPairs(s.graph.selected.map(id => [id, true])),
  selectCount: s.graph.selected.length,
});

export type SelectedView = {| pan: Pos, scale: number, scaleInverse: number, zoom: number |};
export const selectView = (s: State): SelectedView => {
  const { zoom } = s.graph.view;
  const scale = zooms[zoom] / 100;
  return { pan: s.graph.view.pan, scale, scaleInverse: 1 / scale, zoom };
};

export const selectInfoOpen = (s: State) => s.graph.infoOpen;
export const selectPositions = (s: State) => s.graph.nodePos;

export const { selSet } = selectedSlice.actions;
export const { setInfoOpen } = infoOpenSlice.actions;
export const { zoomIn, zoomOut, zoomReset, setPan, setScale } = viewSlice.actions;
export const { updatePos } = nodePosSlice.actions;

export default combineReducers({
  selected: selectedSlice.reducer,
  infoOpen: infoOpenSlice.reducer,
  view: viewSlice.reducer,
  nodePos: nodePosSlice.reducer,
});
