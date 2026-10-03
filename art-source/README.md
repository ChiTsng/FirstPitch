# Stadium night hero artwork

This folder holds the **source** of the opening artwork: the original PNG and
its generation record. It sits outside `public/` on purpose — everything under
`public/` is copied verbatim into `dist/`, and neither the 2.2 MB original nor
this generation record belongs in the published site.
The only copy that ships is `public/art/stadium-night-v2.webp`.

- Generation mode: built-in `image_gen` tool, `stylized-concept` use case.
- Original generated file: `art-source/stadium-night-v2.png` (1672 × 941 px, 2,226,073 bytes).
- Web delivery copy: `public/art/stadium-night-v2.webp` (1672 × 941 px, 249,822 bytes), converted from the PNG with FFmpeg `libwebp -quality 88` without changing the composition.

## Exact generation prompt

```text
Use case: stylized-concept
Asset type: premium baseball learning website hero background, wide cinematic landscape approximately 16:9.
Primary request: A breathtaking, emotionally charged baseball stadium at blue hour turning to night, seen from an elevated vantage just behind the first-base-side home plate stands, looking across the entire sweeping stadium bowl. The field occupies the right half and lower middle: luminous emerald outfield grass, warm copper-clay infield, elegant crisp baseline geometry, distant pitcher's mound and bases at credible baseball scale. Huge architectural depth with curving multi-tier terraces, tiny subtle spectator silhouettes, tall ivory floodlights, atmospheric shafts of light and delicate airborne particles. An editorial sports title-sequence visual, confident, sophisticated, tactile and cinematic.
Style/medium: high-end stylized 3D environment render with realistic surface detail and art-directed cinematic grading; premium AAA sports opening frame. Strong perspective, graceful flowing stadium curves, immersive sense of scale.
Composition/framing: 16:9 horizontal image. Reserve the leftmost approximately 35% as deep shadowed inky-blue atmosphere with unobtrusive dark stadium silhouette and clean, calm negative space suitable for a large cream Chinese headline placed later in code. The field and defining stadium detail glow on the right and below, drawing the eye through the image. Avoid prominent objects or bright high-contrast marks in the left text area.
Lighting/mood: blue-hour navy sky fading to deep inky blue #081c2c, warm ivory floodlights, dramatic but elegant contrast, radiant haze, rich emerald turf, reddish-brown warm clay, ivory glints. Luminous and aspirational.
Materials/textures: carefully lit grass blades, subtle earth texture, layered concrete/steel terraces and hazy spectator mass. Rich, dimensional materials.
Constraints: artwork only; no text, no letters, no numbers, no logos, no watermarks, no UI, no frame or border, no identifiable real teams or players. No giant baseball, no floating ball, no foreground sports equipment. This is atmospheric hero artwork, not a flat vector field diagram.
```
