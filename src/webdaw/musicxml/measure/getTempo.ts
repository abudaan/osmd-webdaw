import { TempoEvent } from "../../midi_events";

export const getTempo = (
  xmlDoc: XMLDocument,
  measureNode: Node,
  nsResolver: XPathNSResolver
): TempoEvent => {
  const bpm = xmlDoc.evaluate(
    "direction/sound/@tempo",
    measureNode,
    nsResolver,
    XPathResult.NUMBER_TYPE,
    null
  ).numberValue;

  if (!isNaN(bpm)) {
    // console.log("BPM", tmp);
    const event: TempoEvent = {
      type: 0xff,
      subType: 0x51,
      descr: "tempo",
      ticks: -1, // will be set later
      millisPerTick: -1, // will be set later
      bpm,
    };
    return event;
  }

  return null;
};
