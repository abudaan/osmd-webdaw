import { AppState, Transport, RefMIDI } from "../../types";
import { Dispatch } from "redux";
import { store } from "../store";
import { enable } from "../../media";
import { SET_TRANSPORT } from "../../constants";
import { startMIDI, stopMIDI } from "../../controlMIDI";

export const handleTransport = (transport: Transport) => async (
  dispatch: Dispatch
): Promise<void> => {
  const state = store.getState() as AppState;
  const { playheadMillis, currentInterpretation } = state;

  let clone: RefMIDI;
  if (transport === Transport.PLAY) {
    await enable();
    clone = startMIDI(currentInterpretation, playheadMillis);
  } else {
    clone = stopMIDI(currentInterpretation);
  }

  dispatch({
    type: SET_TRANSPORT,
    payload: {
      transport,
      playheadMillis: transport === Transport.STOP ? 0 : playheadMillis,
      currentInterpretation: clone,
    },
  });
};
