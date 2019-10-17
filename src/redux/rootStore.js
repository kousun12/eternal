// @flow
import { configureStore } from 'redux-starter-kit';

import rootReducer from './rootReducer';

const store = configureStore({ reducer: rootReducer });

export default store;
