import React, { useEffect, useRef, RefObject } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { useSelector, useDispatch } from 'react-redux';
import { AppState } from '../redux/store';
import { scoreRendered } from '../redux/actions';

export const Score: React.FC<{}> = ({ }) => {
  const xmlDoc = useSelector((state: AppState) => {
    const index = state.song.currentXMLDocIndex;
    if (index !== -1) {
      return state.song.xmlDocs[state.song.currentXMLDocIndex]
    }
    return null;
  }, (stateNew: XMLDocument | null, stateOld: XMLDocument | null) => {
    // console.log(stateNew, stateOld);
    if (stateNew === null && stateOld === null) {
      // console.log('no re-render');
      return true;
    }
    // console.log('re-render');
    return false;
  });

  const dispatch = useDispatch();
  const refScore: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    if (xmlDoc) {
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
            dispatch(scoreRendered(osmd))
          });

      }
    }
  }, [xmlDoc])

  return <div id="score-container">
    <div id="score" ref={refScore}></div>
  </div>
};