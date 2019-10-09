import 'bootstrap/dist/css/bootstrap.min.css';
import './style/index.less';
import 'jzz';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { getStore, getState$ } from './redux/store';
import App from './components/App';
import { resize } from './redux/actions/app_actions';
import { init } from './redux/actions/load_actions';
import { setActiveNote } from './redux/actions/menu_actions';
import createEaseljsApp from './easeljs/app';
import Swipe from './util/swipe';
import { createPartMenuObservables } from './subscriptions/partmenu_subscriptions';

const store = getStore();

render(
  <Provider store={store} >
    <App></App>
  </Provider>,
  document.getElementById('react')
);

window.onload = async () => {
  const e = await init(store.getState().partmenu.instrumenButtons);
  createPartMenuObservables(getState$(), store);
  store.dispatch(e);
}

// let i = 0;
// setInterval(() => {
//   store.dispatch(setActiveLayer(i));
//   i++;
//   if (i === 3) {
//     i = 0
//   }
// }, 800);

/*
const handleResize = () => {
  let topMenuHeight = 0;
  let bottomMenuHeight = 0;
  const topmenu: HTMLDivElement | null = document.getElementById('topmenu') as HTMLDivElement;
  const bottommenu: HTMLDivElement | null = document.getElementById('bottommenu') as HTMLDivElement;
  if (topmenu !== null) {
    topMenuHeight = topmenu.getBoundingClientRect().height;
  }
  if (bottommenu !== null) {
    bottomMenuHeight = bottommenu.getBoundingClientRect().height;
  }
  store.dispatch(resize(window.innerWidth, window.innerHeight, topMenuHeight, bottomMenuHeight));
}

window.onload = async () => {
  window.addEventListener('resize', handleResize);
  Swipe.init();
  handleResize();
  const e = await init();
  store.dispatch(e);
  createEaseljsApp();
}
*/