import { OpenSheetMusicDisplay } from "opensheetmusicdisplay/build/dist/src";
import { Dispatch } from "redux";
import { getGraphicalNotesPerBar } from "../../webdaw/osmd/osmd-notes";
import { SCORE_READY, SELECTED_NOTE } from "../../constants";
import { download } from "../../util/download";

export const scoreReady = (osmd: OpenSheetMusicDisplay) => {
  return async (dispatch: Dispatch) => {
    const scoreContainer = (osmd["container"] as HTMLDivElement).parentElement;
    let scoreContainerOffsetY = 0;
    if (!!scoreContainer) {
      scoreContainerOffsetY = scoreContainer.offsetTop;
    }
    const notesPerBar = await getGraphicalNotesPerBar(osmd, 960);
    // console.log(notesPerBar);
    // console.log("notePerBar calculated");
    notesPerBar.forEach(notes => {
      notes.forEach(note => {
        const { vfnote } = note;
        // console.log(vfnote["attrs"].el);
        const id = vfnote["attrs"].el.id;
        vfnote["attrs"].el.addEventListener("mousedown", (e: Event) => {
          // console.log(id);
          dispatch({
            type: SELECTED_NOTE,
            payload: {
              id,
            },
          });
        });
      });
    });

    dispatch({
      type: SCORE_READY,
      payload: { notesPerBar, scoreContainerOffsetY, scoreContainer },
    });
  };
};
