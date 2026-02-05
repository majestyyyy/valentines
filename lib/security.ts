import validator from 'validator';
import xss from 'xss';

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - Raw user input string
 * @returns Sanitized string safe for storage and display
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  // Trim whitespace and remove ALL HTML tags
  const trimmed = validator.trim(input);
  return xss(trimmed, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true, // Strip tags instead of escaping
    stripIgnoreTagBody: ['script', 'style', 'iframe'] // Remove these tags and their content
  });
};

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns True if valid email format
 */
export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

/**
 * Validates and sanitizes profile data
 * @param data - Profile data object
 * @returns Sanitized profile data
 */
export const sanitizeProfileData = (data: any) => {
  return {
    ...data,
    nickname: data.nickname ? sanitizeInput(data.nickname) : null,
    description: data.description ? sanitizeInput(data.description) : null,
    hobbies: data.hobbies?.map((h: string) => sanitizeInput(h)) || []
  };
};

/**
 * Validates nickname - alphanumeric, spaces, basic punctuation only
 * @param nickname - Nickname to validate
 * @returns True if valid nickname
 */
export const validateNickname = (nickname: string): boolean => {
  if (!nickname || nickname.length < 2 || nickname.length > 50) {
    return false;
  }
  // Allow letters, numbers, spaces, hyphens, underscores, and apostrophes
  return /^[a-zA-Z0-9\s\-_']+$/.test(nickname);
};

/**
 * Validates description text
 * @param description - Description to validate
 * @returns True if valid description
 */
export const validateDescription = (description: string): boolean => {
  if (!description) return true; // Optional field
  return description.length <= 500; // Max 500 characters
};

/**
 * Sanitizes message content
 * @param message - Message text
 * @returns Sanitized message
 */
export const sanitizeMessage = (message: string): string => {
  if (!message) return '';
  // Allow some basic formatting but strip dangerous content
  return xss(validator.trim(message), {
    whiteList: {
      b: [],
      i: [],
      em: [],
      strong: []
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe']
  });
};

/**
 * Validates URL format (for photo URLs)
 * @param url - URL to validate
 * @returns True if valid URL
 */
export const validateURL = (url: string): boolean => {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  });
};

/**
 * Rate limiting check - prevents spam
 * @param lastActionTime - Timestamp of last action
 * @param minIntervalMs - Minimum interval in milliseconds
 * @returns True if action is allowed
 */
export const canPerformAction = (lastActionTime: number, minIntervalMs: number = 1000): boolean => {
  const now = Date.now();
  return (now - lastActionTime) >= minIntervalMs;
};
