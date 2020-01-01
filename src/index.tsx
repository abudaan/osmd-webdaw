// import 'core-js/stable';
// import 'regenerator-runtime/runtime';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { App } from './components/app';
import { init } from './redux/actions';

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
);

// const { xmlDocUrl, midiFileUrl } = store.getState().song;
// console.log(xmlDocUrl, midiFileUrl);
// store.dispatch(init(xmlDocUrl, midiFileUrl));