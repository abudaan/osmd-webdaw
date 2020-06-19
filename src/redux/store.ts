import thunk, { ThunkMiddleware } from "redux-thunk";
import { createStore, applyMiddleware, AnyAction, Action } from "redux";
// import { song, initialState as songInitialState, SongState } from "./song-reducer";
// import { data, initialState as dataInitialState, DataState } from "./data-reducer";
import { composeWithDevTools } from "redux-devtools-extension";
// import { createLogger } from "redux-logger";

import { rootReducer } from "./rootReducer";
import { Observable, Subscriber } from "rxjs";
import { Transport, AppState } from "../types";

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

const initialState: AppState = {
  scores: [],
  interpretations: [],
  selectedScoreIndex: 0,
  selectedInterpretationIndex: 0,
  transport: Transport.STOP,
  currentInterpretation: null,
  playheadMillis: 0,
  durationTimeline: 60000,
  loop: true,
  loopStart: 2000,
  loopEnd: 6000,
};

const composeEnhancers = composeWithDevTools({
  // Specify name here, actionsBlacklist, actionsCreators and other options if needed
});

const store = createStore(
  // combineReducers({ song, data }),
  rootReducer,
  initialState,
  // composeWithDevTools(applyMiddleware(
  //   thunkMiddleware,
  //   createLogger()
  // )),
  // applyMiddleware(thunk as ThunkMiddleware<AppState, AnyAction>, createLogger({ collapsed: true }))
  // composeEnhancers(applyMiddleware(thunk as ThunkMiddleware<AppState, AnyAction>))
  applyMiddleware(thunk as ThunkMiddleware<AppState, AnyAction>)
);

const state$ = new Observable((observer: Subscriber<AppState>) => {
  observer.next(store.getState());
  const unsubscribe = store.subscribe(() => {
    observer.next(store.getState());
  });
  return unsubscribe;
});

const getState$ = (): Observable<AppState> => {
  return state$;
};

export { getState$, store };
