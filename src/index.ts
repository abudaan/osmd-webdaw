import { createSong, setupSongListeners } from './create-song';
import { createScore } from './create-score';
import { getGraphicalNotesPerBar } from './util/osmd-notes';
import { parseMusicXML } from './util/musicxml';
import { mapOSMDToSequencer } from './util/osmd-heartbeat';

const init = async () => {
  const divLoading = document.getElementById('loading') as HTMLDivElement;
  const btnPlay = document.getElementById('play') as HTMLButtonElement;
  const btnStop = document.getElementById('stop') as HTMLButtonElement;
  btnPlay.disabled = true;
  btnStop.disabled = true;

  divLoading.innerHTML = 'init sequencer';
  const song = await createSong();
  divLoading.innerHTML = 'parsing musicxml';
  const [xmlDoc, osmd] = await createScore();

  divLoading.innerHTML = 'connecting heartbeat';
  console.time('connect_heartbeat');
  const heartbeatParsed = parseMusicXML(xmlDoc, song.ppq);
  const [, , repeats] = heartbeatParsed;
  console.timeEnd('connect_heartbeat');
  const notesPerBar = await getGraphicalNotesPerBar(osmd, song.ppq);
  console.log(notesPerBar);
  const noteMapping = mapOSMDToSequencer(notesPerBar, repeats as number[][], song);
  console.log(noteMapping);
  divLoading.style.display = 'none';

  setupSongListeners(song, noteMapping);

  song.addEventListener('stop', () => {
    btnPlay.innerHTML = 'play';
  });
  song.addEventListener('play', () => {
    btnPlay.innerHTML = 'pause';
  });
  song.addEventListener('end', () => {
    btnPlay.innerHTML = 'play';
  });

  btnPlay.disabled = false;
  btnStop.disabled = false;

  btnPlay.addEventListener('click', () => {
    if (song.playing) {
      // btnPlay.innerHTML = 'play';
      song.pause();
    } else {
      // btnPlay.innerHTML = 'pause';
      song.play();
    }
  });
  btnStop.addEventListener('click', () => { song.stop() });

}

init();
