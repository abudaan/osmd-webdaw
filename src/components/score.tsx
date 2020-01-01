import React, { useEffect } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { useSelector, useDispatch } from 'react-redux';
import { AppState } from '../redux/store';
import { scoreRendered } from '../redux/actions';

export const Score: React.FC<{}> = ({ }) => {
  const xmlDoc = useSelector((state: AppState) => state.song.xmlDoc);
  const dispatch = useDispatch();
  useEffect(() => {
    if (xmlDoc) {
      const scoreDiv = document.getElementById('score');
      if (scoreDiv) {
        const osmd = new OpenSheetMusicDisplay(scoreDiv, {
          backend: 'svg',
          autoResize: true,
        });
        // window.openSheetMusicDisplay = openSheetMusicDisplay;  
        osmd.load(xmlDoc)
          .then(() => {
            osmd.render();
            dispatch(scoreRendered())
          });

      }
    }
  }, [xmlDoc])

  return null;
};