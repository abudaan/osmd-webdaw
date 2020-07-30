// simple function to download data that is generated by javascript to a file

export const download = (blob: Blob, name?: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("A") as HTMLAnchorElement;
  a.href = url;
  a.download = url;
  a.click();
  // a.name = name;
  window.URL.revokeObjectURL(url);
};

/*
export const download = (filename: string, text: string) => {
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename);

  element.style.display = "none";
  // document.body.appendChild(element);
  element.click();
  // document.body.removeChild(element);
};
*/
