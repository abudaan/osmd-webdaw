import React, { useEffect, useRef, RefObject } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { AppState } from '../redux/store';
import { scoreReady } from '../redux/actions';

let i: number = 0;

export const Score: React.FC<{}> = ({ }) => {
  const xmlDoc = useSelector((state: AppState) => { return state.song.currentXMLDoc; }, shallowEqual)
  const dispatch = useDispatch();
  const refScore: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    if (xmlDoc) {
      console.log('[Score] useEffect');
      const scoreDiv = refScore.current;
      if (scoreDiv) {
        const osmd = new OpenSheetMusicDisplay(scoreDiv, {
          backend: 'svg',
          autoResize: true,
        });
        // window.openSheetMusicDisplay = openSheetMusicDisplay;  
        osmd.load(xmlDoc)
          .then(() => {
            osmd.render();
            // idString is not set by osmd which is I believe a bug -> the default value is "random idString, not initialized"
            // osmd.idString = `score-${new Date().getTime()}`;
            dispatch(scoreReady(osmd))
          });

      }
    }
  }, [xmlDoc])

  console.log('[Score] render (xmlDoc === null) ->', xmlDoc === null);

  return <div id="score-container" className={`render-${i++}`}>
    <div id="score" ref={refScore}></div>
  </div>
};