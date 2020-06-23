export const getRepeat = (
  xmlDoc: XMLDocument,
  measureNode: Node,
  nsResolver: XPathNSResolver
): string => {
  const repeat = xmlDoc.evaluate(
    "barline/repeat/@direction",
    measureNode,
    nsResolver,
    XPathResult.STRING_TYPE,
    null
  ).stringValue;

  if (repeat !== "") {
    // console.log(tmp, measureNumber);
    return repeat;
  }

  return null;
};
