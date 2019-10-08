// @flow

import { combineReducers, createSlice, type PayloadAction as PA } from 'redux-starter-kit';
import { fromPairs } from 'lodash';
import type { State } from 'redux/types';
import { range } from 'utils/array';
import type { Pos } from 'types';

type ViewState = {| zoom: number, pan: Pos |};
export type GraphState = {|
  selected: string[],
  infoOpen: ?string,
  view: ViewState,
|};

const selectedSlice = createSlice({
  slice: 'selected',
  initialState: [],
  reducers: {
    selAppend: (selected: string[], a: PA<string[]>) => selected.concat(a.payload),
    selRemove: (selected: string[], a: PA<string>) => selected.filter(n => n !== a.payload),
    selSet: (selected: string[], a: PA<string[]>) => a.payload,
  },
});

const infoOpenSlice = createSlice({
  slice: 'infoOpen',
  initialState: null,
  reducers: { setInfoOpen: (infoOpen: ?string, a: PA<?string>) => a.payload },
});

export const zooms = range([10, 200], 10, 0);
const defView = { pan: { x: 0, y: 0 }, zoom: zooms.indexOf(100) };

// NB using immer to update state, which looks like mutation but is actually not
const viewSlice = createSlice({
  slice: 'view',
  initialState: defView,
  reducers: {
    setScale: (v: ViewState, a: PA<number>) => {
      v.zoom = a.payload;
    },
    zoomIn: (v: ViewState) => {
      v.zoom = Math.min(zooms.length - 1, v.zoom + 1);
    },
    zoomOut: (v: ViewState) => {
      v.zoom = Math.max(0, v.zoom - 1);
    },
    zoomReset: (v: ViewState) => {
      v.zoom = zooms.indexOf(100);
    },
    setPan: (v: ViewState, a: PA<Pos>) => {
      v.pan = a.payload;
    },
  },
});

export const selectedS = (s: State) => ({
  selected: fromPairs(s.graph.selected.map(id => [id, true])),
  selectCount: s.graph.selected.length,
});

export type SelectedView = {| pan: Pos, scale: number |};
export const selectView = (s: State): SelectedView => ({
  pan: s.graph.view.pan,
  scale: zooms[s.graph.view.zoom] / 100,
});

export const showNode = (s: State) => ({ showNode: s.graph.infoOpen });

export const { selAppend, selRemove, selSet } = selectedSlice.actions;
export const { setInfoOpen } = infoOpenSlice.actions;
export const { zoomIn, zoomOut, zoomReset, setPan, setScale } = viewSlice.actions;

export default combineReducers({
  selected: selectedSlice.reducer,
  infoOpen: infoOpenSlice.reducer,
  view: viewSlice.reducer,
});
