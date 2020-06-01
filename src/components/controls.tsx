import React, { SyntheticEvent, useEffect, useRef, RefObject } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { Dispatch, AnyAction } from "redux";
import { selectXMLDoc, selectMIDIFile } from "../redux/actions1";
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
  // const midiFileNames = useSelector((state: AppState) => { return state.data.midiFiles.map(val => val.name); }, shallowEqual)
  // const xmlDocCurrentIndex = useSelector((state: AppState) => state.data.xmlDocCurrentIndex);
  // const midiFileCurrentIndex = useSelector((state: AppState) => state.data.midiFileCurrentIndex);

  // const select1 = ['select MusicXML file', ...xmlDocNames, 'upload new'];
  // const select2 = ['select MIDI file', ...midiFileNames, 'upload new'];

  // const indexUploadXMLDoc = select1.length - 1;
  // const indexUploadMIDIFile = select2.length - 1;

  // useEffect(() => {
  //   if (refInput && refInput.current) {
  //   }
  // }, [refInput.current]);

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

  const xmlDocCurrentIndex = 0;
  const midiFileCurrentIndex = 0;
  const midiFileNames = ["midi"];
  const select1 = ["select MusicXML file", ...xmlDocNames];
  const select2 = ["select MIDI file", ...midiFileNames];

  console.log("[Controls] render");

  return (
    <div id="controls">
      <select
        defaultValue={xmlDocCurrentIndex}
        onChange={e => {
          const index = e.target.selectedIndex;
          if (index === 0) {
            return;
          } else if (index !== xmlDocCurrentIndex + 1) {
            dispatch(selectXMLDoc(index - 1));
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
        defaultValue={midiFileCurrentIndex}
        onChange={e => {
          const index = e.target.selectedIndex;
          if (index === 0) {
            return;
          } else if (index !== midiFileCurrentIndex + 1) {
            dispatch(selectMIDIFile(index - 1));
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
