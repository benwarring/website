/**
 * Home page content: hero and the numbered sections, rendered inside the
 * shared page frame (`SiteShell`). Rendered to static HTML and hydrated,
 * so render must be pure: no randomness, dates or browser globals outside
 * event handlers.
 *
 * Edit the content arrays below to change text without touching markup.
 */

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import WebThreads from './reactbits/WebThreads.jsx';
import {
  BASE,
  EMAIL,
  GITHUB_URL,
  NAME,
  NAV_LINKS,
  PERSONAL_EMAIL,
  RESUME_URL,
  SiteShell,
  TagList,
} from './Site.jsx';

// --text-heading and the --accent, --accent-dark and --accent-light values
// from global.css; WebThreads takes colors as props, not CSS variables.
const INK = '#f2f0f5';
const THREAD_COLORS = ['#7844b8', '#5a3390', '#a987d6'];

// Projects shown as folders on the home page; the rest are on the
// all-projects page behind the "More" folder.
const FEATURED_COUNT = 3;

const EXPERIENCE = [
  {
    role: 'Teaching Assistant (Lab TA / Grader)',
    organisation: 'Bucknell University',
    dates: 'Jan 2026 – Present',
    description:
      'Guided 20+ students in debugging and problem solving across multiple programming languages.',
  },
  {
    role: 'Peer Tutor / Study Group Facilitator / Mentor',
    organisation: 'Bucknell Teaching and Learning Center',
    dates: 'Aug 2024 – Present',
    description:
      'Helped 60+ students improve their grades in Calculus 2 through explanation and collaborative learning. Mentored 2 students developing their own tutoring and facilitation skills.',
  },
  {
    role: 'Front End Cashier / Self-Check',
    organisation: 'Wegmans',
    place: 'Dickson City, PA',
    dates: 'May 2021 – Present',
    description:
      'Customer service in a high-volume retail environment, balancing speed and accuracy across hundreds of transactions per shift.',
  },
];

const SKILL_GROUPS = [
  {
    name: 'Languages',
    items: [
      'C', 'Python', 'Java', 'RISC-V', 'Bash', 'R', 'SQL', 'LaTeX', 'Prolog',
      'JavaScript', 'CSS/SASS',
    ],
  },
  {
    name: 'Tools and practices',
    items: [
      'Git', 'Linux', 'AWS', 'Agile/Scrum', 'VSCode', 'JetBrains', 'Emacs',
      'Claude Code', 'Codex', 'JavaFX', 'ggplot', 'React', 'Figma',
    ],
  },
];

const EDUCATION = {
  school: 'Bucknell University',
  degree: 'B.S. Computer Science, Minor in Applied Mathematics',
  place: 'Lewisburg, PA',
  dates: 'Aug 2023 – May 2027',
  gpa: 'GPA 3.50',
};

const COURSEWORK = [
  'Data Structures and Algorithms',
  'Algorithmic Design and Analysis',
  'Operating Systems',
  'Networks and Security',
  'Software Engineering and Design',
  'Computer Systems',
  'Programming Language Design',
  'AWS Academy (ML Foundations, ML for NLP)',
];

// When the sheet-to-paper morph starts after a folder opens. The folder
// transitions in global.css run 0.35s, but their ease-out puts the
// sheet ~90% up by the halfway point; waiting for the full 0.35s reads
// as a pause at the top.
const FOLDER_OPEN_MS = 180;

/**
 * Folder drawing: back panel with a tab, a sheet of paper, and a front
 * flap. Purely decorative; CSS tilts the flap open and raises the sheet
 * when the parent `.folder` has aria-expanded="true".
 *
 * @param {{ flying?: boolean, out?: boolean }} props `flying` gives the
 *   sheet the shared view-transition name, so it morphs to or from the
 *   big paper; `out` hides the sheet while it is shown as the paper.
 * @returns {import('react').JSX.Element}
 */
function FolderIcon({ flying = false, out = false }) {
  return (
    <span className="folder-icon" aria-hidden="true">
      <span
        className="folder-sheet"
        data-flying={flying ? '' : undefined}
        data-out={out ? '' : undefined}
      ></span>
      <span className="folder-front"></span>
    </span>
  );
}

