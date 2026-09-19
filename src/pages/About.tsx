import { about, profile } from '../data/profile'

export default function About() {
  return (
    <article className="about">
      <p className="kicker">
        <span>PKP</span>
        About
      </p>
      <h1>{profile.fullName}</h1>
      <p className="about-role">
        {profile.role} · {profile.location}
      </p>
      <p className="about-summary">{about.summary}</p>

      <div className="about-links">
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <a href={profile.github} target="_blank" rel="noreferrer">
          github.com/iamgrootns
        </a>
        <span>{profile.phone}</span>
      </div>

      <h2>Selected work</h2>
      {about.experience.map((job) => (
        <section className="about-job" key={job.title}>
          <header>
            <h3>{job.title}</h3>
            <p>
              {job.org} · {job.when}
            </p>
          </header>
          <ul>
            {job.points.map((pt) => (
              <li key={pt}>{pt}</li>
            ))}
          </ul>
        </section>
      ))}

      <h2>Projects</h2>
      <div className="about-grid">
        {about.projects.map((p) => (
          <figure key={p.name}>
            <p className="kicker">{p.tag}</p>
            <h3>{p.name}</h3>
            <p className="about-stack">{p.stack}</p>
            <p>{p.blurb}</p>
          </figure>
        ))}
      </div>

      <h2>Stack</h2>
      <p className="about-skills">
        {about.skills.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </p>

      <h2>Education</h2>
      <ul className="about-edu">
        {about.education.map((e) => (
          <li key={e.name}>
            <strong>{e.name}</strong>
            <span>
              {e.org} · {e.when}
            </span>
          </li>
        ))}
      </ul>

      {about.certs.length ? (
        <p className="about-certs">{about.certs.join(' · ')}</p>
      ) : null}
    </article>
  )
}
