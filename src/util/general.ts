export const baseName = (str: string): string => {
  let base = str.substring(str.lastIndexOf('/') + 1);
  if (base.lastIndexOf(".") !== -1) {
    base = base.substring(0, base.lastIndexOf("."));
  }
  return base;
}