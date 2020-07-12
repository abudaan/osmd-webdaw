import uniqid from "uniqid";
import React, { SyntheticEvent, useEffect, useRef, RefObject } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { fromEvent } from "rxjs";
import { map } from "rxjs/operators";
import { Dispatch } from "redux";
import { AppState } from "../types";
import { TempoEvent } from "../webdaw/midi_events";

type Props = {};
export const List: React.FC<Props> = ({}: Props) => {
  const refMIDI = useSelector((state: AppState) => state.currentInterpretation);
  // console.log("LIST", refMIDI);

  if (!refMIDI) {
    return null;
  }

  const { events } = refMIDI.song;
  // console.log("LIST", events);
  const list = events.map(event => {
    let data1 = "";
    let data2 = "";
    if (event.descr === "note on" || event.descr === "note off") {
      data1 = `${event.noteNumber}`;
      data2 = `${event.velocity}`;
    } else if (event.descr === "tempo") {
      data1 = `${(event as TempoEvent).bpm}`;
    }
    return (
      <tr id={uniqid()}>
        <td>{event.bar + 1}</td>
        <td>{event.ticks}</td>
        <td>{event.millis}</td>
        <td>{event.descr}</td>
        <td>{data1}</td>
        <td>{data2}</td>
      </tr>
    );
  });
  return <table id="list">{list}</table>;
};
