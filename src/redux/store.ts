import thunkMiddleware from 'redux-thunk'
import { createStore, combineReducers, DeepPartial, applyMiddleware } from 'redux';
import { song, initialState as songInitialState, SongState } from './song-reducer';
import { data, initialState as dataInitialState, DataState } from './data-reducer';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createLogger } from 'redux-logger'


// import { data, createDataState } from './data_reducer';
// import { scanResult, scanResultState } from './scan_result_reducer';
// import { DataState, ScanResultState, ReduxState } from '../types';
// import { setScreen } from './actions';
// import { connectStoreToLocalStorage } from './local_storage';

// const initialState: DeepPartial<{ data: DataState, scanResult: ScanResultState }> = {
// const initialState: ReduxState = {
//   data: createDataState(),
//   scanResult: scanResultState
// }

export type AppState = {
  song: SongState,
  data: DataState,
}

type ReduxState = {}
const initialState: ReduxState = {
  song: songInitialState,
  data: dataInitialState,
}

const store = createStore(
  combineReducers({ song, data }),
  initialState,
  // composeWithDevTools(applyMiddleware(
  //   thunkMiddleware,
  //   createLogger()
  // )),
  applyMiddleware(
    thunkMiddleware,
    createLogger({ collapsed: true })
  ),
);


export { store };
