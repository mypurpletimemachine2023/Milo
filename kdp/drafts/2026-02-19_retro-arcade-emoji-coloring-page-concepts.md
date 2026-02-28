# KDP Coloring Book – Retro Arcade Emoji Edition (Concept Pack)
Date: 2026-02-19
Artifact type: 10 new page concepts + reusable prompt template

## Assumed “top task” (queue:kdp-coloring-book)
Because the queue items aren’t readable from this workspace run, I’m advancing the core pipeline step that almost every KDP coloring book needs next: **a clean, production-ready set of page concepts with consistent generation prompts** (so art generation + QA + layout can start immediately).

If you paste the current top task title/ID later, I can align future artifacts to it exactly.

---

## Reusable prompt template (line-art coloring page)
Use this template per page concept (swap `{SUBJECT}` / `{SCENE DETAILS}` / `{EXTRAS}`):

**Prompt (general):**
> Black and white coloring book page, clean vector-style line art, bold smooth outlines, no shading, no grayscale, no color, no gradients, no hatching, white background, centered composition with a clear foreground subject and simple background elements, kid-friendly cute style, printable, high contrast. Subject: {SUBJECT}. Scene: {SCENE DETAILS}. {EXTRAS}. Do not include text, letters, logos, watermarks, signatures.

**Negative prompt (if supported):**
> color, gray, shading, shadows, gradients, halftone, hatching, scribbles, sketch, messy lines, low contrast, blurry, noise, background clutter, text, letters, numbers, logo, watermark, signature, frame, border, photorealistic

**Production notes:**
- Target trim: 8.5"x11" (portrait)
- Safe area: keep key lines ~0.25" from edge
- Line weight: consistent “marker-friendly” thickness

---

## 10 page concepts (ready to generate)
Theme: **Retro arcade + “emoji-ish” cute characters** (works for kids; also plays nicely with OS Milo brand direction).

### 1) “Joystick Hero Cat”
- Subject: chubby smiling cat holding a giant arcade joystick
- Scene details: standing in front of a simple arcade cabinet silhouette with a few floating stars
- Extras: large open areas for coloring on the cat’s face/body

### 2) “Pixel Heart Power-Up”
- Subject: big pixelated heart icon with cute face (emoji style)
- Scene details: floating above a simple platform, with 4–6 coin icons around
- Extras: keep background minimal; coins evenly spaced

### 3) “Space Invader Friends”
- Subject: 3 friendly ‘space invader’ characters (rounded corners, cute faces)
- Scene details: arranged as a trio with a tiny UFO above them
- Extras: add 6–10 simple stars; no dense patterns

### 4) “Racing Turtle – Turbo Shell”
- Subject: turtle in a tiny retro kart (big wheels)
- Scene details: simple checkered finish flag in background; a few motion lines
- Extras: ensure wheels are big, simple circles (easy to color)

### 5) “Claw Machine Surprise”
- Subject: claw machine with 5–7 plush prizes (bears, stars, hearts)
- Scene details: claw hovering above one prize; coin slot and buttons visible
- Extras: no brand marks; prizes have simple emoji faces

### 6) “Dance Dance Penguin”
- Subject: penguin dancing on a 4-arrow dance pad
- Scene details: 4 large arrows (up/down/left/right) as icons above
- Extras: avoid text; use arrow shapes only

### 7) “Arcade Snack Break”
- Subject: smiling soda cup + popcorn bucket (cute faces)
- Scene details: sitting on a small table with an arcade cabinet behind
- Extras: add a few confetti shapes; keep outlines bold

### 8) “Boss Level Octopus”
- Subject: cute octopus wearing a tiny crown (boss vibe)
- Scene details: holding a game controller; 2–3 bubbles + simple coral silhouettes
- Extras: keep tentacles thick and clean (no complex suction-cup detail)

### 9) “High Score Robot”
- Subject: friendly robot with big screen belly showing a simple trophy icon
- Scene details: robot giving thumbs up; background has 3 simple geometric shapes
- Extras: do not include numbers/letters; trophy icon only

### 10) “Mystery Chest Loot”
- Subject: treasure chest opening with cute icons popping out (star, gem, heart)
- Scene details: simple ground line + 3 sparkles
- Extras: large shapes; avoid micro-details

---

## Next (optional) quick pipeline step
If we want to move from concepts → interior quickly tomorrow:
1) pick 30–50 concepts total
2) generate art batch
3) run a simple QA checklist (line thickness, no text, clean background)
4) place into a standard interior (title page, copyright, 1 page per concept)
