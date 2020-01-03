// import 'core-js/stable';
// import 'regenerator-runtime/runtime';
import { Observable, Subscriber } from 'rxjs';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store, AppState } from './redux/store';
import { App } from './components/app';
import { loadInitSong, init } from './redux/actions';
import sequencer from 'heartbeat-sequencer';
import { createSong } from './create-song';

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
);

const state$ = new Observable((observer: Subscriber<AppState>) => {
  observer.next(store.getState());
  const unsubscribe = store.subscribe(() => {
    observer.next(store.getState());
  });
  return unsubscribe;
});

store.dispatch(init(state$));

sequencer.ready()
  .then(() => {
    const { initUrls: { xmlDoc, midiFile, instrument } } = store.getState().song;
    store.dispatch(loadInitSong(xmlDoc, midiFile, instrument));
  })

