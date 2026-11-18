/**
 * Shared loading for the `projects` collection, so every route sorts the
 * projects and shapes their props the same way.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

/** Plain, serializable project data passed to hydrated components. */
export type ProjectProps = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  /** https URL of the source repository; undefined when the project has none. */
  repo?: string;
};

/**
 * Loads every project entry, sorted by `data.order` ascending.
 *
 * @returns The project entries, lowest `order` first.
 * @throws Whatever `getCollection` throws if the collection fails to load.
 */
export async function getSortedProjects(): Promise<CollectionEntry<'projects'>[]> {
  // getCollection returns a new array, so sorting it in place is safe.
  return (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
}

/**
 * Picks the fields hydrated components need from a project entry.
 *
 * @param entry - A `projects` collection entry.
 * @returns `{ id, title, summary, tags, repo }`; `repo` is undefined when absent.
 */
export function toProjectProps(entry: CollectionEntry<'projects'>): ProjectProps {
  const { title, summary, tags, repo } = entry.data;
  return { id: entry.id, title, summary, tags, repo };
}
