import { ThunkDispatch } from "redux-thunk";
import { AppState } from "../redux/store";
import { AnyAction } from "redux";

export type AppDispatch = ThunkDispatch<AppState, any, AnyAction>;
