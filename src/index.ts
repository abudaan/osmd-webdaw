import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

const parse = (xmlDoc: XMLDocument, ppq: number) => {
  if (xmlDoc === null) {
    return;
  }
  let type;
  if (xmlDoc.firstChild !== null && xmlDoc.firstChild.nextSibling !== null) {
    type = xmlDoc.firstChild.nextSibling.nodeName;
  }
  // console.log('type', type, nsResolver);

  if (type === 'score-partwise') {
    return parsePartWise(xmlDoc, ppq);
  } else if (type === 'score-timewise') {
    return parseTimeWise(xmlDoc);
  } else {
    console.log('unknown type', type);
    return false;
  }
}

const parsePartWise = (xmlDoc: XMLDocument, ppq: number) => {
  const nsResolver = xmlDoc.createNSResolver(xmlDoc.ownerDocument === null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
  const partIterator = xmlDoc.evaluate('//score-part', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null);
  const data = {};

  let partNode;
  while (partNode = partIterator.iterateNext()) {
    // get id and name of the part
    const id = xmlDoc.evaluate('@id', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
    const name = xmlDoc.evaluate('part-name', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;

    console.log(name)

    let ticks = 0;
    const measureIterator = xmlDoc.evaluate('//part[@id="' + id + '"]/measure', partNode, nsResolver, XPathResult.ANY_TYPE, null);
    let measureNode;
    let divisions = 1;
    let numerator = 4;
    let denominator = 4;
    let tmp;
    while (measureNode = measureIterator.iterateNext()) {
      const measureNumber = xmlDoc.evaluate('@number', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      tmp = xmlDoc.evaluate('attributes/divisions', partNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp)) {
        divisions = tmp;
      }
      tmp = xmlDoc.evaluate('attributes/time/beats', partNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp)) {
        numerator = tmp;
      }
      tmp = xmlDoc.evaluate('attributes/time/beat-type', partNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp)) {
        denominator = tmp;
      }

      // get all notes and backups
      const noteIterator = xmlDoc.evaluate('*[self::note or self::backup or self::forward]', measureNode, nsResolver, XPathResult.ANY_TYPE, null);
      let noteNode;
      while (noteNode = noteIterator.iterateNext()) {
        // console.log(noteNode);
        let noteDuration = 0;
        let tieStart = false;
        let tieStop = false;
        const tieIterator = xmlDoc.evaluate('tie', noteNode, nsResolver, XPathResult.ANY_TYPE, null);
        let tieNode;
        while (tieNode = tieIterator.iterateNext()) {
          const tieType = xmlDoc.evaluate('@type', tieNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
          if (tieType === 'start') {
            tieStart = true;
          } else if (tieType === 'stop') {
            tieStop = true;
          }
        }

        const rest = xmlDoc.evaluate('rest', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const chord = xmlDoc.evaluate('chord', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (rest !== null) {
          //console.log(rest);
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          ticks += (noteDuration / divisions) * ppq;
        } else if (noteNode.nodeName === 'note') {
          const step = xmlDoc.evaluate('pitch/step', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
          const alter = xmlDoc.evaluate('pitch/alter', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          const voice = xmlDoc.evaluate('voice', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          const stave = xmlDoc.evaluate('stave', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          const octave = xmlDoc.evaluate('pitch/octave', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          // const noteType = xmlDoc.evaluate('type', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
          let noteName = step;

          if (step !== '') {
            if (!isNaN(alter)) {
              switch (alter) {
                case -2:
                  noteName += 'bb';
                  break;
                case -1:
                  noteName += 'b';
                  break;
                case 1:
                  noteName += '#';
                  break;
                case 2:
                  noteName += '##';
                  break;
              }
            }
            /*
            const noteNumber = getNoteNumber(noteName, octave);
            ticks += (noteDuration / divisions) * ppq;
            if (chord !== null) {
              ticks -= (noteDuration / divisions) * ppq;
            }

            //console.log('tie', tieStart, tieStop);

            if (tieStart === false && tieStop === false) {
              // no ties
              events.push(noteOn, noteOff);
              //console.log('no ties', measureNumber, voice, noteNumber, tiedNotes);
            } else if (tieStart === true && tieStop === false) {
              // start of tie
              tiedNotes[voice + '-' + noteNumber] = noteOff;
              events.push(noteOn, noteOff);
              //console.log('start', measureNumber, voice, noteNumber, tiedNotes);
            } else if (tieStart === true && tieStop === true) {
              // tied to yet another note
              tiedNotes[voice + '-' + noteNumber].ticks += (noteDuration / divisions) * ppq;
              //console.log('thru', measureNumber, voice, noteNumber, tiedNotes);
            } else if (tieStart === false && tieStop === true) {
              // end of tie
              tiedNotes[voice + '-' + noteNumber].ticks += (noteDuration / divisions) * ppq;
              delete tiedNotes[voice + '-' + noteNumber];
              //console.log('end', measureNumber, voice, noteNumber, tiedNotes);
            }
            //console.log(noteNumber, ticks);
            */
          }

        } else if (noteNode.nodeName === 'backup') {
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          ticks -= (noteDuration / divisions) * ppq;
          //console.log(noteDuration, divisions);
        } else if (noteNode.nodeName === 'forward') {
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          ticks += (noteDuration / divisions) * ppq;
          //console.log(noteDuration, divisions);
        }
        //console.log(ticks);
      }
    }
  }
}

const parseTimeWise = (doc: XMLDocument) => {

}

// const url = './assets/mozk545a.musicxml';
const url = './assets/mozk545a_musescore.musicxml';
// const url = './assets/test2.xml';
// const url = './assets/minute_waltz-snippet.musicxml';
const options = {
  ignoreAttributes: false,
}
const c = document.createElement('div');
document.body.appendChild(c);
const openSheetMusicDisplay = new OpenSheetMusicDisplay(c, {
  backend: 'svg',
  autoResize: true,
});
window.openSheetMusicDisplay = openSheetMusicDisplay;

const init = async () => {
  await fetch(url)
    .then(response => response.text())
    .then(str => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(str, 'application/xml');
      parse(xmlDoc, 960);
      openSheetMusicDisplay.load(xmlDoc).then(
        function () {
          openSheetMusicDisplay.render();
          // const notes = c.getElementsByClassName('vf-stavenote');
          // console.log(notes);
        },
        function (e) {
          console.error(e, 'rendering');
        });
    });
}

init();

