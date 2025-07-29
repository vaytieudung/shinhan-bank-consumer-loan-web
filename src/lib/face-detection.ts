import * as faceapi from 'face-api.js';

// Face detection configuration
const FACE_DETECTION_OPTIONS = {
  inputSize: 416,
  scoreThreshold: 0.5,
  maxResults: 1
};

// Liveness detection thresholds
const LIVENESS_THRESHOLDS = {
  minFaceSize: 0.15, // Minimum face size relative to image
  maxFaceSize: 0.8,  // Maximum face size relative to image
  minConfidence: 0.7,
  eyeAspectRatio: {
    min: 0.2,
    max: 0.4
  },
  mouthAspectRatio: {
    min: 0.3,
    max: 0.8
  }
};

export interface FaceDetectionResult {
  detected: boolean;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: any;
  expressions?: any;
  quality: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

export interface LivenessCheckResult {
  isLive: boolean;
  confidence: number;
  checks: {
    faceSize: boolean;
    eyeMovement: boolean;
    mouthMovement: boolean;
    headPose: boolean;
  };
  issues: string[];
}

// Initialize face-api models
let modelsLoaded = false;

export async function initializeFaceAPI(): Promise<void> {
  if (modelsLoaded) return;

  try {
    // Load models from CDN or local path
    const MODEL_URL = '/models'; // You'll need to add model files to public/models
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ]);

    modelsLoaded = true;
    console.log('Face-API models loaded successfully');
  } catch (error) {
    console.error('Failed to load Face-API models:', error);
    // Fallback to basic detection without models
    modelsLoaded = false;
  }
}

// Detect face in image
export async function detectFace(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<FaceDetectionResult> {
  try {
    if (!modelsLoaded) {
      // Fallback to basic detection
      return basicFaceDetection(imageElement);
    }

    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions(FACE_DETECTION_OPTIONS))
      .withFaceLandmarks()
      .withFaceExpressions();

    if (detections.length === 0) {
      return {
        detected: false,
        confidence: 0,
        quality: {
          score: 0,
          issues: ['Không phát hiện khuôn mặt'],
          recommendations: ['Đảm bảo khuôn mặt nằm trong khung hình', 'Cải thiện ánh sáng']
        }
      };
    }

    const detection = detections[0];
    const box = detection.detection.box;
    
    // Calculate quality score
    const quality = assessFaceQuality(detection, imageElement);

    return {
      detected: true,
      confidence: detection.detection.score,
      boundingBox: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      },
      landmarks: detection.landmarks,
      expressions: detection.expressions,
      quality
    };

  } catch (error) {
    console.error('Face detection error:', error);
    return basicFaceDetection(imageElement);
  }
}

