import React from 'react';
import ReactDOM from 'react-dom';
import './App';
import { Provider } from 'react-redux';
import store from './redux/rootStore';

// import './utils/docgen';
import * as serviceWorker from './serviceWorker';
serviceWorker.unregister();

const render = () => {
  const Eternal = require('./App').default;
  ReactDOM.render(
    <Provider store={store}>
      <Eternal className="bp3-dark" />
    </Provider>,
    document.getElementById('eternal-root')
  );
};

render();
