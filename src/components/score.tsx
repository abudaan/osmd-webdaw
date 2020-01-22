import React, { useEffect, useRef, RefObject, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { AppState } from '../redux/store';
import { scoreReady } from '../redux/actions';

let i: number = 0;

export const Score: React.FC<{}> = ({ }) => {
  const [osmd, setOSMD] = useState<OpenSheetMusicDisplay | null>(null);
  const xmlDoc = useSelector((state: AppState) => { return state.data.currentXMLDoc; })
  // const xmlDoc = useSelector((state: AppState) => { return state.data.currentXMLDoc; })
  const dispatch = useDispatch();
  const refScore: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    if (xmlDoc) {
      console.log('[Score] useEffect');
      const scoreDiv = refScore.current;
      if (scoreDiv) {
        if (osmd === null) {
          const o = new OpenSheetMusicDisplay(scoreDiv, {
            backend: 'svg',
            autoResize: true,
          });
          setOSMD(o);
        } else {
          // window.openSheetMusicDisplay = openSheetMusicDisplay;  
          osmd.clear();
          try {
            osmd.load(xmlDoc)
              .then(() => {
                osmd.render();
                // idString is not set by osmd which is I believe a bug -> the default value is "random idString, not initialized"
                // osmd.idString = `score-${new Date().getTime()}`;
                dispatch(scoreReady(osmd))
              }, (e) => {
                console.log('OSMD reject', e);
              })
              .catch(e => {
                console.log('OSMD catch', e);
              })
          } catch (e) {
            // osmd's reject and catch don't work!
            console.log('final catch', e);
          }
        }
      }
    }
  });

  console.log('[Score] render (xmlDoc === null) ->', xmlDoc === null);

  return <div id="score-container" className={`render-${i++}`}>
    <div id="score" ref={refScore}></div>
  </div>
};