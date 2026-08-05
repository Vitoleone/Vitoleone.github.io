import { describe, expect, it } from 'vitest';

import { googleDriveShareUrlSchema, toGoogleDrivePreviewUrl } from '../../src/lib/content/google-drive';

describe('Google Drive sharing URLs', () => {
  it.each([
    'https://drive.google.com/file/d/1AbC_def-234/view?usp=sharing',
    'https://drive.google.com/open?id=1AbC_def-234',
    'https://drive.google.com/file/d/1AbC_def-234/preview',
  ])('turns a valid file sharing URL into the canonical preview URL', (shareUrl) => {
    expect(toGoogleDrivePreviewUrl(shareUrl)).toBe(
      'https://drive.google.com/file/d/1AbC_def-234/preview',
    );
    expect(googleDriveShareUrlSchema.parse(shareUrl)).toBe(
      'https://drive.google.com/file/d/1AbC_def-234/preview',
    );
  });

  it.each([
    'https://example.com/file/d/1AbC_def-234/view',
    'https://drive.google.com/drive/folders/1AbC_def-234',
    'https://drive.google.com/file/d//view',
    'not a URL',
  ])('rejects invalid Drive URLs with actionable sharing guidance', (shareUrl) => {
    expect(() => toGoogleDrivePreviewUrl(shareUrl)).toThrow(
      /Google Drive file sharing URL.*Anyone with the link.*Viewer/i,
    );
  });
});
