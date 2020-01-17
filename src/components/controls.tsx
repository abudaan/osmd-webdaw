import React, { SyntheticEvent, useEffect, useRef, RefObject } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Dispatch, AnyAction } from 'redux';
import { selectXMLDoc, selectMIDIFile, uploadMIDIFile, uploadXMLDoc, loadInitData } from '../redux/actions';
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

  const select1 = ['select MusicXML file', ...xmlDocNames, 'upload new'];
  const select2 = ['select MIDI file', ...midiFileNames, 'upload new'];

  const indexUploadXMLDoc = select1.length - 1;
  const indexUploadMIDIFile = select2.length - 1;

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
      } else if (index !== xmlDocCurrentIndex + 1) {
        dispatch(selectXMLDoc(index - 1));
      }
    }}>
      {select1.map((val, i) => (<option key={uniqid()}>{val}</option>))}
    </select>
    <select defaultValue={midiFileCurrentIndex} onChange={(e) => {
      const index = e.target.selectedIndex;
      if (index === 0) {
        return;
      } else if (index !== midiFileCurrentIndex + 1) {
        dispatch(selectMIDIFile(index - 1));
      } else if (index === indexUploadMIDIFile && refInputMIDI.current) {
        refInputMIDI.current.click();
      }
    }}>
      {select2.map((val, i) => (<option key={uniqid()}>{val}</option>))}
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