/**
 * A home page section: numbered heading in a left rail, content beside it.
 * The number is the section's position in `NAV_LINKS`.
 *
 * @param {{ id: string, title: string, children: import('react').ReactNode }} props
 *   `id` is the anchor target used by the nav; `title` is the h2 text.
 * @returns {import('react').JSX.Element}
 */
function Section({ id, title, children }) {
  const headingId = `${id}-heading`;
  const index = NAV_LINKS.findIndex((link) => link.id === id) + 1;
  return (
    <section id={id} className="section container" aria-labelledby={headingId}>
      <div className="section-head">
        <span className="section-index" aria-hidden="true">
          {String(index).padStart(2, '0')}
        </span>
        <h2 id={headingId}>{title}</h2>
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

/**
 * The full home page, inside the shared page frame.
 *
 * @param {{ projects: { id: string, title: string, summary: string, tags: string[] }[] }} props
 *   `projects` is the full list, already sorted for display; `id` is the
 *   detail page slug. All of it goes to the sidebar menu; the first
 *   FEATURED_COUNT are shown as folders.
 * @returns {import('react').JSX.Element}
 */
export default function Home({ projects }) {
  // Open folder (flap down, sheet pulled up), or null. All start closed.
  const [openId, setOpenId] = useState(null);
  // Project whose paper is shown below the folders, or null.
  const [shownId, setShownId] = useState(null);
  // Folder whose sheet is morphing to or from the paper right now.
  const [flyingId, setFlyingId] = useState(null);
  const openTimer = useRef(0);
  // Bumped by every folder click and on unmount. Morph callbacks remember
  // the value they started with and do nothing once it has moved on, so a
  // slow morph from an earlier click can't undo a newer one.
  const generation = useRef(0);
  const featured = projects.slice(0, FEATURED_COUNT);

  useEffect(
    () => () => {
      clearTimeout(openTimer.current);
      generation.current += 1;
    },
    [],
  );

  /**
   * Morphs between a folder's sheet and the paper with a view transition:
   * both carry the name "paper" on either side of `update`, so the browser
   * animates one box into the other. If a newer click (or unmount) comes
   * first, the pending update and clean-up are skipped.
   *
   * @param {() => void} update State change to animate.
   * @param {string | null} flying Folder whose sheet takes part, or null
   *   when the morph is paper to paper (two "paper" names would cancel it).
   * @returns {Promise<boolean>} Resolves when the morph has finished (never
   *   rejects): true if no newer click came first, so the caller may carry
   *   on, false if it was superseded.
   */
  function morph(update, flying) {
    const started = generation.current;
    const current = () => generation.current === started;
    // Committed before startViewTransition snapshots the old state.
    flushSync(() => setFlyingId(flying));
    return document
      .startViewTransition(() => {
        if (current()) flushSync(update);
      })
      .finished.catch(() => {
        // The animation is cosmetic; if it fails, still apply the end state
        // so the folders never stick halfway (e.g. open with no paper).
        if (current()) update();
      })
      .then(() => {
        if (current()) setFlyingId(null);
        return current();
      });
  }

  /**
   * Handles a project folder click. Opening runs in two steps so the paper
   * never passes over the flap: the folder opens (flap tips forward, sheet
   * rises clear of it), then the raised sheet morphs into the paper.
   * Closing reverses that. Without view transitions, or with reduced
   * motion, folder and paper just switch.
   *
   * @param {string} id The clicked project's id.
   */
  function toggleFolder(id) {
    clearTimeout(openTimer.current);
    generation.current += 1;
    if (
      !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const next = openId === id ? null : id;
      setOpenId(next);
      setShownId(next);
    } else if (shownId === id) {
      // Close: paper back into the raised sheet, then shut the folder.
      morph(() => setShownId(null), id).then((current) => {
        if (current) setOpenId(null);
      });
    } else if (shownId !== null) {
      // Switch: the shown paper morphs into the other project's paper.
      morph(() => {
        setOpenId(id);
        setShownId(id);
      }, null);
    } else if (openId === id) {
      // Clicked again while still opening: just shut it.
      setOpenId(null);
    } else {
      setOpenId(id);
      openTimer.current = setTimeout(() => morph(() => setShownId(id), id), FOLDER_OPEN_MS);
    }
  }

  return (
    <SiteShell projects={projects}>
      <div className="hero" id="top">
        <div className="hero-bg" aria-hidden="true">
          {/* Pinch sits right of centre so the threads converge beside the name, not on it.
              Paused with no pointer effects: after the intro the component stops
              rendering, because the full-screen shader lagged even at dpr 1. */}
          <WebThreads
            colors={THREAD_COLORS}
            coreColor={INK}
            threadCount={5}
            dpr={1}
            grain={0}
            paused
            mouseInteraction={false}
            pulseOnClick={false}
            pinch={0.72}
            fade={0.3}
          />
        </div>
        <div className="container hero-inner">
          <p className="eyebrow">B.S. Computer Science · Class of 2027</p>
          <h1 className="hero-name">{NAME}</h1>
          <p className="hero-tagline">Computer Science student at Bucknell University</p>
          <div className="button-row">
            <a className="button" href={RESUME_URL} download>Resume (PDF)</a>
            <a className="button" href={GITHUB_URL}>GitHub</a>
            <a className="button" href={`mailto:${EMAIL}`}>Email</a>
          </div>
        </div>
      </div>

      <Section id="projects" title="Projects">
        {/* One folder per featured project (a disclosure button for its
            paper below; one open at a time), then a "More" folder that
            links to the all-projects page. */}
        <ul className="folders">
          {featured.map((project) => {
            const open = project.id === openId;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  className="folder"
                  aria-expanded={open}
                  aria-controls={`paper-${project.id}`}
                  onClick={() => toggleFolder(project.id)}
                >
                  <FolderIcon
                    flying={flyingId === project.id && shownId !== project.id}
                    out={shownId === project.id}
                  />
                  <span className="folder-label">{project.title}</span>
                </button>
              </li>
            );
          })}
          <li>
            <a className="folder" href={`${BASE}projects/`}>
              <FolderIcon />
              <span className="folder-label">More</span>
            </a>
          </li>
        </ul>
        {/* Every featured paper is in the HTML (so all summaries are
            indexable); only the open folder's paper is shown. */}
        {featured.map((project, position) => (
          <article
            key={project.id}
            id={`paper-${project.id}`}
            className="paper"
            hidden={project.id !== shownId}
          >
            <p className="label">{position === 0 ? 'Featured project' : 'Project'}</p>
            <h3>{project.title}</h3>
            <p>{project.summary}</p>
            <TagList items={project.tags} label="Technologies" />
            <a href={`${BASE}projects/${project.id}/`}>Read more about {project.title}</a>
          </article>
        ))}
      </Section>

      <Section id="experience" title="Experience & Teaching">
        <ol className="timeline">
          {EXPERIENCE.map((job) => (
            <li key={job.role} className="timeline-item">
              <p className="timeline-meta">
                {job.dates}
                {job.place ? <><br />{job.place}</> : null}
              </p>
              <div className="timeline-body">
                <h3>{job.role}</h3>
                <p className="muted">{job.organisation}</p>
                <p>{job.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="skills" title="Skills">
        <div className="split">
          {SKILL_GROUPS.map((group) => (
            <div key={group.name}>
              <h3 className="label">{group.name}</h3>
              <TagList items={group.items} />
            </div>
          ))}
        </div>
      </Section>

      <Section id="education" title="Education & Coursework">
        <div className="split">
          <div>
            <h3 className="label">Degree</h3>
            <p className="lead">{EDUCATION.school}</p>
            <p>{EDUCATION.degree}. {EDUCATION.gpa}.</p>
            <p className="timeline-meta">
              {EDUCATION.dates} · {EDUCATION.place}
            </p>
          </div>
          <div>
            <h3 className="label">Key coursework</h3>
            <ul className="plain-list">
              {COURSEWORK.map((course) => (
                <li key={course}>{course}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section id="contact" title="Contact">
        <p className="lead">Email is the best way to get in touch.</p>
        <ul className="contact-list">
          <li>
            <span className="label">Bucknell</span>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </li>
          <li>
            <span className="label">Personal</span>
            <a href={`mailto:${PERSONAL_EMAIL}`}>{PERSONAL_EMAIL}</a>
          </li>
        </ul>
        <p className="muted">
          I check my Bucknell email more often, but less during the summer.
        </p>
      </Section>
    </SiteShell>
  );
}
