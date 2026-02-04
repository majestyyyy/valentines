/**
 * Hash email addresses using SHA-256 for privacy
 * This ensures student emails are not stored in plain text
 */
export async function hashEmail(email: string): Promise<string> {
  // Normalize email (lowercase and trim)
  const normalizedEmail = email.toLowerCase().trim();
  
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedEmail);
  
  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
