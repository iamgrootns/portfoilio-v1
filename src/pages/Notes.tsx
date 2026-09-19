import { profile } from '../data/profile'

export default function Notes() {
  return (
    <article className="notes">
      <p className="kicker">Colophon</p>
      <h1>How this is built</h1>
      <p>
        {profile.name} — {profile.role}. This site is the public face of a FastAPI
        service that used to sit behind investigation casework. The lab on the
        previous pages calls that service directly.
      </p>

      <h2>Stations</h2>
      <ul>
        <li>
          <strong>Listen</strong> — MMS-LID-4017 names the language from the
          always-on cloud endpoint, in seconds.
        </li>
        <li>
          <strong>Fake</strong> — deepfake verdict for images, voice, and
          video. One upload, one answer: real or generated.
        </li>
        <li>
          <strong>Voice</strong> — Resemblyzer 256-D embeddings, cosine similarity,
          same-speaker at 0.60.
        </li>
        <li>
          <strong>Face</strong> — InsightFace buffalo_l against a video. First thirty
          seconds, every tenth frame.
        </li>
        <li>
          <strong>Read</strong> — Tesseract OCR, then regex extractors for Indian
          identity numbers, phones, IFSC, dates.
        </li>
      </ul>

      <h2>What stays offline</h2>
      <p>
        The original visual stack also classified UPI receipts (PhonePe, GPay, Paytm),
        seed-phrase sheets, Aadhaar/PAN cards, maps, and reverse image search. Those
        endpoints still exist on the API for office use. They are not on this site.
      </p>

      <h2>Stack</h2>
      <p>
        FastAPI · PostgreSQL + pgvector · PyTorch · InsightFace · transformers ·
        Tesseract · React. Heavy models load on first use so the API can boot
        without a GPU.
      </p>
      <p>
        Identity lives in <code>frontend/src/data/profile.ts</code>. Put your name
        there.
      </p>
      {profile.email ? (
        <p>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </p>
      ) : (
        <p>Add an email in the profile file when you send this to someone.</p>
      )}
    </article>
  )
}
