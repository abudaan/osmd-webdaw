let fileReader: FileReader;

export const fileReaderPromise = (file: File): Promise<ProgressEvent<FileReader>> => {
  if (!fileReader) {
    fileReader = new FileReader();
  }
  const type = file.type;
  return new Promise((resolve, reject) => {
    fileReader.onload = evt => {
      resolve(evt);
    };
    fileReader.onerror = evt => {
      reject(evt);
    };
    if (type.indexOf("xml") !== -1) {
      fileReader.readAsText(file);
    } else if (type.indexOf("mid") !== -1) {
      fileReader.readAsArrayBuffer(file);
    }
  });
};
