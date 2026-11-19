const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Turn the chosen file into a small square JPEG (centre-cropped, at most `size` px)
 * so uploads stay fast and always fit the round avatar.
 */
export const prepareProfileImage = async (file, size = 512) => {
    if (!ALLOWED.includes(file.type)) {
        throw new Error('Please choose a JPEG, PNG or WebP image.');
    }
    if (file.size > 15 * 1024 * 1024) {
        throw new Error('That image is too large. Please choose one under 15 MB.');
    }

    let bitmap;
    try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
        throw new Error('That file could not be read as an image.');
    }

    const side = Math.min(bitmap.width, bitmap.height);
    const out = Math.min(side, size);
    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, out, out);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new Error('Could not process that image.');
    return blob;
};
