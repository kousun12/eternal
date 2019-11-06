// @flow

import {
  combineReducers,
  createSelector,
  createSlice,
  type PayloadAction as PA,
} from 'redux-starter-kit';
import { fromPairs } from 'lodash';
import type { State } from 'redux/types';
import { range } from 'utils/array';
import type { Pos } from 'types';

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
    // todo add some pan dolly to mouse on zoom
    zoomIn: (v: ViewState, a: PA<?Pos>) => {
      v.zoom = Math.min(zooms.length - 1, v.zoom + 1);
    },
    zoomOut: (v: ViewState, a: PA<?Pos>) => {
      v.zoom = Math.max(0, v.zoom - 1);
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
  reducers: {
    updatePos: (memo: PosMemo, a: PA<PosMemo>) => ({ ...memo, ...a.payload }),
    setPos: (memo: PosMemo, a: PA<PosMemo>) => a.payload,
  },
});

const selectedSelector = (s: State) => s.graph.selected;

const emptyById = {};
const selectedById = createSelector(
  [selectedSelector],
  sel => (sel.length ? fromPairs(sel.map(id => [id, true])) : emptyById)
);

const selectCount = createSelector(
  [selectedSelector],
  s => s.length
);

export const selectedS = createSelector(
  [selectedById, selectCount],
  (selected, selectCount) => ({ selected, selectCount })
);

export type SelectedView = {| pan: Pos, scale: number, scaleInverse: number, zoom: number |};

const zoomSelector = (s: State) => s.graph.view.zoom;
const panSelector = (s: State) => s.graph.view.pan;

const scaleSelector = createSelector(
  [zoomSelector],
  zoom => zooms[zoom] / 100
);

const scaleInvSelector = createSelector(
  [scaleSelector],
  scale => 1 / scale
);

export const selectView = createSelector(
  [panSelector, scaleSelector, scaleInvSelector, zoomSelector],
  (pan, scale, scaleInverse, zoom) => ({ pan, scale, scaleInverse, zoom })
);

export const selectInfoOpen = (s: State) => s.graph.infoOpen;
export const selectPositions = (s: State) => s.graph.nodePos;

export const { selSet } = selectedSlice.actions;
export const { setInfoOpen } = infoOpenSlice.actions;
export const { zoomIn, zoomOut, zoomReset, setPan, setScale } = viewSlice.actions;
export const { updatePos, setPos } = nodePosSlice.actions;

export default combineReducers({
  selected: selectedSlice.reducer,
  infoOpen: infoOpenSlice.reducer,
  view: viewSlice.reducer,
  nodePos: nodePosSlice.reducer,
});
