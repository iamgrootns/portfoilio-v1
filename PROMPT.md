# PKP Lab — MotionSites prompt (custom)

Adapted from **Dark Portfolio Hero** (simple, clean, dark) + **Viktor Portfolio** (cinematic project rows) + **Neuralyn / Synapse** motion craft. Built for an AI/ML engineer, not a SaaS signup page.

Reuse assets from `motionsites.ai-main/assets/videos/`:
- Hero: `Dark_Portfolio_Hero_0.mp4`
- Listen: `Synapse_Dark_Hero_0.mp4`
- Voice: `Viktor_Portfolio_0.mp4`
- Face: `Viktor_Portfolio_1.mp4`
- Look: `Transform_Data_0.mp4`
- Read: `xPortfolio_Hero_0.mp4`

```text
Build a dark, cinematic personal lab for an ML engineer named PKP.
React + Vite + TypeScript + Framer Motion. No Tailwind purple. No gradient text.

Theme
--bg #0a0a0a, --surface #141414, --text #f5f5f5, --muted #888, --stroke #1f1f1f
Accent ONLY as a thin blue line: linear-gradient(90deg, #89AACC, #4E85BF)
Fonts: Instrument Serif italic for display, Inter for UI, IBM Plex Mono for meta.

Loader (2.7s)
Full-screen black. Top-left "FIELD NOTES" tracking 0.3em.
Center: Listen → Look → Read rotating italic serif.
Bottom-right: 000–100 counter in huge serif.
3px bottom bar filled with the blue gradient + soft glow.

Hero
Fullscreen looping Dark Portfolio Hero video, 28% black veil, bottom fade to #0a0a0a.
Floating pill navbar: circular PKP monogram with gradient ring, station links, engine live/off.
Eyebrow COLLECTION '26. Name PKP in ~9vw italic serif.
Role line: A [Engineer|Builder|Researcher] building machines that hear and see.
Two pill CTAs: Open the lab, How it is built.
SCROLL cue with a sliding dot.

Work index
Five full-width rows (01–05): Listen, Voice, Face, Look, Read.
Left number, italic title, model line, right a looping video still from the MotionSites library.
Hover: title goes steel blue, video loses grayscale.

Lab
Same pill nav. Working tools: speech, voice match, face-in-video, reverse image search, OCR.
Paytm/GPay classifiers stay offline — Look is reverse image search.
```
