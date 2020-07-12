export const baseName = (str: string): string => {
  let base = str.substring(str.lastIndexOf("/") + 1);
  if (base.lastIndexOf(".") !== -1) {
    base = base.substring(0, base.lastIndexOf("."));
  }
  return base;
};

export const download = (blob: Blob, name?: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("A") as HTMLAnchorElement;
  a.href = url;
  a.download = url;
  a.click();
  a.name = name;
  window.URL.revokeObjectURL(url);
};
