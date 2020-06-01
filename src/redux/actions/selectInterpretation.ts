import { UPLOAD_MIDIFILE } from "../../contants";

export const selectInterpretation = (index: number) => ({
  type: UPLOAD_MIDIFILE,
  payload: { index },
});
