import { MUSICXML_SELECTED } from "../../constants";

export const selectScore = (index: number) => {
  return {
    type: MUSICXML_SELECTED,
    payload: {
      index,
    },
  };
};
