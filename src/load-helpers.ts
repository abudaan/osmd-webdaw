import YAML from 'yaml';
// import BSON from 'bson';

// about fetch reject, see:
// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Checking_that_the_fetch_was_successful


const json = (response: Response) => response.json();

const status = (response: Response) => {
  if (response.ok) {
    return response;
  }
  throw new Error(response.statusText);
  // if (response.status >= 200 && response.status < 300) {
  //     return Promise.resolve(response);
  // }
  // return Promise.reject(new Error(response.statusText));
};

const yaml = (response: Response) => response.text()
  .then(data => Promise.resolve(YAML.parse(data)))
  .catch(e => Promise.reject(e));

const arrayBuffer = (response: Response) => response.arrayBuffer();

const checkTypeAndParse = (response: Response) => {
  const type: string | null = response.headers.get('content-type');
  if (type !== null) {
    if (type.indexOf('application/json') === 0) {
      return json(response);
    }
    if (type.indexOf('text/yaml') === 0) {
      return yaml(response);
    }
  }
  return Promise.reject(new Error('could not detect type'));
};

const fetchREST = (url: string) => new Promise((resolve, reject) => {
  // fetch(url, {
  //   mode: 'no-cors'
  // })
  // console.log('REST');
  fetch(url)
    .then(status)
    .then(checkTypeAndParse)
    .then((data) => {
      resolve(data);
    })
    .catch((e) => {
      reject(e);
    });
});

const fetchJSON = (url: string) => new Promise((resolve, reject) => {
  // fetch(url, {
  //   mode: 'no-cors'
  // })
  fetch(url)
    .then(status)
    .then(json)
    .then((data) => {
      resolve(data);
    })
    .catch((e) => {
      reject(e);
    });
});

const fetchYAML = (url: string) => new Promise((resolve, reject) => {
  // fetch(url, {
  //   mode: 'no-cors'
  // })
  fetch(url)
    .then(status)
    .then(yaml)
    .then((data) => {
      resolve(data);
    })
    .catch((e) => {
      reject(e);
    });
});

const fetchJSONFiles = (urlArray: Array<string>) => new Promise((resolve, reject) => {
  const promises: Array<Promise<any>> = [];
  const errors: Array<string> = [];

  urlArray.forEach((url) => {
    promises.push(fetch(url)
      .then(status)
      .then(json)
      .then(data => data)
      .catch((e) => {
        errors.push(url);
        return null;
      }));
  });

  Promise.all(promises)
    .then(
      (data) => {
        const jsonFiles = data.filter(file => file !== null);
        resolve({ jsonFiles, errors });
      },
      (error) => {
        reject(error);
      },
    );
});

const fetchJSONFiles2 = (object, baseurl: string) => new Promise((resolve, reject) => {
  const promises: Promise<any>[] = [];
  const errors = [];
  const keys = [];

  Object.entries(object).forEach(([key, url]) => {
    keys.push(key);
    promises.push(fetch(baseurl + url)
      .then(status)
      .then(json)
      .then(data => data)
      .catch((e) => {
        errors.push(url);
        return null;
      }));
  });

  Promise.all(promises)
    .then(
      (data) => {
        const jsonFiles = {};
        data.forEach((file, index) => {
          if (file !== null) {
            jsonFiles[keys[index]] = file;
          }
        });
        resolve({ jsonFiles, errors });
      },
      (error) => {
        reject(error);
      },
    );
});

const fetchArraybuffer = (url: string) => new Promise((resolve, reject) => {
  // fetch(url, {
  //   mode: 'no-cors'
  // })
  fetch(url)
    .then(status)
    .then(arrayBuffer)
    .then((data) => {
      resolve(data);
    })
    .catch((e) => {
      reject(e);
    });
});

const load = (file, type = null) => {
  let t: string | null = type;
  let parsedJSON;
  if (t === null) {
    if (typeof file !== 'string') {
      t = 'object';
    } else if (file.search(/\.ya?ml/) !== -1) {
      t = 'yaml';
    } else if (file.search(/\.json/) !== -1) {
      t = 'json';
    } else {
      try {
        parsedJSON = JSON.parse(file, type);
        t = 'json-string';
      } catch (e) {
        t = null;
      }
    }
  }

  if (t === 'object') {
    return Promise.resolve(file);
  }
  if (t === 'json-string') {
    return Promise.resolve(parsedJSON);
  }
  if (t === 'json') {
    return fetchJSON(file, type)
      .then(data => data, e => e);
  }
  if (t === 'yaml') {
    return fetchYAML(file, type)
      .then(data => data, e => e);
  }
  return fetchREST(file)
    .then(data => data, e => e);
};

const loadImage = (url: string): Promise<HTMLImageElement | Error> =>
  fetch(url)
    .then(status)
    .then(response => response.blob())
    .then((blob: Blob) => {
      const i = new Image();
      return new Promise<HTMLImageElement | Error>((resolve, reject) => {
        i.onload = () => {
          resolve(i);
        }
        i.onerror = (e) => {
          reject(e)
        }
        i.src = URL.createObjectURL(blob);
      });
    })
    .catch(e => Promise.reject(new Error(e)));


const loadImages = (urls: Array<string>): Promise<Array<HTMLImageElement | Error>> =>
  Promise.all(urls.map(url => loadImage(url)));

export {
  load,
  status,
  // parsers
  json,
  yaml,
  arrayBuffer,
  // fetch helpers
  fetchJSON,
  fetchJSONFiles,
  fetchJSONFiles2,
  fetchYAML,
  fetchREST,
  loadImage,
  loadImages,
};
