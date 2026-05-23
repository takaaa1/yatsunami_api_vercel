/** Extrai object key R2 a partir de URL pública ou path relativo. */
export function resolveObjectKeyFromUrl(imageUrl: string): string | null {
    const trimmed = imageUrl?.trim();
    if (!trimmed) return null;

    const publicBase = (process.env.R2_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '');
    if (publicBase && trimmed.startsWith(publicBase)) {
        return trimmed.slice(publicBase.length).replace(/^\//, '').split('?')[0];
    }

    if (!trimmed.includes('://')) {
        return trimmed.replace(/^\//, '').split('?')[0];
    }

    const uploadsMarkers = ['/uploads/', '/api/uploads/'];
    for (const marker of uploadsMarkers) {
        const idx = trimmed.indexOf(marker);
        if (idx !== -1) {
            return trimmed.slice(idx + marker.length).split('?')[0];
        }
    }

    try {
        const pathname = new URL(trimmed).pathname.replace(/^\//, '');
        return pathname.split('?')[0] || null;
    } catch {
        return null;
    }
}

export function contentTypeFromKey(key: string): string {
    const ext = /\.(\w+)$/.exec(key)?.[1]?.toLowerCase() || 'png';
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'webp':
            return 'image/webp';
        case 'gif':
            return 'image/gif';
        case 'pdf':
            return 'application/pdf';
        default:
            return 'image/png';
    }
}
