# birthday-portal

A scroll-through birthday letter for Gayatri: one message at a time, friends first, family last, and a closing note from Kunal.

## Adding content

Put every file directly in `content/` (no subfolders), named after the person's `id` in `content/people.csv`:

| File | What it is |
|---|---|
| `nitin_msg.txt` | Text message (UTF-8; Marathi is fine) |
| `nitin_1.jpg`, `nitin_2.png` | Photos and screenshots (`.jpg .jpeg .png .webp .gif`) |
| `nitin_3.mp4` | Video (`.mp4` preferred; `.mov .webm .m4v` also work) |

- Text is shown first, then all photos and videos in one swipeable gallery, sorted by number.
- **Closing note:** `kunal_msg.txt`, plus optional `kunal_1.jpg`, and so on.
- **A new person:** add a row to `people.csv` (`id,name,relation,order`). `relation` must be one of `friend`, `close-friend`, `school-friend`, `college-friend`, `relative`, `in-laws` or `family`. `order` is optional; lower numbers come first within the group.
- **A joint message** (for example Aai and Baba together): add a row like `aai-baba,Aai & Baba,family,6`.
- People without files are skipped automatically.
- **Group order:** friend → close-friend → school-friend → college-friend → relative → in-laws → family. Chapter titles are at the top of `site/app.js`, and the welcome text is in `site/index.html`.

### Keep files small
- **Videos:** keep each under 25 MB, the host's limit. 720p H.264 is plenty:
  `ffmpeg -i in.mov -vf scale=-2:720 -c:v libx264 -crf 28 -c:a aac -b:a 96k -movflags +faststart out.mp4`
- **Photos:** keep each under about 1 MB. Around 1600px on the long edge is enough.

## Build and preview

```bash
python3 build.py                        # writes dist/ and lists any problems
python3 -m http.server -d dist 8000     # open http://localhost:8000
```

Read the `WARNING` lines: they report misnamed files, files that are too big, and IDs missing from `people.csv`.

## Deploy (Cloudflare Pages, free)

Cloudflare Pages has unlimited bandwidth on the free plan and a 25 MB per-file limit.

**Option A: drag and drop.** This keeps the family videos off GitHub.
1. Run `python3 build.py`.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Upload assets**.
3. Name the project (for example `gayatri-31`) and drag in the `dist/` folder.
4. To update later, open the project, choose **Create deployment**, and drag `dist/` in again.

**Option B: from a private GitHub repo.** Every push redeploys.
In **Pages → Connect to Git**, set the build command to `python3 build.py` and the output directory to `dist`.

The site lives at `https://<project>.pages.dev`. Anyone with the link can open it, so share it privately.
