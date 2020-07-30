import thunk, { ThunkMiddleware } from "redux-thunk";
import { createStore, applyMiddleware, AnyAction, combineReducers } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
// import { createLogger } from "redux-logger";
import { rootReducer } from "./reducer";
import { Transport, AppState } from "../types";

export const initialState: AppState = {
  scores: [],
  interpretations: [],
  selectedScoreIndex: 0,
  selectedInterpretationIndex: 0,
  transport: Transport.STOP,
  currentInterpretation: null,
  currentScore: null,
  playheadMillis: 0,
  durationTimeline: 60000,
  loop: false,
  loopStart: 2000,
  loopEnd: 6000,
  selectedNoteData: null,
};

const composeEnhancers = composeWithDevTools({
  // Specify name here, actionsBlacklist, actionsCreators and other options if needed
});

const store = createStore(
  // combineReducers({ song, data }),
  // combineReducers({ rootReducer: rootReducer }),
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

export { store };
