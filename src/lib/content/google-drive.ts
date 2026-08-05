import { z } from 'zod';

export const GOOGLE_DRIVE_SHARING_GUIDANCE =
  'Use a Google Drive file sharing URL and set General access to "Anyone with the link" with the "Viewer" role.';

const driveFileIdPattern = /^[A-Za-z0-9_-]+$/;

function readDriveFileId(url: URL): string | undefined {
  if (url.protocol !== 'https:' || url.hostname !== 'drive.google.com') {
    return undefined;
  }

  const pathMatch = url.pathname.match(/^\/file\/d\/([^/]+)\/(?:view|preview)\/?$/);
  const candidate = pathMatch?.[1] ?? (url.pathname === '/open' ? url.searchParams.get('id') : undefined);

  return candidate && driveFileIdPattern.test(candidate) ? candidate : undefined;
}

export function toGoogleDrivePreviewUrl(shareUrl: string): string {
  let url: URL;

  try {
    url = new URL(shareUrl);
  } catch {
    throw new Error(`Invalid Google Drive URL. ${GOOGLE_DRIVE_SHARING_GUIDANCE}`);
  }

  const fileId = readDriveFileId(url);
  if (!fileId) {
    throw new Error(`Invalid Google Drive file sharing URL. ${GOOGLE_DRIVE_SHARING_GUIDANCE}`);
  }

  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export const googleDriveShareUrlSchema = z.string().transform((value, context) => {
  try {
    return toGoogleDrivePreviewUrl(value.trim());
  } catch (error) {
    context.addIssue({
      code: 'custom',
      message: error instanceof Error ? error.message : GOOGLE_DRIVE_SHARING_GUIDANCE,
    });
    return z.NEVER;
  }
});
