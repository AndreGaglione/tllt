<!--
Guidance for AI coding agents working on this small static site.
Keep this file concise and focused on discoverable, actionable patterns.
-->

# Copilot instructions — tllt website

Short, actionable notes for editing and extending this repo. Focus on the concrete patterns used here.

- Project type: single-page static website (no build system). Files of interest: `index.html`, `script.js`, `style.css`, `README.md`.

- Big picture / data flow:
  - The site loads a published Google Sheets CSV (see `script.js` constant `sheetUrl`) via PapaParse (CDN). The CSV provides rows with at least these columns: `name`, `Image list`, `interview - IT`, `interview - ENG`.
  - On page load `loadSiteData()` parses the CSV and renders a list (`ul#namesList`). Clicking a name populates `#imagesContainer` and `#interviewContainer`.
  - Images are taken from the `Image list` CSV cell (comma-separated links) and injected as `<img>` tags. Interviews are fetched (via `fetch`) from the URL in the CSV and the code extracts `.doc-content` from the fetched HTML.

- Key files and conventions (exact names matter):
  - `index.html` contains these IDs: `namesList`, `imagesContainer`, `interviewContainer`, `languageToggle`. Do not rename without updating `script.js`.
  - `script.js` DOM classes: generated list items get class `name-item` and the active item gets `active`.
  - Language codes used: `'IT'` and `'ENG'`. The toggle persists to `localStorage` under key `language`.

- External dependencies & integration points:
  - PapaParse is loaded from CDN in `index.html` (v5.3.2). Keep using it for CSV parsing unless you intentionally replace it and update the script tag.
  - Data sources are external Google services: a published Google Sheets CSV (`sheetUrl`) and Google Drive/Docs links in CSV cells. Expect remote fetches and CORS constraints.

- Observable quirks and things an agent should notice (and examples):
  - `convertToDirectLink()` in `script.js` converts a Google Drive `id=` URL into a thumbnail URL but is currently unused. When fixing image rendering for Drive links, apply this function to each image link before injecting it.
  - The scroll code references `.images-wrapper` (in the last block of `script.js`) but `index.html` does not have an element with that class. Likely intention: wrap `#imagesContainer` in an element with class `images-wrapper` (or update the script to use `#imagesContainer`). Example location: end of `script.js`.
  - `imagesContainer` is populated via `innerHTML` with raw `<img>` and the interview content is injected from fetched HTML (`content.innerHTML`). Be cautious: these are direct DOM insertions and may introduce XSS if CSV entries are untrusted.

- Recommended edits pattern for agents:
  - When changing DOM IDs/classes, update both `index.html` and `script.js`. Search for the exact ID strings (`namesList`, `imagesContainer`, `interviewContainer`, `languageToggle`) before editing.
  - For any change that touches data fetching (CSV URL, parsing, or fetch of interviews), add a small defensive check (e.g., confirm `results.data` exists, check `res.ok` before `res.text()`) and keep user-visible fallback messages (the code already inserts messages on failure).
  - When improving Drive image handling, apply `convertToDirectLink()` to each CSV image link. Example snippet:

    // from `script.js` — before injecting images
    const imageLinks = (row["Image list"] || "").split(',').map(link => convertToDirectLink(link.trim()));

- Developer workflows (how to run & debug):
  - No build step. Open `index.html` in a browser or serve the directory via a simple HTTP server (recommended to avoid CORS/file restrictions):

    ```bash
    # Python 3
    python3 -m http.server 8000
    # then open http://localhost:8000
    ```

  - Live edit flow: open `index.html` in the browser devtools, set breakpoints in `script.js`, and monitor network requests for the CSV and interview fetches.

- When to ask the human:
  - If CSV structure changes (different column names), ask which CSV column maps to which UI element.
  - If asked to add build tooling, confirm desired toolchain (e.g., npm + bundler) — currently none exists.

- Quick checklist for PRs by agents:
  - Keep `index.html` script tag order (PapaParse must load before `script.js`).
  - Preserve `localStorage` language key behavior unless explicitly requested to change.
  - Add minimal tests or a short manual test note in the PR body describing how to run the static server and a quick smoke test (click a name, check images/interview load).

If anything here is unclear or you want me to also fix the `.images-wrapper` mismatch or wire `convertToDirectLink()` into image handling, tell me and I'll implement the change and run a quick smoke test.
