/**
 * Home page: the whole visible single-page portfolio (nav, hero and six
 * sections). Rendered to static HTML and hydrated, so render must be pure:
 * no state, effects, randomness, dates or browser globals.
 *
 * Edit the content arrays below to change text without touching markup.
 */

const BASE = import.meta.env.BASE_URL;
const EMAIL = 'brw009@bucknell.edu';
const GITHUB_URL = 'https://github.com/benwarring';
const RESUME_URL = `${BASE}resume.pdf`;

const NAV_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
];

const ABOUT =
  'I am a Computer Science student at Bucknell University, working toward a ' +
  'B.S. with a minor in Applied Mathematics, expected May 2027. My projects ' +
  'include a terminal text editor in C with its own LSP client, an LLM-based ' +
  'pipeline that extracts structured data from documents and generates ' +
  'reports, and an AI documentation generator for Python codebases. At ' +
  'Bucknell I work as a lab teaching assistant and grader, and as a peer ' +
  'tutor and study group facilitator for Calculus 2.';

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

/**
 * A home page section labelled by its own h2.
 *
 * @param {{ id: string, title: string, children: import('react').ReactNode }} props
 *   `id` is the anchor target used by the nav; `title` is the h2 text.
 * @returns {import('react').JSX.Element}
 */
function Section({ id, title, children }) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} className="section container" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      {children}
    </section>
  );
}

/**
 * A wrapping row of tag labels (`ul.tags` of `li.tag`). Shared with
 * `ProjectDetail.jsx`, which imports it from here, so don't duplicate it.
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
 * The full home page.
 *
 * @param {{ projects: { id: string, title: string, summary: string, tags: string[] }[] }} props
 *   `projects` is already sorted for display; `id` is the detail page slug.
 * @returns {import('react').JSX.Element}
 */
export default function Home({ projects }) {
  return (
    <>
      <header>
        <nav className="site-nav" aria-label="Sections">
          <ul>
            {NAV_LINKS.map(({ id, label }) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main">
        <div className="container hero">
          {/* Cursor sits inside the h1 so it renders on the name's line; aria-hidden keeps the heading text clean. */}
          <h1 className="hero-name">
            Benjamin Warring<span className="cursor" aria-hidden="true"></span>
          </h1>
          <p>Computer Science student at Bucknell University</p>
          <div className="button-row">
            <a className="button" href={GITHUB_URL}>GitHub</a>
            <a className="button" href={`mailto:${EMAIL}`}>Email</a>
            <a className="button" href={RESUME_URL} download>Resume (PDF)</a>
          </div>
        </div>

        <Section id="about" title="About">
          <p>{ABOUT}</p>
        </Section>

        <Section id="projects" title="Projects">
          <ul className="card-list">
            {projects.map((project) => (
              <li key={project.id} className="card">
                <h3>
                  <a href={`${BASE}projects/${project.id}/`}>{project.title}</a>
                </h3>
                <p>{project.summary}</p>
                <TagList items={project.tags} label="Technologies" />
              </li>
            ))}
          </ul>
        </Section>

        <Section id="experience" title="Experience & Teaching">
          <ol className="timeline">
            {EXPERIENCE.map((job) => (
              <li key={job.role} className="timeline-item">
                <h3>{job.role}</h3>
                <p>{job.organisation}</p>
                <p className="timeline-meta">
                  {[job.dates, job.place].filter(Boolean).join(' · ')}
                </p>
                <p>{job.description}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="skills" title="Skills">
          {SKILL_GROUPS.map((group) => (
            <div key={group.name}>
              <h3>{group.name}</h3>
              <TagList items={group.items} />
            </div>
          ))}
        </Section>

        <Section id="education" title="Education & Coursework">
          <h3>{EDUCATION.school}</h3>
          <p>{EDUCATION.degree}. {EDUCATION.gpa}.</p>
          <p className="timeline-meta">
            {EDUCATION.dates} · {EDUCATION.place}
          </p>
          <h3>Key coursework</h3>
          <ul>
            {COURSEWORK.map((course) => (
              <li key={course}>{course}</li>
            ))}
          </ul>
        </Section>

        <Section id="contact" title="Contact">
          <dl>
            <dt>Email</dt>
            <dd><a href={`mailto:${EMAIL}`}>{EMAIL}</a></dd>
            <dt>GitHub</dt>
            <dd><a href={GITHUB_URL}>github.com/benwarring</a></dd>
          </dl>
        </Section>
      </main>
    </>
  );
}
