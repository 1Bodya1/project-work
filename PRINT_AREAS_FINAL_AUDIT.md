# Multi-Placement Print Areas Final Audit

## Scope

This audit covers the current MVP multi-placement customization flow for:

- Front
- Back
- Left sleeve
- Right sleeve
- Left side
- Right side

The audit is based on the current frontend implementation in mock mode. The Product Customizer layout, 3D model framing, cart flow, and checkout flow were not redesigned for this audit.

## Current Flow

The Product Customizer keeps independent placement state for each print area:

- uploaded image
- x/y position
- scale
- rotation
- active state

The active placement controls the current upload, sliders, 2D preview, and 3D preview input. Switching placements preserves each placement's own uploaded image and adjustments.

Save design stores all placement data in one custom design object. Add to cart includes the saved design id, preview, placement data, and `usedPlacements`. The Cart page reads `usedPlacements` and displays human-readable placement labels.

## 2D Placement Support

All six placements are supported in the 2D customizer preview.

| Placement | 2D Mockup View | Print Area Behavior |
| --- | --- | --- |
| Front | `product.mockups.front` | Center chest area |
| Back | `product.mockups.back` | Upper center back area |
| Left sleeve | `product.mockups.left` | Upper sleeve area |
| Right sleeve | `product.mockups.right` | Upper sleeve area |
| Left side | `product.mockups.left` | Side torso area |
| Right side | `product.mockups.right` | Side torso area |

The 2D preview uses `object-contain` product mockups and a dashed burgundy print area. Uploaded images appear inside the selected print area and respond to the sliders.

## 3D Placement Support

All six placements are supported in the 3D preview.

| Placement | 3D Method | Notes |
| --- | --- | --- |
| Front | Shared UV CanvasTexture | Drawn at `u: 0.25`, `v: 0.62`. |
| Back | Shared UV CanvasTexture | Drawn at `u: 0.755`, `v: 0.635`. |
| Left sleeve | Shared UV CanvasTexture | Drawn at `u: 0.18`, `v: 0.58`. Emergency fallback plane remains if texture generation fails. |
| Right sleeve | Shared UV CanvasTexture | Drawn at `u: 0.455`, `v: 0.58`. Emergency fallback plane remains if texture generation fails. |
| Left side | Shared UV CanvasTexture | Drawn at `u: 0.058`, `v: 0.53`. |
| Right side | Shared UV CanvasTexture | Drawn at `u: 0.449`, `v: 0.53`. |

The 3D preview builds one shared dynamic CanvasTexture for all uploaded placements and applies the same texture to both shirt layers, `Object_4` and `Object_6`. Close-to-surface fallback planes remain available only as an emergency backup if the UV texture cannot be generated. OrbitControls remain enabled for rotating the model.

## Save Design

Save design works with one or more uploaded placements.

Saved design includes:

- `id`
- `productId`
- `productTitle`
- `selectedSize`
- `selectedColor`
- `activePlacement`
- `placements`
- `usedPlacements`
- `previewUrl`
- `createdAt`
- `canvasState`

`usedPlacements` is calculated from placements that contain an uploaded image or preview. At least one placement, size, and color are required before saving.

## Add To Cart

Add to cart uses the saved custom design and stores:

- `customDesignId`
- `previewUrl`
- `customDesignPlacements`
- `usedPlacements`
- selected size
- selected color
- `isCustomized: true`

The cart item persists through the existing cart store/localStorage mock mode. Header badge updates through the cart context.

## Cart Display

The Cart page supports multi-placement customized products.

It displays:

- customized preview image
- "Custom design saved" label
- size
- color
- quantity
- price
- item total
- print area labels from `usedPlacements`

The cart also supports quantity update, remove, and refresh persistence through the existing mock cart storage.

## Known Limitations

- Front and Back have the highest UV confidence.
- Left side and Right side are UV-backed and currently work correctly.
- Left sleeve and Right sleeve are UV-backed again, but may still need visual micro-tuning because sleeve UV islands are more ambiguous than front/back.
- Emergency fallback planes are still present for MVP stability if texture generation fails.
- The UV anchors are tuned for the current `/models/tshirt.glb` model and may need retuning if the GLB model changes.
- The saved preview image is based on a compressed uploaded image/2D fallback, not a rendered 3D screenshot.
- Browser-based localStorage quota still limits very large or many uploaded images, though previews are compressed before saving.

## Demo Instructions

1. Start the project with `npm run dev`.
2. Open a customizable product and go to `/customize/:productId`.
3. Select size and color.
4. Select `Front`, upload an image, adjust position/size/rotation.
5. Switch to `3D Preview` and confirm the front print is visible.
6. Select `Back`, upload an image, adjust it, and confirm it appears on the back in 3D.
7. Repeat for `Left sleeve`, `Right sleeve`, `Left side`, and `Right side`.
8. Switch between `2D Preview` and `3D Preview` to confirm each active placement persists.
9. Click `Save design`.
10. Click `Add to cart`.
11. Open `/cart`.
12. Confirm the customized item appears with the preview and all used placement labels.
13. Refresh the page and confirm the cart item persists.

## Audit Result

- 2D print areas: ready for all six placements.
- 3D print areas: ready for all six placements in MVP mode.
- Save design: supports multi-placement data.
- Add to cart: supports multi-placement customized items.
- Cart display: shows used placements.
- Backend integration: still pending.
