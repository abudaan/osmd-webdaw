import { MIDIFILE_SELECTED } from "../../contants";

export const selectInterpretation = (index: number) => ({
  type: MIDIFILE_SELECTED,
  payload: { index },
});
