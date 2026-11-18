/**
 * Shared page frame and small shared pieces for every page (home, all
 * projects, project detail): site constants, the home page section list,
 * `TagList` and `SiteShell` (top nav, sidebar, main and footer).
 * Rendered to static HTML and hydrated, so render must be pure: no
 * randomness, dates or browser globals outside event handlers.
 */

import {
  Briefcase01Icon,
  Folder01Icon,
  FolderLibraryIcon,
  Mail01Icon,
  Mortarboard01Icon,
  SourceCodeIcon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import BranchedMenu from './reactbits/BranchedMenu.jsx';

export const BASE = import.meta.env.BASE_URL;
export const NAME = 'Benjamin Warring';
export const EMAIL = 'brw009@bucknell.edu';
export const PERSONAL_EMAIL = 'brw@warring.us';
export const GITHUB_URL = 'https://github.com/benwarring';
export const RESUME_URL = `${BASE}resume.pdf`;

/** Home page sections in page order; Home.jsx numbers its sections from this. */
export const NAV_LINKS = [
  { id: 'projects', label: 'Projects', icon: SourceCodeIcon },
  { id: 'experience', label: 'Experience', icon: Briefcase01Icon },
  { id: 'skills', label: 'Skills', icon: Wrench01Icon },
  { id: 'education', label: 'Education', icon: Mortarboard01Icon },
  { id: 'contact', label: 'Contact', icon: Mail01Icon },
];

// Same values as --accent, --text-heading and --line in global.css; the
// React Bits components take colors as props, not CSS variables.
const ACCENT = '#7844b8';
const INK = '#f2f0f5';
const LINE = '#2b2b38';
const MENU_WIDTH = 176;

// Sidebar menu values, for SiteShell's `active` prop: a section's id
// (e.g. 'projects'), ALL_PROJECTS_VALUE, or PROJECT_PREFIX + project id.
const ALL_PROJECTS_VALUE = 'all-projects';
const PROJECT_PREFIX = 'project:';

/**
 * A wrapping row of tag labels (`ul.tags` of `li.tag`). Shared by every
 * page that shows tags, so don't duplicate the markup.
 *
 * @param {{ items: string[], label?: string }} props
 *   `items` are the tag texts, also used as keys, so they must be unique;
 *   `label` is the list's `aria-label`, omitted from the HTML when not given.
 * @returns {import('react').JSX.Element}
 */
export function TagList({ items, label }) {
  return (
    <ul className="tags" aria-label={label}>
      {items.map((item) => (
        <li key={item} className="tag">{item}</li>
      ))}
    </ul>
  );
}

/**
 * Builds the sidebar menu groups. Each entry carries the `href` it opens.
 *
 * @param {{ id: string, title: string }[]} projects Sorted project list.
 * @returns {{ label: string, children: { value: string, label: string, icon: object, href: string }[] }[]}
 */
function buildMenuItems(projects) {
  return [
    {
      label: 'Home',
      children: NAV_LINKS.map(({ id, label, icon }) => ({
        value: id,
        label,
        icon,
        href: `${BASE}#${id}`,
      })),
    },
    {
      label: 'Projects',
      children: [
        {
          value: ALL_PROJECTS_VALUE,
          label: 'All projects',
          icon: FolderLibraryIcon,
          href: `${BASE}projects/`,
        },
        ...projects.map((project) => ({
          value: `${PROJECT_PREFIX}${project.id}`,
          label: project.title,
          icon: Folder01Icon,
          href: `${BASE}projects/${project.id}/`,
        })),
      ],
    },
  ];
}

/**
 * Opens a picked sidebar entry. Section hrefs are `${BASE}#<id>`, which
 * scrolls in place on the home page and goes home from other pages.
 *
 * @param {string} _value The picked menu value (unused; the entry has its href).
 * @param {{ href: string }} item The picked menu entry.
 */
function openMenuItem(_value, item) {
  window.location.assign(item.href);
}

/**
 * The page frame: top nav (narrow screens), sidebar (brand, menu, links),
 * `<main id="main">` holding the page content, and the footer.
 *
 * @param {{
 *   projects: { id: string, title: string }[],
 *   active?: string,
 *   children: import('react').ReactNode,
 * }} props
 *   `projects` is the full sorted project list for the sidebar menu;
 *   `active` is the menu value to highlight: a section id, 'all-projects',
 *   or 'project:<id>'. When omitted, BranchedMenu highlights its first
 *   entry (the first home section);
 *   `children` is the page content rendered inside `<main>`.
 * @returns {import('react').JSX.Element}
 */
export function SiteShell({ projects, active, children }) {
  return (
    <>
      {/* Top nav: shown on narrow screens, where the sidebar is hidden. */}
      <header>
        <nav className="site-nav" aria-label="Sections">
          <div className="container site-nav-inner">
            <a className="brand" href={BASE}>{NAME}</a>
            <ul>
              {NAV_LINKS.map(({ id, label }) => (
                <li key={id}>
                  <a href={`${BASE}#${id}`}>{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      <div className="page">
        <aside className="sidebar">
          <a className="brand" href={BASE}>{NAME}</a>
          <BranchedMenu
            items={buildMenuItems(projects)}
            defaultOpen={[0, 1]}
            defaultActive={active}
            onSelect={openMenuItem}
            color={INK}
            accentColor={ACCENT}
            lineColor={LINE}
            width={MENU_WIDTH}
          />
          <ul className="sidebar-links">
            <li><a href={GITHUB_URL}>GitHub</a></li>
            <li><a href={`mailto:${EMAIL}`}>Email</a></li>
            <li><a href={RESUME_URL} download>Resume (PDF)</a></li>
          </ul>
        </aside>

        <div className="page-main">
          <main id="main">{children}</main>

          <footer className="site-footer">
            <div className="container site-footer-inner">
              <span>{NAME}</span>
              {/* #main, not the hero's #top: #top only exists on the home page. */}
              <a href="#main">Back to top</a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
