// Slices an uploaded sheet into page images in the browser, with the same map as the build-time
// slicer (sheet.ts). Nothing is stored: the pages are object URLs that `dispose` revokes.

import { PAGES, panelRect, type Page } from './sheet';

/** The height of the sheet thumbnail's backing canvas (px); the page scales it down. */
const THUMB_PX = 120;

export interface Sheet {
  pages: Record<Page, string>;
  /** The whole sheet, small. */
  thumb: HTMLCanvasElement;
  width: number;
  height: number;
  /** Revokes the pages' object URLs. */
  dispose(): void;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode a page'))), 'image/png'));
}

/** Decodes `file` as an image and cuts it into the eight pages. Rejects if it isn't an image. */
export async function slice(file: File): Promise<Sheet> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const urls: string[] = [];
  try {
    const thumb = document.createElement('canvas');
    thumb.height = THUMB_PX;
    thumb.width = Math.round((THUMB_PX * width) / height);
    thumb.getContext('2d')!.drawImage(bitmap, 0, 0, thumb.width, thumb.height);

    const blobs = await Promise.all(
      PAGES.map((page) => {
        const { left, top, width: w, height: h, flipped } = panelRect(page, width, height);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        if (flipped) ctx.rotate(Math.PI), ctx.translate(-w, -h);
        ctx.drawImage(bitmap, left, top, w, h, 0, 0, w, h);
        return toBlob(canvas);
      }),
    );
    const pages = {} as Record<Page, string>;
    PAGES.forEach((page, i) => urls.push((pages[page] = URL.createObjectURL(blobs[i]))));
    return { pages, thumb, width, height, dispose: () => urls.forEach((u) => URL.revokeObjectURL(u)) };
  } finally {
    bitmap.close();
  }
}
