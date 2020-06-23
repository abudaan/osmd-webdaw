export const getDivisions = (
  xmlDoc: XMLDocument,
  measureNode: Node,
  nsResolver: XPathNSResolver
): number => {
  const divisions = xmlDoc.evaluate(
    "attributes/divisions",
    measureNode,
    nsResolver,
    XPathResult.NUMBER_TYPE,
    null
  ).numberValue;

  if (!isNaN(divisions)) {
    return divisions;
    // console.log('divisions', divisions);
  }

  return 24;
};
