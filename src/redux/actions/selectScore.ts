import { SELECT_XMLDOC } from "../../contants";

export const selectScore = (index: number) => ({
  type: SELECT_XMLDOC,
  payload: { index },
});
