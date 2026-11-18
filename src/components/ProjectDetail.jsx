/**
 * Project detail page: the content of one project's page at
 * `/projects/<id>/`, inside the shared SiteShell frame.
 * Rendered to static HTML and hydrated, so render must be pure: no state,
 * effects, randomness, dates or browser globals.
 */

import { SiteShell, TagList, BASE } from './Site.jsx';

const ALL_PROJECTS_URL = `${BASE}projects/`;

/**
 * One project's page: header (title, summary, tags, links) and the
 * rendered Markdown body.
 *
 * @param {{
 *   project: { id: string, title: string, summary: string, tags: string[], repo?: string },
 *   projects: { id: string, title: string }[],
 *   children: import('react').ReactNode,
 * }} props
 *   `project` is the project shown; `repo` is an https URL and its link is
 *   rendered only when present. `tags` must be unique (TagList keys on them);
 *   `projects` is the full sorted project list for the sidebar menu;
 *   `children` is the project's rendered Markdown body.
 * @returns {import('react').JSX.Element}
 */
export default function ProjectDetail({ project, projects, children }) {
  const { id, title, summary, tags, repo } = project;

  return (
    <SiteShell projects={projects} active={`project:${id}`}>
      <header className="page-header container">
        <p className="eyebrow">Project</p>
        <h1>{title}</h1>
        <p className="lead">{summary}</p>
        <TagList items={tags} label="Technologies" />
        <p className="page-links">
          {repo && <a href={repo}>View on GitHub</a>}
          <a href={ALL_PROJECTS_URL}>All projects</a>
        </p>
      </header>

      <div className="page-body container">
        <div className="prose">{children}</div>
        <a className="back-link" href={ALL_PROJECTS_URL}>Back to all projects</a>
      </div>
    </SiteShell>
  );
}
