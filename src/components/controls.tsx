import React, { SyntheticEvent, useEffect, useRef, RefObject } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Dispatch } from 'redux';
import { selectXMLDoc, selectMIDIFile, uploadMIDIFile, uploadXMLDoc } from '../redux/actions';
import uniqid from 'uniqid';
import { AppState } from '../redux/store';

type Props = {};
export const Controls: React.FC<Props> = ({ }: Props) => {
  const refInputXML: RefObject<HTMLInputElement> = useRef(null);
  const refInputMIDI: RefObject<HTMLInputElement> = useRef(null);
  const dispatch: Dispatch = useDispatch();
  const xmlDocNames = useSelector((state: AppState) => { return state.data.xmlDocNames; }, shallowEqual)
  const midiFileNames = useSelector((state: AppState) => { return state.data.midiFileNames; }, shallowEqual)
  const xmlDocCurrentIndex = useSelector((state: AppState) => state.data.xmlDocCurrentIndex);
  const midiFileCurrentIndex = useSelector((state: AppState) => state.data.midiFileCurrentIndex);

  xmlDocNames.unshift('select MusicXML file');
  midiFileNames.unshift('select MIDI file');
  xmlDocNames.push('upload new');
  midiFileNames.push('upload new');

  const indexUploadXMLDoc = xmlDocNames.length - 1;
  const indexUploadMIDIFile = xmlDocNames.length - 1;

  // useEffect(() => {
  //   if (refInput && refInput.current) {
  //   }
  // }, [refInput.current]);

  console.log('[Controls] render');

  return <div id="controls">
    <select defaultValue={xmlDocCurrentIndex} onChange={(e) => {
      const index = e.target.selectedIndex;
      if (index === 0) {
        return;
      } else if (index === indexUploadXMLDoc && refInputXML.current) {
        refInputXML.current.click();
      } else {
        dispatch(selectXMLDoc(index));
      }
    }}>
      {xmlDocNames.map((val, i) => (<option key={uniqid()}>{val}</option>))}
    </select>
    <select defaultValue={midiFileCurrentIndex} onChange={(e) => {
      const index = e.target.selectedIndex;
      if (index === 0) {
        return;
      } else if (index === indexUploadMIDIFile && refInputMIDI.current) {
        refInputMIDI.current.click();
      } else {
        dispatch(selectMIDIFile(index));
      }
    }}>
      {midiFileNames.map((val, i) => (<option key={uniqid()}>{val}</option>))}
    </select>
    <input type="button" value="connect" />
    <input ref={refInputXML} type="file" id="upload" accept=".xml,.musicxml, .mxl" style={{ display: 'none' }} onChange={(e) => {
      const event = e.nativeEvent;
      if (event !== null) {
        const files = (event.target as HTMLInputElement).files;
        if (files && files[0]) {
          dispatch(uploadXMLDoc(files[0]));
        }
      }
    }}></input>
    <input ref={refInputMIDI} type="file" id="upload" accept=".mid,.midi" style={{ display: 'none' }} onChange={(e: SyntheticEvent) => {
      const event = e.nativeEvent;
      if (event !== null) {
        const files = (event.target as HTMLInputElement).files;
        if (files && files[0]) {
          dispatch(uploadMIDIFile(files[0]));
        }
      }
    }}></input>
  </div >
}