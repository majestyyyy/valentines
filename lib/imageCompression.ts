/**
 * Image Compression Utility
 * Compresses images to WebP format with max 500KB size
 * Optimized for mobile photos and profile pictures
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  fileType?: string;
}

export interface CompressionResult {
  success: boolean;
  file?: File;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

/**
 * Compresses an image file to reduce storage and bandwidth
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed file or error
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeMB = 0.5, // 500KB default
    maxWidthOrHeight = 1920, // 1080p max dimension
    quality = 0.8, // 80% quality
    fileType = 'image/webp' // WebP format for best compression
  } = options;

  const originalSize = file.size;

  try {
    // Load image
    const imageBitmap = await createImageBitmap(file);
    
    // Calculate new dimensions while maintaining aspect ratio
    let { width, height } = imageBitmap;
    if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
      if (width > height) {
        height = Math.round((height * maxWidthOrHeight) / width);
        width = maxWidthOrHeight;
      } else {
        width = Math.round((width * maxWidthOrHeight) / height);
        height = maxWidthOrHeight;
      }
    }

    // Create canvas and draw image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Use high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // Convert to blob with compression
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        fileType,
        quality
      );
    });

    // Check if compressed size is within limit
    const targetSizeBytes = maxSizeMB * 1024 * 1024;
    let finalBlob = blob;
    let currentQuality = quality;

    // If still too large, reduce quality further
    while (finalBlob.size > targetSizeBytes && currentQuality > 0.1) {
      currentQuality -= 0.1;
      finalBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          fileType,
          currentQuality
        );
      });
    }

    // Create new file from blob
    const fileExtension = fileType.split('/')[1];
    const fileName = file.name.replace(/\.[^/.]+$/, `.${fileExtension}`);
    const compressedFile = new File([finalBlob], fileName, { type: fileType });

    const compressedSize = compressedFile.size;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    console.log(`Image compressed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% reduction)`);

    return {
      success: true,
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio: parseFloat(compressionRatio)
    };

  } catch (error) {
    console.error('Image compression error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown compression error'
    };
  }
}

/**
 * Validates and compresses an image file
 * @param file - The image file to process
 * @returns Promise with compressed file or error
 */
export async function processImageForUpload(file: File): Promise<CompressionResult> {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'File must be an image'
    };
  }

  // Compress the image
  return compressImage(file, {
    maxSizeMB: 0.5, // 500KB max
    maxWidthOrHeight: 1920, // 1080p max
    quality: 0.85, // Start with 85% quality
    fileType: 'image/webp' // Use WebP for best compression
  });
}
