/**
 * All-projects page content (`/projects/`): a page header and a
 * grid of project papers inside the shared site frame. Rendered to static
 * HTML and hydrated, so render must be pure: no randomness, dates or
 * browser globals.
 */

import { BASE, SiteShell, TagList } from './Site.jsx';

/**
 * The all-projects page: header, then one paper per project with its
 * summary, tags, a link to its detail page and, when it has one, its repo.
 *
 * @param {{
 *   projects: { id: string, title: string, summary: string, tags: string[], repo?: string }[],
 * }} props
 *   `projects` is the full, already sorted project list; `id` is the URL
 *   slug and `repo`, when present, is an https URL.
 * @returns {import('react').JSX.Element}
 */
export default function ProjectsIndex({ projects }) {
  return (
    <SiteShell projects={projects} active="all-projects">
      <header className="page-header container">
        <p className="eyebrow">Portfolio</p>
        <h1>Projects</h1>
        <p className="lead">Projects I have built or contributed to.</p>
      </header>

      <div className="page-body container">
        {/* h2 keeps the heading levels in order between the h1 and each paper's h3. */}
        <h2 className="label">All projects</h2>
        <ul className="paper-list" aria-label="Projects">
          {projects.map(({ id, title, summary, tags, repo }) => (
            <li key={id}>
              <article className="paper">
                <p className="label">Project</p>
                <h3>{title}</h3>
                <p>{summary}</p>
                <TagList items={tags} label="Technologies" />
                <p className="paper-links">
                  <a href={`${BASE}projects/${id}/`}>Read more about {title}</a>
                  {repo && <a href={repo}>View {title} on GitHub</a>}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </SiteShell>
  );
}
