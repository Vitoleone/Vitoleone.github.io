import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import type { Loader } from 'astro/loaders';

import { createUniqueSlugIdGenerator } from './lib/content/helpers';
import {
  experienceSchema,
  profileSchema,
  projectSchema,
  siteSettingsSchema,
  skillSchema,
} from './lib/content/schemas';

const yamlPattern = '**/*.{yml,yaml}';

const uniqueProjectLoader: Loader = {
  name: 'unique-project-glob-loader',
  async load(context) {
    const loader = glob({
      base: './src/content/projects',
      pattern: yamlPattern,
      // Astro's glob loader logs duplicate IDs as warnings. This generator
      // raises an error instead, so a duplicated public slug stops the build.
      generateId: createUniqueSlugIdGenerator(),
    });
    await loader.load(context);
  },
};

const projects = defineCollection({
  loader: uniqueProjectLoader,
  schema: projectSchema,
});

const profile = defineCollection({
  loader: glob({ base: './src/content/profile', pattern: yamlPattern }),
  schema: profileSchema,
});

const experience = defineCollection({
  loader: glob({ base: './src/content/experience', pattern: yamlPattern }),
  schema: experienceSchema,
});

const skills = defineCollection({
  loader: glob({ base: './src/content/skills', pattern: yamlPattern }),
  schema: skillSchema,
});

const siteSettings = defineCollection({
  loader: glob({ base: './src/content/site-settings', pattern: yamlPattern }),
  schema: siteSettingsSchema,
});

export const collections = { projects, profile, experience, skills, siteSettings };
