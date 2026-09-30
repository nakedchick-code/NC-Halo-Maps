# NC Halo Maps

This repository contains the source code for the NC Halo Maps website - a static site built
for NakedChick's custom Halo: PC/CE maps, hosted on GitHub Pages.

Browse, preview, and download map releases on this auto-updating static site.

<div align="center">
  <a href="https://nakedchick-code.github.io/NC-Halo-Maps/">
    <img src="https://img.shields.io/badge/VISIT_WEBSITE-c9a15a?style=for-the-badge&logo=github"
         alt="Visit Website"
         style="height: 60px;">
  </a>
</div>

---

## How map data works (no API rate-limit issues)

The Maps page does **not** call the GitHub API from the browser. Instead:

1. `.github/workflows/fetch-releases.yml` runs on a schedule (every 6 hours), whenever a
   release is published/edited, or manually via the Actions tab. It uses the built-in
   `GITHUB_TOKEN` (1,000 requests/hour - far more than needed) to fetch every release and
   its attached files, then writes the result to `_data/releases.json` and commits it.
2. `.github/workflows/jekyll.yml` builds and deploys the site with Jekyll, reading
   `_data/releases.json` at build time. It also runs automatically right after the data
   workflow finishes.
3. Visitors' browsers only ever load a static, pre-built page - zero runtime API calls,
   so there's no rate-limit risk no matter how much traffic the site gets.

### Notes for NakedChick:

**To publish a new map:** just create a new [GitHub Release](../../releases/new) with the
map's `.zip` (or other files) attached. Give it a title that starts with `[PC]` or `[CE]`,
for example `[CE] Liberty Hangar`, so the site knows which game the map is for. Within a
few hours (or immediately if you run the "Fetch Releases Data" workflow manually from the
Actions tab), it'll appear on the Maps page.

**Map Thumbnails:**

The site shows them in a `16:9` box on both the maps page and the home page's latest releases section.
So make your thumbnail `16:9` too.

The best size is `1280x720`. Up to `1920x1080` is fine, but no bigger, since it displays small.
If the image is square or `4:3`, it will be cropped to fit, so keep the main part of the screenshot in the middle.

Keep file size small, under a few hundred KB if you can. The workflow accepts `PNG`, `JPG`, `JPEG`, `GIF`, or `WEBP`.
To add one, drag and drop it into the release description on GitHub, or attach it as a release asset.

If you attach it as an asset, the site uses it as the thumbnail and does not show it as a download button.

---

## License

© 2026 NakedChick. All rights reserved.

All content in this repository, including source code, images, and documentation, is proprietary. You may not copy,
redistribute, or use any assets without explicit prior written permission. This does not apply to the map files
themselves, which are distributed via GitHub Releases for download and use with Halo: Custom Edition and Halo: Combat Evolved.

For the full legal terms, please read the [LICENSE](LICENSE) file.

Website developed by [Chalwk](https://github.com/Chalwk) for NakedChick.

---
