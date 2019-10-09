self.addEventListener('message', (event) => {
  const messageData = event.data;

  var imageData = messageData.imageData;
  var redMultiplier = messageData.layerColour[0] / 255;
  var greenMultiplier = messageData.layerColour[1] / 255;
  var blueMultiplier = messageData.layerColour[2] / 255;

  for (i = 0; i < imageData.length; i += 4) {
    if (imageData[3] === 0) {
      imageData[i] = imageData[i] * redMultiplier;
      imageData[i + 1] = imageData[i + 1] * greenMultiplier;
      imageData[i + 2] = imageData[i + 2] * blueMultiplier;
    }
  }
  // console.log('b', imageData.buffer.byteLength);
  self.postMessage({
    imageData: imageData,
  }, [imageData.buffer]);
  // console.log('a', imageData.buffer.byteLength);
  self.close();
})