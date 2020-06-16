import { MUSICXML_SELECTED } from "../../contants";

export const selectScore = (index: number) => ({
  type: MUSICXML_SELECTED,
  payload: { index },
});
