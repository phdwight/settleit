/** Generate a unique ID, with fallback for non-secure contexts (e.g. http://localhost in Edge). */
export function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback: use crypto.getRandomValues which works in all modern browsers
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Set version (4) and variant bits per RFC 4122
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}
