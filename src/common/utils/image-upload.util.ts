/** Nome de ficheiro para uploads de imagem — sempre extensão `.png`. */
export function pngUploadFileName(stem: string): string {
    const base = stem.replace(/\.[^/.]+$/, '') || 'upload';
    return `${base}.png`;
}