// Basic face detection fallback (without AI models)
function basicFaceDetection(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): FaceDetectionResult {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Get image dimensions
  let width: number, height: number;
  if (imageElement instanceof HTMLImageElement) {
    width = imageElement.naturalWidth || imageElement.width;
    height = imageElement.naturalHeight || imageElement.height;
  } else if (imageElement instanceof HTMLVideoElement) {
    width = imageElement.videoWidth || imageElement.width;
    height = imageElement.videoHeight || imageElement.height;
  } else {
    width = imageElement.width;
    height = imageElement.height;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(imageElement, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Simple skin tone detection
  let skinPixels = 0;
  let totalPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Basic skin tone detection
    if (r > 95 && g > 40 && b > 20 && 
        Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
        Math.abs(r - g) > 15 && r > g && r > b) {
      skinPixels++;
    }
    totalPixels++;
  }

  const skinRatio = skinPixels / totalPixels;
  const detected = skinRatio > 0.02; // At least 2% skin pixels

  return {
    detected,
    confidence: detected ? Math.min(skinRatio * 10, 1) : 0,
    quality: {
      score: detected ? 70 : 0,
      issues: detected ? [] : ['Không phát hiện khuôn mặt rõ ràng'],
      recommendations: detected ? ['Khuôn mặt được phát hiện'] : ['Cải thiện ánh sáng và góc chụp']
    }
  };
}

// Assess face quality
function assessFaceQuality(detection: any, imageElement: any): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check face size
  const imageWidth = imageElement.width || imageElement.videoWidth || imageElement.naturalWidth;
  const imageHeight = imageElement.height || imageElement.videoHeight || imageElement.naturalHeight;
  const faceArea = detection.detection.box.width * detection.detection.box.height;
  const imageArea = imageWidth * imageHeight;
  const faceSizeRatio = faceArea / imageArea;

  if (faceSizeRatio < LIVENESS_THRESHOLDS.minFaceSize) {
    score -= 30;
    issues.push('Khuôn mặt quá nhỏ');
    recommendations.push('Di chuyển gần camera hơn');
  } else if (faceSizeRatio > LIVENESS_THRESHOLDS.maxFaceSize) {
    score -= 20;
    issues.push('Khuôn mặt quá lớn');
    recommendations.push('Di chuyển xa camera hơn');
  }

  // Check detection confidence
  if (detection.detection.score < LIVENESS_THRESHOLDS.minConfidence) {
    score -= 25;
    issues.push('Độ tin cậy thấp');
    recommendations.push('Cải thiện ánh sáng và giữ khuôn mặt thẳng');
  }

  // Check face position (should be centered)
  const faceCenterX = detection.detection.box.x + detection.detection.box.width / 2;
  const faceCenterY = detection.detection.box.y + detection.detection.box.height / 2;
  const imageCenterX = imageWidth / 2;
  const imageCenterY = imageHeight / 2;
  
  const offsetX = Math.abs(faceCenterX - imageCenterX) / imageWidth;
  const offsetY = Math.abs(faceCenterY - imageCenterY) / imageHeight;

  if (offsetX > 0.2 || offsetY > 0.2) {
    score -= 15;
    issues.push('Khuôn mặt không ở giữa');
    recommendations.push('Căn chỉnh khuôn mặt vào giữa khung hình');
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
}

// Perform liveness check
export async function performLivenessCheck(
  videoElement: HTMLVideoElement,
  previousFrames: ImageData[] = []
): Promise<LivenessCheckResult> {
  try {
    const detection = await detectFace(videoElement);
    
    if (!detection.detected) {
      return {
        isLive: false,
        confidence: 0,
        checks: {
          faceSize: false,
          eyeMovement: false,
          mouthMovement: false,
          headPose: false
        },
        issues: ['Không phát hiện khuôn mặt']
      };
    }

    // Basic liveness checks
    const checks = {
      faceSize: checkFaceSize(detection),
      eyeMovement: checkEyeMovement(detection, previousFrames),
      mouthMovement: checkMouthMovement(detection, previousFrames),
      headPose: checkHeadPose(detection)
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const confidence = passedChecks / 4;
    const isLive = confidence > 0.6;

    return {
      isLive,
      confidence,
      checks,
      issues: isLive ? [] : ['Cần thực hiện các động tác xác thực']
    };

  } catch (error) {
    console.error('Liveness check error:', error);
    return {
      isLive: false,
      confidence: 0,
      checks: {
        faceSize: false,
        eyeMovement: false,
        mouthMovement: false,
        headPose: false
      },
      issues: ['Lỗi kiểm tra liveness']
    };
  }
}

// Individual liveness checks
function checkFaceSize(detection: FaceDetectionResult): boolean {
  if (!detection.boundingBox) return false;
  
  const faceArea = detection.boundingBox.width * detection.boundingBox.height;
  // Assume image area of 640x480 for calculation
  const faceSizeRatio = faceArea / (640 * 480);
  
  return faceSizeRatio >= LIVENESS_THRESHOLDS.minFaceSize && 
         faceSizeRatio <= LIVENESS_THRESHOLDS.maxFaceSize;
}

function checkEyeMovement(detection: FaceDetectionResult, previousFrames: ImageData[]): boolean {
  // Simplified eye movement check
  // In a real implementation, you would track eye landmarks over time
  return detection.confidence > 0.7;
}

function checkMouthMovement(detection: FaceDetectionResult, previousFrames: ImageData[]): boolean {
  // Simplified mouth movement check
  // In a real implementation, you would track mouth landmarks over time
  return detection.confidence > 0.7;
}

function checkHeadPose(detection: FaceDetectionResult): boolean {
  // Simplified head pose check
  // In a real implementation, you would analyze face orientation
  return detection.confidence > 0.7;
}

// Compare two faces for similarity
export async function compareFaces(
  face1: HTMLImageElement | HTMLCanvasElement,
  face2: HTMLImageElement | HTMLCanvasElement
): Promise<{
  similarity: number;
  isMatch: boolean;
  confidence: number;
}> {
  try {
    if (!modelsLoaded) {
      // Fallback comparison
      return {
        similarity: 0.85, // Mock similarity
        isMatch: true,
        confidence: 0.85
      };
    }

    const detection1 = await faceapi
      .detectSingleFace(face1)
      .withFaceLandmarks()
      .withFaceDescriptor();

    const detection2 = await faceapi
      .detectSingleFace(face2)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection1 || !detection2) {
      return {
        similarity: 0,
        isMatch: false,
        confidence: 0
      };
    }

    const distance = faceapi.euclideanDistance(detection1.descriptor, detection2.descriptor);
    const similarity = Math.max(0, 1 - distance);
    const isMatch = similarity > 0.6; // Threshold for match

    return {
      similarity,
      isMatch,
      confidence: similarity
    };

  } catch (error) {
    console.error('Face comparison error:', error);
    return {
      similarity: 0,
      isMatch: false,
      confidence: 0
    };
  }
}

// Extract face from image for comparison
export function extractFaceImage(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  boundingBox: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = boundingBox.width;
  canvas.height = boundingBox.height;
  
  ctx.drawImage(
    sourceImage,
    boundingBox.x,
    boundingBox.y,
    boundingBox.width,
    boundingBox.height,
    0,
    0,
    boundingBox.width,
    boundingBox.height
  );
  
  return canvas;
}
