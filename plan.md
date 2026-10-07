# Task: Birthday tribute website for my wife

## Context
- Wife: **Gayatri** (turning 31). Me: **Kunal**.
- Static site of birthday messages from her relatives and friends.
- Message types: videos, images, screenshots, text.
- Content lives in `content/` in this repo.
- Hosting: free static host (Netlify default). Recommend a better free option if one fits, considering video file sizes and bandwidth limits.

## Design requirements
- Modern, romantic, aesthetic; suited to a 31-year-old woman.
- Fully responsive: mobile and laptop.
- Scroll-driven reveal: show one message at a time as she scrolls. Do **not** show sender names or total message count upfront; reveal each sender only with their message.
- Order groups by relation, building to **family last** (the climax).
- Opening welcome section and closing note from Kunal.

## Step 1: Propose content structure (before coding)
Recommend the simplest setup for me to maintain. My preferred direction:
- One flat `content/` folder, files named `<person-id>_<n>.<ext>` (e.g. `riya_1.jpg`, `riya_2.mp4`, `riya_msg.txt`).
- One mapping file (`content/people.json` or `.csv`) with: `id`, `name`, `relation`, optional `order`.
- Relations: `friend`, `school-friend`, `close-friend`, `in-laws`, `family`.

Show the final naming convention and a sample mapping file. **Wait for my confirmation before building.**

## Step 2: Build
- Site auto-loads messages from the mapping file + matching files (no manual HTML per person).
- Lazy-load images/videos; compress-friendly; fast on mobile data.
- Add a short `README.md`: how to add content and deploy to the chosen host.

## Output
Working site + README. Keep explanations brief.