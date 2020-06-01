import thunk, { ThunkMiddleware } from "redux-thunk";
import { createStore, applyMiddleware, AnyAction, Action } from "redux";
// import { song, initialState as songInitialState, SongState } from "./song-reducer";
// import { data, initialState as dataInitialState, DataState } from "./data-reducer";
// import { composeWithDevTools } from "redux-devtools-extension";
// import { createLogger } from "redux-logger";
import { PartData } from "../webdaw/musicxml";
import { Song } from "../webdaw/types";
import { rootReducer } from "./rootReducer";

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

export type Score = {
  name: string;
  file: XMLDocument;
  repeats: number[][];
  parts: PartData[];
  interpretations?: string[];
};

export type Interpretation = {
  name: string;
  file: Song;
};

export type AppState = {
  scores: Score[];
  interpretations: Interpretation[];
};

const initialState: AppState = { scores: [], interpretations: [] };

const store = createStore(
  // combineReducers({ song, data }),
  rootReducer,
  initialState,
  // composeWithDevTools(applyMiddleware(
  //   thunkMiddleware,
  //   createLogger()
  // )),
  // applyMiddleware(thunk as ThunkMiddleware<AppState, AnyAction>, createLogger({ collapsed: true }))
  applyMiddleware(thunk as ThunkMiddleware<AppState, AnyAction>)
);

export { store };
