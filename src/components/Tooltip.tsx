import uniqid from "uniqid";
import React, { SyntheticEvent, useEffect, useRef, RefObject } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { fromEvent } from "rxjs";
import { map } from "rxjs/operators";
import { Dispatch } from "redux";
import { AppState } from "../types";
import { TempoEvent } from "../webdaw/midi_events";

type Props = {};
export const Tooltip: React.FC<Props> = ({}: Props) => {
  // const currentScore = useSelector((state: AppState) => state.currentScore);
  // if (currentScore !== null && currentScore.notesPerBar !== null) {
  //   console.log("TOOLTIP", currentScore.notesPerBar);
  //   currentScore.notesPerBar.forEach(notes => {
  //     notes.forEach(note => {
  //       const { vfnote } = note;
  //       // console.log(vfnote["attrs"].el);
  //       const id = vfnote["attrs"].el.id;
  //       vfnote["attrs"].el.addEventListener("mousedown", (e: Event) => {
  //         console.log(id);
  //       });
  //     });
  //   });
  //   return <div id="tooltip">{}</div>;
  // }

  const selectedNoteData = useSelector((state: AppState) => state.selectedNoteData);
  console.log("tooltip", selectedNoteData);
  if (selectedNoteData !== null) {
    return <div id="tooltip">{selectedNoteData.noteNumber}</div>;
  }
  return null;
};
