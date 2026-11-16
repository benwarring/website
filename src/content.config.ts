/**
 * Content collections. `projects` holds one Markdown file per portfolio
 * project; entry ids come from the file names and are used as URL slugs.
 * `repo` is limited to https so it is safe to render as a link.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
    repo: z.url({ protocol: /^https$/ }).optional(),
    order: z.number(),
  }),
});

export const collections = { projects };
