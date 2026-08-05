import { z } from 'zod';

const positiveOrderSchema = z.number().int().positive();
const optionalLocalizedTextSchema = z.object({
  en: z.string().trim().min(1),
  tr: z.string().trim().min(1),
}).strict().optional();

export const blockVariantSchema = z.enum(['standard', 'muted', 'accent']);
export const blockSpacingSchema = z.enum(['compact', 'standard', 'spacious']);
export const homeBlockIdSchema = z.enum([
  'hero',
  'featured-projects',
  'projects',
  'skills',
  'experience',
  'about',
  'contact',
]);
export const projectBlockIdSchema = z.enum([
  'overview',
  'mechanics',
  'media',
  'technologies',
  'details',
  'links',
  'gallery',
]);

export const HOME_BLOCK_IDS = homeBlockIdSchema.options;
export const PROJECT_BLOCK_IDS = projectBlockIdSchema.options;

const baseBlockSchema = z.object({
  enabled: z.boolean().default(true),
  order: positiveOrderSchema,
  variant: blockVariantSchema.default('standard'),
  spacing: blockSpacingSchema.default('standard'),
  eyebrow: optionalLocalizedTextSchema,
  title: optionalLocalizedTextSchema,
  description: optionalLocalizedTextSchema,
}).strict();

export const homeBlockSchema = baseBlockSchema.extend({ id: homeBlockIdSchema }).strict();
export const projectBlockSchema = baseBlockSchema.extend({ id: projectBlockIdSchema }).strict();

function hasUniqueBlockIds(blocks: readonly { id: string }[]) {
  return new Set(blocks.map((block) => block.id)).size === blocks.length;
}

export const homeLayoutSchema = z.object({
  kind: z.literal('home'),
  blocks: z.array(homeBlockSchema).superRefine((blocks, context) => {
    if (!hasUniqueBlockIds(blocks)) {
      context.addIssue({ code: 'custom', message: 'Each home block id must be unique.' });
    }
  }),
}).strict();

export const projectLayoutSchema = z.object({
  kind: z.literal('project'),
  blocks: z.array(projectBlockSchema).superRefine((blocks, context) => {
    if (!hasUniqueBlockIds(blocks)) {
      context.addIssue({ code: 'custom', message: 'Each project block id must be unique.' });
    }
  }),
}).strict();

export const layoutDocumentSchema = z.discriminatedUnion('kind', [homeLayoutSchema, projectLayoutSchema]);

export type HomeBlock = z.infer<typeof homeBlockSchema>;
export type ProjectBlock = z.infer<typeof projectBlockSchema>;
export type LayoutDocument = z.infer<typeof layoutDocumentSchema>;

const homeBlockDefaults: readonly HomeBlock[] = [
  { id: 'hero', enabled: true, order: 1, variant: 'standard', spacing: 'spacious' },
  { id: 'featured-projects', enabled: true, order: 2, variant: 'standard', spacing: 'standard' },
  { id: 'projects', enabled: true, order: 3, variant: 'standard', spacing: 'standard' },
  { id: 'skills', enabled: true, order: 4, variant: 'muted', spacing: 'standard' },
  { id: 'experience', enabled: true, order: 5, variant: 'standard', spacing: 'standard' },
  { id: 'about', enabled: true, order: 6, variant: 'muted', spacing: 'standard' },
  { id: 'contact', enabled: true, order: 7, variant: 'standard', spacing: 'spacious' },
];

const projectBlockDefaults: readonly ProjectBlock[] = [
  { id: 'overview', enabled: true, order: 1, variant: 'standard', spacing: 'standard' },
  { id: 'mechanics', enabled: true, order: 2, variant: 'standard', spacing: 'standard' },
  { id: 'media', enabled: false, order: 3, variant: 'standard', spacing: 'standard' },
  { id: 'technologies', enabled: true, order: 4, variant: 'standard', spacing: 'standard' },
  { id: 'details', enabled: true, order: 5, variant: 'standard', spacing: 'standard' },
  { id: 'links', enabled: true, order: 6, variant: 'standard', spacing: 'standard' },
  { id: 'gallery', enabled: true, order: 7, variant: 'standard', spacing: 'standard' },
];

export function normalizeBlocks(blocks: readonly HomeBlock[], kind: 'home'): HomeBlock[];
export function normalizeBlocks(blocks: readonly ProjectBlock[], kind: 'project'): ProjectBlock[];
export function normalizeBlocks(
  blocks: readonly (HomeBlock | ProjectBlock)[],
  kind: 'home' | 'project',
): (HomeBlock | ProjectBlock)[] {
  const defaults = kind === 'home' ? homeBlockDefaults : projectBlockDefaults;
  const provided = new Map(blocks.map((block) => [block.id, block]));

  return defaults
    .map((fallback) => provided.get(fallback.id) ?? { ...fallback, enabled: false })
    .toSorted((left, right) => left.order - right.order);
}
