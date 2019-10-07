// @flow
import { combineReducers, createSlice } from 'redux-starter-kit';
import { fromPairs } from 'lodash';
import type { State } from 'redux/types';

export type GraphState = {
  selected: string[],
  infoOpen: ?string,
};

const selected = createSlice({
  slice: 'selected',
  initialState: [],
  reducers: {
    selAppend: (state, action) => state.append(action.payload),
    selRemove: (state, action) => state.filter(n => n.id !== action.payload),
    selSet: (state, action) => action.payload,
  },
});

const infoOpen = createSlice({
  slice: 'infoOpen',
  initialState: null,
  reducers: { setInfoOpen: (state, action) => action.payload },
});

export const selectedS = (state: State) => ({
  selected: fromPairs(state.graph.selected.map(id => [id, true])),
  selectCount: state.graph.selected.length,
});

export const showNode = (state: State) => ({ showNode: state.graph.infoOpen });

export const { selAppend, selRemove, selSet } = selected.actions;
export const { setInfoOpen } = infoOpen.actions;

export default combineReducers({ selected: selected.reducer, infoOpen: infoOpen.reducer });
