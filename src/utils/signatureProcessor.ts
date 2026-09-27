/**
 * Result of the signature detection and background removal pipeline
 */
export interface SignatureDetectionResult {
  detected: boolean;
  dataUrl?: string;
  errorMessageKey: 'noSignatureDetected' | 'imageTooDark' | 'imageBlank' | 'invalidSignatureImage';
  inkPixelCount: number;
  inkRatio: number;
  width: number;
  height: number;
}

/**
 * Analyzes an uploaded photo to detect whether it contains a real handwritten signature:
 * 1. Checks if the background is paper-like (light luminance).
 * 2. Checks if there are actual pen strokes / cursive writing.
 * 3. Rejects random photos (faces, cars, scenery, dark images, blank sheets).
 * 4. If a valid signature is found: strips paper background to 100% transparent PNG.
 * 5. If no signature is detected: returns detected: false with appropriate message key.
 */
export async function processAndDetectSignature(
  imageSource: string | File,
  threshold: number = 205,
  inkColor: 'original' | 'black' | 'blue' = 'original'
): Promise<SignatureDetectionResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve({
            detected: false,
            errorMessageKey: 'invalidSignatureImage',
            inkPixelCount: 0,
            inkRatio: 0,
            width: 0,
            height: 0,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const totalPixels = width * height;

        // Step 1: Calculate global luminance and paper baseline
        let totalLuminance = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
        }
        const avgLuminance = totalLuminance / totalPixels;

        // If the photo is mostly dark (night shot, black object, dark photo), it is NOT paper
        if (avgLuminance < 110) {
          resolve({
            detected: false,
            errorMessageKey: 'imageTooDark',
            inkPixelCount: 0,
            inkRatio: 0,
            width,
            height,
          });
          return;
        }

        // Step 2: Stroke detection & Bounding Box calculation
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let inkPixelCount = 0;

        // Adaptive threshold relative to image brightness
        const effectiveThreshold = Math.max(160, Math.min(235, threshold));

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a === 0) continue;

            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

            if (luminance >= effectiveThreshold) {
              // Paper background -> set alpha to transparent
              data[idx + 3] = 0;
            } else {
              // Potential pen ink
              const inkStrength = Math.min(
                1,
                ((effectiveThreshold - luminance) / (effectiveThreshold * 0.75)) * 1.3
              );
              const newAlpha = Math.round(inkStrength * 255);
              data[idx + 3] = Math.max(0, Math.min(255, newAlpha));

              if (data[idx + 3] > 30) {
                inkPixelCount++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;

                // Ink color tuning
                if (inkColor === 'black') {
                  data[idx] = Math.min(r, 18);
                  data[idx + 1] = Math.min(g, 18);
                  data[idx + 2] = Math.min(b, 22);
                } else if (inkColor === 'blue') {
                  data[idx] = Math.min(r, 22);
                  data[idx + 1] = Math.min(g, 50);
                  data[idx + 2] = Math.max(b, 150);
                }
              }
            }
          }
        }

        const inkRatio = inkPixelCount / totalPixels;
        const bboxWidth = maxX >= minX ? maxX - minX : 0;
        const bboxHeight = maxY >= minY ? maxY - minY : 0;

        // Step 3: Signature Heuristic Rules
        // Rule A: Blank sheet / virtually no ink (less than 50 ink pixels)
        if (inkPixelCount < 50) {
          resolve({
            detected: false,
            errorMessageKey: 'imageBlank',
            inkPixelCount,
            inkRatio,
            width: bboxWidth,
            height: bboxHeight,
          });
          return;
        }

        // Rule B: Overly dense / regular photograph (e.g. selfies, furniture, car, scenery)
        // A handwritten signature occupies typically 0.2% - 25% of paper.
        // If more than 35% of the frame is dark, it's a general photo, NOT a signature on paper.
        if (inkRatio > 0.35) {
          resolve({
            detected: false,
            errorMessageKey: 'noSignatureDetected',
            inkPixelCount,
            inkRatio,
            width: bboxWidth,
            height: bboxHeight,
          });
          return;
        }

        // Rule C: Bounding box size (minimum realistic handwritten stroke)
        if (bboxWidth < 30 || bboxHeight < 15) {
          resolve({
            detected: false,
            errorMessageKey: 'noSignatureDetected',
            inkPixelCount,
            inkRatio,
            width: bboxWidth,
            height: bboxHeight,
          });
          return;
        }

        // Rule D: Internal bounding box density
        // A real signature has lots of open whitespace inside its bounding box loops.
        // If the bounding box is > 78% solid ink, it is a solid graphic or block, not handwriting.
        const bboxArea = bboxWidth * bboxHeight;
        if (bboxArea > 0 && inkPixelCount / bboxArea > 0.80) {
          resolve({
            detected: false,
            errorMessageKey: 'noSignatureDetected',
            inkPixelCount,
            inkRatio,
            width: bboxWidth,
            height: bboxHeight,
          });
          return;
        }

        // Step 4: Valid signature detected! Crop cleanly with slight padding
        ctx.putImageData(imgData, 0, 0);

        const padding = 12;
        const cropX = Math.max(0, minX - padding);
        const cropY = Math.max(0, minY - padding);
        const cropWidth = Math.min(width - cropX, bboxWidth + padding * 2);
        const cropHeight = Math.min(height - cropY, bboxHeight + padding * 2);

        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;
        const croppedCtx = croppedCanvas.getContext('2d');

        if (croppedCtx) {
          croppedCtx.drawImage(
            canvas,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
          );

          resolve({
            detected: true,
            dataUrl: croppedCanvas.toDataURL('image/png'),
            errorMessageKey: 'noSignatureDetected',
            inkPixelCount,
            inkRatio,
            width: cropWidth,
            height: cropHeight,
          });
          return;
        }

        resolve({
          detected: true,
          dataUrl: canvas.toDataURL('image/png'),
          errorMessageKey: 'noSignatureDetected',
          inkPixelCount,
          inkRatio,
          width,
          height,
        });
      } catch (err) {
        resolve({
          detected: false,
          errorMessageKey: 'invalidSignatureImage',
          inkPixelCount: 0,
          inkRatio: 0,
          width: 0,
          height: 0,
        });
      }
    };

    img.onerror = () => {
      resolve({
        detected: false,
        errorMessageKey: 'invalidSignatureImage',
        inkPixelCount: 0,
        inkRatio: 0,
        width: 0,
        height: 0,
      });
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve({
          detected: false,
          errorMessageKey: 'invalidSignatureImage',
          inkPixelCount: 0,
          inkRatio: 0,
          width: 0,
          height: 0,
        });
      };
      reader.readAsDataURL(imageSource);
    }
  });
}

/**
 * Backward compatibility wrapper for re-processing threshold & color changes
 */
export async function removeSignatureBackground(
  imageSource: string | File,
  threshold: number = 205,
  inkColor: 'original' | 'black' | 'blue' = 'original'
): Promise<string> {
  const result = await processAndDetectSignature(imageSource, threshold, inkColor);
  if (result.detected && result.dataUrl) {
    return result.dataUrl;
  }
  throw new Error('No signature detected in this image');
}
