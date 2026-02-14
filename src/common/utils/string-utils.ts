/**
 * Generates a random alphanumeric code of a given length.
 * Uses only uppercase letters and numbers, excluding confusing ones like O, 0, I, 1 if desired.
 * For now, keeping it simple with full alphanumeric.
 */
export const generateOrderCode = (length: number = 6): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
