import { z } from 'zod';

import { googleDriveShareUrlSchema } from './google-drive';

const requiredText = z.string().trim().min(1, 'This field cannot be empty.');
const slugSchema = requiredText.regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  'Slug must contain only lowercase letters, numbers, and single hyphens.',
);
const displayOrderSchema = z
  .number('Order must be a number.')
  .int('Order must be a whole number.')
  .positive('Order must be greater than zero.');
const monthSchema = requiredText.regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Use YYYY-MM format.');
const websiteUrlSchema = z
  .url('Enter a complete URL, including http:// or https://.')
  .refine(
    (value) => ['http:', 'https:'].includes(new URL(value).protocol),
    'Website URL must use http:// or https://.',
  );

export const localizedTextSchema = z
  .object({
    en: requiredText,
    tr: requiredText,
  })
  .strict();

const optionalUrlSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  },
  websiteUrlSchema.optional(),
);

const projectImageSchema = z
  .object({
    src: requiredText,
    alt: localizedTextSchema,
  })
  .strict();

const contributionMediaSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('image'),
      src: requiredText,
      alt: localizedTextSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal('video'),
      src: requiredText,
      caption: localizedTextSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal('drive'),
      shareUrl: googleDriveShareUrlSchema,
      caption: localizedTextSchema,
    })
    .strict(),
]);

const projectWorkSchema = z
  .object({
    title: localizedTextSchema,
    description: localizedTextSchema,
    media: contributionMediaSchema.optional(),
  })
  .strict();

export const projectSchema = z
  .object({
    slug: slugSchema,
    published: z.boolean().default(false),
    featured: z.boolean().default(false),
    order: displayOrderSchema,
    title: localizedTextSchema,
    summary: localizedTextSchema,
    description: localizedTextSchema,
    role: localizedTextSchema,
    developer: requiredText.optional(),
    publisher: requiredText.optional(),
    releaseYear: z.number().int().min(1970).max(2100).optional(),
    cover: projectImageSchema.optional(),
    technologies: z.array(requiredText).default([]),
    projectWork: projectWorkSchema.optional(),
    contributions: z.array(projectWorkSchema).default([]),
    gallery: z.array(projectImageSchema).default([]),
    links: z
      .object({
        play: optionalUrlSchema,
        store: optionalUrlSchema,
        source: optionalUrlSchema,
        info: optionalUrlSchema,
      })
      .strict()
      .default({}),
  })
  .strict();

export const profileSchema = z
  .object({
    name: requiredText,
    headline: localizedTextSchema,
    bio: localizedTextSchema,
    location: localizedTextSchema.optional(),
    avatar: projectImageSchema.optional(),
    email: z.email(),
    cvUrl: optionalUrlSchema,
  })
  .strict();

export const experienceSchema = z
  .object({
    company: requiredText,
    role: localizedTextSchema,
    summary: localizedTextSchema,
    startDate: monthSchema,
    endDate: z.union([monthSchema, z.literal('present')]),
    order: displayOrderSchema,
  })
  .strict()
  .superRefine((experience, context) => {
    if (experience.endDate !== 'present' && experience.endDate < experience.startDate) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must not be earlier than start date.',
      });
    }
  });

export const skillSchema = z
  .object({
    name: localizedTextSchema,
    category: localizedTextSchema,
    order: displayOrderSchema,
    featured: z.boolean().default(false),
  })
  .strict();

export const siteSettingsSchema = z
  .object({
    siteTitle: localizedTextSchema,
    siteDescription: localizedTextSchema,
    siteUrl: websiteUrlSchema,
    socials: z
      .array(
        z
          .object({
            label: requiredText,
            url: websiteUrlSchema,
          })
          .strict(),
      )
      .default([]),
  })
  .strict();

export type Project = z.infer<typeof projectSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
