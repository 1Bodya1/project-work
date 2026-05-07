# UV Print Areas Plan

## Scope

This plan covers the active 3D model:

- `/models/tshirt.glb`

No Product Customizer UI, camera, model framing, save design, add-to-cart, cart, checkout, orders, or admin logic should change in the inspection step.

## Model Structure

The GLB loads correctly.

Scene nodes:

- `Object_4` -> mesh index `0`
- `Object_6` -> mesh index `1`

Mesh names inside the GLB JSON:

- mesh index `0`: `Object_0`
- mesh index `1`: `Object_1`

Materials:

- `Object_4` / mesh `Object_0`: `material`
- `Object_6` / mesh `Object_1`: `material_1`

Both materials use PBR data and support base color texture maps. Both meshes have clean `TEXCOORD_0` UV coordinates in the `0..1` range.

## Meshes To Texture

Both visible shirt layers should receive the same dynamic CanvasTexture:

- `Object_4`
- `Object_6`

The model has two full-shirt overlapping meshes/layers. Applying the texture to only one mesh may make the print partially hidden or inconsistent depending on the viewing angle.

## Approximate UV Anchors

The current frontend already uses Front around `u: 0.25`, `v: 0.60`. Inspection confirms this is close to the front chest region.

Recommended starting anchors:

| Placement | UV Anchor | Confidence | Notes |
| --- | --- | --- | --- |
| Front | `u: 0.25`, `v: 0.62` | High | Clean front chest island. Current UV texture approach is already working. |
| Back | `u: 0.755`, `v: 0.635` | High | Clean upper back island, separate from front. |
| Left sleeve | `u: 0.33`, `v: 0.10` | Medium | Nearest current sleeve anchor lands here, but sleeve UV range is broad and may include folded/overlapping sleeve islands. |
| Right sleeve | `u: 0.63`, `v: 0.10` | Medium | Similar risk as left sleeve. |
| Left side torso | `u: 0.058`, `v: 0.53` | Medium | Near side seam. Small print should work, but a large print may cross UV seams. |
| Right side torso | `u: 0.449`, `v: 0.53` | Medium | Near side seam. Small print should work, but a large print may cross UV seams. |

Inspection details from nearest vertices around the current 3D anchor points:

| Placement | Object_4 nearest UV average | Object_6 nearest UV average |
| --- | --- | --- |
| Front | `u: 0.2379`, `v: 0.6028` | `u: 0.2378`, `v: 0.6025` |
| Back | `u: 0.7566`, `v: 0.6259` | `u: 0.7566`, `v: 0.6262` |
| Left sleeve | `u: 0.3245`, `v: 0.1039` | `u: 0.3281`, `v: 0.0956` |
| Right sleeve | `u: 0.6219`, `v: 0.1118` | `u: 0.6301`, `v: 0.0899` |
| Left side | `u: 0.0577`, `v: 0.5284` | `u: 0.0574`, `v: 0.5285` |
| Right side | `u: 0.4481`, `v: 0.5309` | `u: 0.4487`, `v: 0.5309` |

## Recommended Implementation Approach

Use one shared dynamic `CanvasTexture` for all UV print placements.

Recommended structure:

```ts
const UV_PRINT_AREAS = {
  front: { u: 0.25, v: 0.62, size: 230 },
  back: { u: 0.755, v: 0.635, size: 230 },
  leftSleeve: { u: 0.33, v: 0.10, size: 140 },
  rightSleeve: { u: 0.63, v: 0.10, size: 140 },
  leftSide: { u: 0.058, v: 0.53, size: 160 },
  rightSide: { u: 0.449, v: 0.53, size: 160 },
};
```

Canvas generation should:

- create one `1024x1024` or `2048x2048` canvas;
- draw the white/base shirt texture background if needed;
- draw each uploaded placement image into its UV area;
- preserve transparency and aspect ratio;
- apply user position/scale/rotation within that placement's local UV area;
- create a `THREE.CanvasTexture`;
- set `texture.colorSpace = THREE.SRGBColorSpace`;
- test and keep the correct `texture.flipY` value for this GLB, currently `false` works for Front;
- apply the cloned material with this texture to both `Object_4` and `Object_6`.

## Feasibility Per Placement

| Placement | UV CanvasTexture Feasible? | Recommendation |
| --- | --- | --- |
| Front | Yes | Keep current UV implementation and extend it into shared multi-placement texture. |
| Back | Yes | Add UV drawing at the upper back anchor. Good candidate to replace fallback plane first. |
| Left sleeve | Likely, but needs visual debug | Add UV debug mark first. Keep fallback plane until verified. |
| Right sleeve | Likely, but needs visual debug | Add UV debug mark first. Keep fallback plane until verified. |
| Left side | Likely for small prints | Use smaller size and keep fallback until seam behavior is checked. |
| Right side | Likely for small prints | Use smaller size and keep fallback until seam behavior is checked. |

## Risks

- Sleeves have broad UV ranges in spatial selection, which suggests folded or overlapping UV islands.
- Side torso anchors are close to seams, so larger prints may wrap, split, or appear distorted.
- Because `Object_4` and `Object_6` overlap, both need the same texture. Different texture timing between the two materials could cause visual mismatch.
- A shared texture means placement drawings can overlap if anchors/sizes are too large.
- White or transparent uploaded images may be hard to see on the white shirt unless the design itself has visible color.

## Debug Strategy

Before replacing fallback overlays for every placement:

1. Add a debug flag such as `SHOW_UV_PRINT_AREA_DEBUG = false`.
2. Draw a red rectangle and label for one placement at a time.
3. Verify that the mark appears in the correct physical area of the shirt.
4. Start with Back because it has the cleanest UV region after Front.
5. Then test sleeves.
6. Then test side torso placements with smaller print sizes.

## Fallback Strategy

Keep the current close-to-surface fallback planes while UV support is validated.

Recommended runtime behavior:

- Use UV CanvasTexture for placements that are confirmed visually correct.
- Keep fallback overlay for placements whose UV anchor is ambiguous or seam-heavy.
- If a placement has an uploaded image but UV rendering does not produce a visible result, show the fallback plane for that placement.

This keeps the MVP demo stable while allowing gradual migration from fallback planes to proper UV texture printing.

## Next Safe Implementation Order

1. Refactor current Front texture generator into a shared multi-placement texture generator.
2. Apply the shared texture to both `Object_4` and `Object_6`.
3. Add Back UV print first using `u: 0.755`, `v: 0.635`.
4. Keep Back fallback available behind a feature flag until visually confirmed.
5. Add sleeves one at a time with debug marks.
6. Add side torso placements with smaller default sizes.
7. Update `PRINT_AREAS_FINAL_AUDIT.md` after visual verification.
