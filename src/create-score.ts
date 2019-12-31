import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { loadMusicXMLFile } from 'heartbeat-sequencer';

const createScore = async (): Promise<[XMLDocument, OpenSheetMusicDisplay]> => {
  const options = {
    ignoreAttributes: false,
  }
  const c = document.getElementById('score');

  if (!c) {
    throw new Error('can not find the right div element');
  }

  const osmd = new OpenSheetMusicDisplay(c, {
    backend: 'svg',
    autoResize: true,
  });
  // window.openSheetMusicDisplay = openSheetMusicDisplay;

  const xmlDoc = await loadMusicXMLFile('./assets/mozk545a_musescore.musicxml');

  await osmd.load(xmlDoc);
  osmd.render();

  return [xmlDoc, osmd];
}

export { createScore }

