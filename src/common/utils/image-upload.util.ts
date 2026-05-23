/** Nome de ficheiro para uploads de imagem com extensão conforme o MIME. */
export function imageUploadFileName(stem: string, mimeType = 'image/png'): string {
    const base = stem.replace(/\.[^/.]+$/, '') || 'upload';
    const ext =
        mimeType === 'image/jpeg' || mimeType === 'image/jpg' ? 'jpg' : 'png';
    return `${base}.${ext}`;
}

/** @deprecated Prefer {@link imageUploadFileName} com o MIME real do ficheiro. */
export function pngUploadFileName(stem: string): string {
    return imageUploadFileName(stem, 'image/png');
}

export function uploadContentType(file?: Express.Multer.File): string {
    const mime = file?.mimetype;
    if (mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp') {
        return mime;
    }
    return 'image/png';
}
