import React, { SyntheticEvent, useRef, RefObject } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { selectScore } from "../redux/actions/selectScore";
import { selectInterpretation } from "../redux/actions/selectInterpretation";
import uniqid from "uniqid";
import { AppState } from "../redux/store";
import { uploadXMLDoc } from "../redux/actions/uploadXMLDoc";
import { uploadMIDIFile } from "../redux/actions/uploadMIDIFile";
import { AppDispatch } from "./types";

type Props = {};
export const Controls: React.FC<Props> = ({}: Props) => {
  const dispatch: AppDispatch = useDispatch();
  const xmlDocNames = useSelector((state: AppState) => {
    return state.scores.map(val => val.name);
  }, shallowEqual);
  const midiFileNames = useSelector((state: AppState) => {
    return state.interpretations.map(val => val.name);
  }, shallowEqual);
  const selectedScoreIndex = useSelector((state: AppState) => state.selectedScoreIndex);
  const selectedInterpretationIndex = useSelector(
    (state: AppState) => state.selectedInterpretationIndex
  );

  const refs: { [id: string]: RefObject<HTMLInputElement> } = {
    mxml: useRef(),
    midi: useRef(),
  };

  const onClick = (type: string): void => {
    const ref = refs[type];
    if (ref.current) {
      ref.current.value = null;
      ref.current.click();
    }
  };

  const select1 = ["select MusicXML file", ...xmlDocNames];
  const select2 = ["select MIDI file", ...midiFileNames];

  console.log("[Controls] render");

  return (
    <div id="controls">
      <select
        defaultValue={selectedScoreIndex}
        onChange={e => {
          const index = e.target.selectedIndex;
          if (index === 0) {
            return;
          } else if (index !== selectedScoreIndex) {
            dispatch(selectScore(index));
          }
        }}
      >
        {select1.map((val, i) => (
          <option key={uniqid()}>{val}</option>
        ))}
      </select>

      <input
        ref={refs.mxml}
        type="file"
        id="upload"
        accept=".xml,.musicxml, .mxl"
        style={{ display: "none" }}
        onChange={e => {
          const files = (event.target as HTMLInputElement).files;
          if (files && files[0]) {
            dispatch(uploadXMLDoc(files[0]));
          }
        }}
      />
      <button
        type="button"
        onClick={(): void => {
          onClick("mxml");
        }}
      >
        add mxml file
      </button>

      <select
        defaultValue={selectedInterpretationIndex}
        onChange={e => {
          const index = e.target.selectedIndex;
          if (index === 0) {
            return;
          } else if (index !== selectedInterpretationIndex) {
            dispatch(selectInterpretation(index));
          }
        }}
      >
        {select2.map((val, i) => (
          <option key={uniqid()}>{val}</option>
        ))}
      </select>

      <input
        ref={refs.midi}
        type="file"
        id="upload"
        accept=".mid,.midi"
        style={{ display: "none" }}
        onChange={(e: SyntheticEvent) => {
          const files = (event.target as HTMLInputElement).files;
          if (files && files[0]) {
            dispatch(uploadMIDIFile(files[0]));
          }
        }}
      />
      <button
        type="button"
        onClick={(): void => {
          onClick("midi");
        }}
      >
        add midi file
      </button>

      <input type="button" value="connect" />
    </div>
  );
};
