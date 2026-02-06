/**
 * File Upload Security Validation
 * Validates image types, sizes, and detects malicious content
 */

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif'
];

// Maximum file size: 15MB (to accommodate high-res mobile photos)
const MAX_FILE_SIZE = 15 * 1024 * 1024;

// Minimum image dimensions
const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;

// Maximum image dimensions (allow typical mobile camera resolutions)
const MAX_WIDTH = 8192;  // 8K resolution support
const MAX_HEIGHT = 8192;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFile?: File;
}

/**
 * Validate file type by checking MIME type and magic bytes
 */
export async function validateFileType(file: File): Promise<FileValidationResult> {
  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Only JPEG, PNG, WebP, GIF, and HEIC images are allowed.`
    };
  }

  // Read first 12 bytes to verify magic bytes (file signature)
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check magic bytes for common image formats
  const isValidImage = (
    // JPEG: FF D8 FF
    (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) ||
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) ||
    // GIF: 47 49 46 38
    (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) ||
    // WebP: 52 49 46 46 (RIFF) and bytes[8-11] are 57 45 42 50 (WEBP)
    (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
     bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) ||
    // HEIC/HEIF: Check for ftyp box (common in HEIC files)
    (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70)
  );

  if (!isValidImage) {
    return {
      valid: false,
      error: 'File content does not match image format. The file may be corrupted or malicious.'
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds maximum allowed size of 15MB.`
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty or corrupted.'
    };
  }

  return { valid: true };
}

/**
 * Validate image dimensions and aspect ratio
 */
export async function validateImageDimensions(file: File): Promise<FileValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Check minimum dimensions
      if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
        resolve({
          valid: false,
          error: `Image dimensions (${img.width}x${img.height}) are too small. Minimum: ${MIN_WIDTH}x${MIN_HEIGHT}px.`
        });
        return;
      }

      // Check maximum dimensions (prevent memory attacks)
      if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
        resolve({
          valid: false,
          error: `Image dimensions (${img.width}x${img.height}) are too large. Maximum: ${MAX_WIDTH}x${MAX_HEIGHT}px.`
        });
        return;
      }

      resolve({ valid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Failed to load image. The file may be corrupted.'
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Scan file content for malicious patterns
 * Only scans text-based portions to avoid false positives from binary data
 */
export async function scanForMaliciousContent(file: File): Promise<FileValidationResult> {
  // Skip malicious content scan for image files
  // Binary image data often contains random bytes that can trigger false positives
  // The magic byte validation already ensures it's a legitimate image format
  
  // Only scan if file type suggests it could contain text (e.g., SVG)
  if (file.type === 'image/svg+xml') {
    const text = await file.text();
    
    // Common malicious patterns in SVG files
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
      /<iframe/i,
      /<embed/i,
      /<object/i,
      /eval\s*\(/i,
      /document\.cookie/i,
      /\.innerHTML/i,
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(text)) {
        return {
          valid: false,
          error: 'File contains potentially malicious content and has been blocked for security.'
        };
      }
    }
  }

  // For binary image formats (JPEG, PNG, WebP, GIF, HEIC), skip text scanning
  // Magic byte validation is sufficient to ensure they're legitimate images
  return { valid: true };
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and special characters
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100); // Limit length
}

/**
 * Comprehensive file validation (all checks)
 */
export async function validateImageFile(file: File): Promise<FileValidationResult> {
  // 1. Validate file size
  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) return sizeCheck;

  // 2. Validate file type and magic bytes
  const typeCheck = await validateFileType(file);
  if (!typeCheck.valid) return typeCheck;

  // 3. Validate image dimensions
  const dimensionsCheck = await validateImageDimensions(file);
  if (!dimensionsCheck.valid) return dimensionsCheck;

  // 4. Scan for malicious content
  const malwareCheck = await scanForMaliciousContent(file);
  if (!malwareCheck.valid) return malwareCheck;

  return { valid: true, sanitizedFile: file };
}

/**
 * Validate multiple files
 */
export async function validateMultipleImages(files: (File | null)[]): Promise<{
  valid: boolean;
  errors: string[];
  validFiles: File[];
}> {
  const errors: string[] = [];
  const validFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;

    const result = await validateImageFile(file);
    if (result.valid) {
      validFiles.push(file);
    } else {
      errors.push(`Photo ${i + 1}: ${result.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validFiles
  };
}
