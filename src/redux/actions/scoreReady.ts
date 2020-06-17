import { OpenSheetMusicDisplay } from "opensheetmusicdisplay/build/dist/src";
import { Dispatch } from "redux";
import { getGraphicalNotesPerBar } from "../../util/osmd-notes";
import { SCORE_READY } from "../../constants";

export const scoreReady = (osmd: OpenSheetMusicDisplay) => {
  return async (dispatch: Dispatch) => {
    const scoreContainer = (osmd["container"] as HTMLDivElement).parentElement;
    let scoreContainerOffsetY = 0;
    if (!!scoreContainer) {
      scoreContainerOffsetY = scoreContainer.offsetTop;
    }
    const notesPerBar = await getGraphicalNotesPerBar(osmd, 960);
    dispatch({
      type: SCORE_READY,
      payload: { notesPerBar, scoreContainerOffsetY, scoreContainer },
    });
  };
};
