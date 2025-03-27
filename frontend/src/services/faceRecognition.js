import * as faceapi from '@vladmandic/face-api';

export const loadModels = async () => {
  const MODEL_URL = '/models';
  
  await Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
  ]);
};

export const getImageDescriptor = async (imageSource) => {
  try {
    let img;
    if (imageSource.startsWith('data:image')) {
      // Handle base64 image
      img = await createImageFromBase64(imageSource);
    } else {
      // Handle URL image
      img = await faceapi.fetchImage(imageSource);
    }

    const detection = await faceapi.detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection) {
      console.log('No face detected in image');
      return null;
    }
    
    return detection.descriptor;
  } catch (error) {
    console.error('Error getting image descriptor:', error);
    return null;
  }
};

const createImageFromBase64 = (base64String) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64String;
  });
};

export const compareFaces = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2) return 0;
  return faceapi.euclideanDistance(descriptor1, descriptor2);
};
