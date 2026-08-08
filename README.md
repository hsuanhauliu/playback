# Playback

A video analysis tool for sports form review — frame-by-frame stepping, slow
motion, drawing tools, and synced side-by-side comparison.

**[Open the app →](https://hsuanhauliu.github.io/playback/)**

Everything runs in the browser. Footage is never uploaded: clips are read from
local files and played back through the `<video>` element, so the app works
offline once loaded and your video never leaves the device. It is built as a
plain responsive web app, so the same URL works on desktop, tablet and phone.

## Features

- **Playback** — play/pause, frame stepping, and slow motion down to 0.1×.
- **Drawing tools** — freehand, line, arrow, rectangle, ellipse, and an angle
  tool that reports the measured degrees, in six colours and three stroke
  widths. Pointer-based, so a stylus works.
- **Compare mode** — two clips side by side, each with its own transport,
  drawing canvas, and timecode.
- **Synced playback** — link the two transports so play, scrub, step and speed
  drive both clips at once.
- **Keyboard-driven** — the whole transport and tool palette is reachable
  without leaving the keyboard.

### Aligning two clips

Two clips of the same movement rarely start at the same instant, so syncing
does **not** force their timestamps to match. Instead it holds them a fixed
distance apart:

1. Turn **Sync** off.
2. Scrub each clip to the same point of the movement (say, the bottom of the
   squat).
3. Turn **Sync** on — that offset is captured and held from then on.

Both panes keep showing their own real timecode, which will differ. That is
expected.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` / `K` | Play / pause |
| `←` `→` / `J` `L` | Step one frame |
| `Shift` + `←` `→` | Step ten frames |
| `Shift` + `1`–`4` | Playback speed (0.1× / 0.25× / 0.5× / 1×) |
| `1`–`8` | Select tool (select, freehand, line, arrow, rectangle, ellipse, angle, erase) |
| `⌘Z` / `Ctrl+Z` | Undo last shape |
| `Delete` / `Backspace` | Clear all shapes |

In compare mode, transport keys act on the focused pane — and on both when
Sync is on. Drawing keys always act on the focused pane, marked by the accent
ring and the `A`/`B` chip in the toolbar.

## Development

```bash
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check, then build into `docs/` |
| `npm run preview` | Serve the built `docs/` locally |
| `npm run lint` | Oxlint |

Built with React 19, TypeScript, Vite, Tailwind CSS v4, and Zustand.

## Deploying to GitHub Pages

`npm run build` writes the site to `docs/`. That folder is **gitignored** — it
is built in CI rather than committed. Assets use relative URLs, so the build
works from a project page, a user page, or a custom domain without any
repo-specific configuration.

The [deploy workflow](.github/workflows/static.yml) installs, lints, builds,
and uploads `docs/` as a Pages artifact on every push to `main`. Set
**Settings → Pages → Source** to *GitHub Actions*.

Because `docs/` is gitignored, the workflow must build it — a Pages workflow
that only checks out and uploads `./docs` will fail with
`tar: docs: Cannot open: No such file or directory`.

## Browser support

Chrome and Safari are the safest choices. Everything is decoded by the
browser's own video stack, so what plays depends on the browser, not on this
app.

**Firefox struggles with some iPhone footage.** `.mov` clips — especially HEVC
(H.265), which iPhones record by default — can fail to decode in Firefox on
macOS, either refusing to open or dying mid-playback with:

```
NS_ERROR_DOM_MEDIA_DECODE_ERR — AppleVTDecoder::OnDecodeError
```

Once that happens the video element is finished and will not play again. The
app detects it, rebuilds the decoder a few times, and if that fails shows a
message on the clip rather than sitting there frozen.

If a clip will not play in Firefox, open it in **Safari or Chrome**, or convert
it to MP4/H.264:

```bash
ffmpeg -i input.mov -c:v libx264 -pix_fmt yuv420p -c:a aac output.mp4
```

This is not every `.mov` file — plain H.264 and HEVC `.mov` clips do play in
Firefox in testing. It is specific encodings (10-bit HDR HEVC being the prime
suspect) that break, so treat Firefox as best-effort for phone footage.

> Note: `video.canPlayType()` cannot be used to warn about this up front. It is
> unreliable in both directions — Firefox answers `"maybe"` for
> `video/quicktime` and then fails, while Chrome answers `""` and plays the
> file fine. Only the element's `error` event is trustworthy, which is what the
> app listens to.

## Known limitations

- **Frame stepping assumes 30 fps.** The real frame rate is not read from the
  file, so a step is always 1/30 s. On 60 or 120 fps footage each "frame" step
  covers several real frames.
- **Seeking is approximate.** Browsers seek to nearby keyframes rather than
  exact frames, so stepping is not frame-accurate on heavily compressed
  footage.
- **Annotations are not tied to a timestamp.** Shapes stay on the canvas as
  you scrub rather than appearing only on the frame they were drawn on.
- **Nothing is saved.** Clips and annotations live in memory only and are lost
  on reload; there is no export yet.
