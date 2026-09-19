# UI review — film, about, nav (v2)

Reviewed `v2-film1.png`, `v2-film2.png`, `v2-film3.png`, `v2-about.png`, plus `StationFilm.tsx`, `About.tsx`, `Nav.tsx`, and the `film-*` / `about-*` / pill rules in `index.css`.

Kicker spacing is fine in these frames (`02 SPEAKER`, `01 SPEECH`, `03 VIDEO`). The about capture also includes the boot loader over the first viewport, so the identity block and Selected work were checked from code.

## 1
- **Severity:** High
- **Section:** Film
- **Issue:** Scene copy has no local plate. `.film-dim` is only `rgba(10,10,10,0.42)` and the left fade goes transparent before the headline ends (`max-width: 44rem`, `h2` up to `5rem`). Deck text is `rgba(245,245,245,0.72)` with no shadow. On the Face frame (`v2-film3`) the italic headline and especially the two-line deck sit on the asteroid/debris and drop out. Voice (`v2-film1`) is better but “or not.” still runs through the visor. Dark frames (`v2-film2`) are readable, so this is contrast, not type size.
- **Suggestion:** Put a stronger, copy-width scrim behind the card (or a `max-width: ~28rem` plate + text shadow). Keep the full-frame dim modest if you want, but the type region needs to hold up on bright, busy frames.
- **Status:** open

## 2
- **Severity:** High
- **Section:** Film
- **Issue:** Cards are `height: 100dvh` and parked only `0.2 * 460vh` (~92vh) apart, so they overlap by ~8vh. Opacity is `1 - dist * 1.55`, which leaves two ~28% headlines stacked at the midpoint. That is overlapping type while scrolling, not a clean cut.
- **Suggestion:** Shorten `.film-card` to the type block (~40–50vh) or space anchors so centers are ≥ `1 / 1.55` vh apart, and drive the outgoing card to 0 before the next one rises.
- **Status:** open

## 3
- **Severity:** High
- **Section:** Nav
- **Issue:** The pill now has logo + five stations + About + Notes + Live, `inline-flex` with no wrap. Station links use `className="desk"` but `.desk` is undefined, so nothing collapses. Below `860px` the only rule is `overflow-x: auto` without `flex-shrink: 0` or a scroll hint — items clip inside the rounded pill.
- **Suggestion:** Hide `.desk` (or all station links) below the desktop breakpoint and keep About / Notes / Live, or add a compact menu. If you keep a scroller, `flex-shrink: 0` on children and hide the scrollbar.
- **Status:** open

## 4
- **Severity:** Medium
- **Section:** Film
- **Issue:** Film order is Voice → Listen → Face → Look → Read, but kickers still use station numbers. `v2-film1` shows **02 SPEAKER** with footer **01 / 05**; `v2-film2` shows **01 SPEECH** with **02 / 05**. The chrome disagrees with itself.
- **Suggestion:** Number chapters in film order (`01` Voice … `05` Read), or drop the footer index and keep station numbers only.
- **Status:** open

## 5
- **Severity:** Medium
- **Section:** About
- **Issue:** The page is a compressed CV in a `40rem` column. Jobs have no `.about-job` margin; list items are `0.35rem` apart; the first role dumps five long bullets, then an intern role, then a two-column project grid, chips, and education. `h2` only adds `2.1rem` of air. It reads as one block, not sections.
- **Suggestion:** Cap bullets (2–3), add `margin-bottom` on `.about-job`, and increase section / list spacing so Selected work, Projects, and Stack don’t run together.
- **Status:** open

## 6
- **Severity:** Medium
- **Section:** Film
- **Issue:** First card center is at `46vh` of the track; last at `464vh`. At film enter (`progress = 0`) and exit (`progress = 1`) the active card is ~0.46 vh from center, so opacity is `1 - 0.46 * 1.55 ≈ 0.29`. Copy is a ghost until you hit the `0.1` / `0.9` anchors — easy to miss that the film has type at all.
- **Suggestion:** Pin the first/last cards to the start/end of the scrollable range (anchors `0` and `1`), or floor card opacity while that chapter is active.
- **Status:** open

## 7
- **Severity:** Medium
- **Section:** Film
- **Issue:** The right rail is `color: var(--muted)` at `opacity: 0.45` (active is white). On `v2-film3` the inactive labels sit on the debris field and nearly disappear; the dots are the only reliable hit targets.
- **Suggestion:** Give rail labels a dark pill/scrim, or drop inactive names on busy frames and keep dots + the active name only (the ≤860px rule) at all widths.
- **Status:** open
