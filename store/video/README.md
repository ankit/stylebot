# Demo video

The store and website demo: about 65 seconds, captions over a calm music bed,
on a saved copy of Wikipedia's _Ikigai_ article, with Chrome and Stylebot in
dark mode.

| Caption                    | What happens                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Restyle any website.       | Opens on the finished dark reading look                                                                                               |
| Open Stylebot on any site. | Toolbar icon, popup, and the side panel slides in                                                                                     |
| Pick anything on the page. | Hovering the article, then picking a paragraph                                                                                        |
| Style it your way.         | Newsreader at 18px with 30px lines; links in vermilion, widened from one link to all through the selector's alternatives              |
| Or write CSS.              | Code tab: the header is hidden                                                                                                        |
| Or ask your coding agent.  | Claude Code runs `/stylebot give this article a calm dark reading look`, which applies the gallery's Slate theme through the real CLI |
| Keep more than one look.   | Switching between Default and Slate in the popup                                                                                      |

It ends on a card with the icon, the tagline and stylebot.dev.

## Making it

The video is made in two steps. The capture drives the real extension in
headless Chrome and records each surface and a timeline of everything that
happens. The render composes those into the video: Chrome's frame, the
terminal, cursor, camera moves, captions, music and the edit.

```bash
yarn build:preview       # from the repository root; the capture loads preview-dist/
cd store/video
npm install
npm run capture          # public/capture/, about 90 seconds
npm run preview          # out/stylebot-demo-preview.mp4, 960×540, for checking
npm run render:4k        # out/stylebot-demo-4k.mp4
npm run thumbnail        # out/thumbnail.png, 1280×720 for YouTube
```

Re-capture after the extension's UI changes. Changes to captions, timing,
camera or styling only need a render. `npm run studio` opens Remotion's
editor to scrub through the video.

The music is AtlasAudio's
["Calm Music"](https://pixabay.com/music/pop-calm-music-594874/) from
Pixabay: download it to `public/music.mp3` before rendering, or the video has
no sound. Pixabay's license doesn't allow sharing the track on its own, so it
isn't committed, and neither are the captured frames or the rendered videos;
the Chrome Web Store takes a YouTube link to the video.
