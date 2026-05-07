# Multiple 3D Print Areas Plan

## Current Implementation

The Product Customizer already has a placement-aware 2D data model:

- `Customizer.tsx` defines `PrintPlacement`:
  - `front`
  - `back`
  - `leftSleeve`
  - `rightSleeve`
  - `leftSide`
  - `rightSide`
- `placements` state is a `Record<PrintPlacement, PlacementState>`.
- Each placement stores:
  - `uploadedImage`
  - `position`
  - `scale`
  - `rotation`
- `activePlacement` controls which placement is currently edited.
- The 2D preview switches mockup view through `placement.view`.
- `saveDesign()` already compresses uploaded images per designed placement and stores them under `design.placements`.
- `addToCart()` already passes `customDesignPlacements` and `usedPlacements` to the cart item.

The current 3D preview is still effectively front-only:

- `ProductPreview3D` receives only the active placement values:
  - `designImage`
  - `position`
  - `scale`
  - `rotation`
  - `placement`
- `placement` is accepted as a prop but is not currently used to change texture placement.
- UV texture rendering targets the t-shirt meshes `Object_4` and `Object_6`.
- The current UV print constants are front-chest specific:
  - `FRONT_CHEST_U`
  - `FRONT_CHEST_V`
  - `FRONT_CHEST_SIZE`
  - `FRONT_CHEST_X_RANGE`
  - `FRONT_CHEST_Y_RANGE`
- Fallback rendering is also front-chest specific through `FALLBACK_PRINT_ANCHOR`.

## Files That Need Changes

Primary files:

- `src/app/pages/Customizer.tsx`
- `src/app/components/ProductPreview3D.tsx`
- `src/app/types/index.ts`

Secondary compatibility checks:

- `src/app/pages/Cart.tsx`
- `src/app/pages/Checkout.tsx`
- `src/app/pages/Orders.tsx`
- `src/app/pages/OrderDetails.tsx`
- `src/app/pages/admin/Orders.tsx`
- `src/app/services/designService.ts`
- `src/app/services/cartService.ts`

Most secondary files already read `customDesignPlacements` or `usedPlacements`, so they should need little or no structural change.

## Proposed Data Structure

Keep the existing placement structure, but formalize it around saved lightweight previews:

```ts
type PrintPlacement =
  | 'front'
  | 'back'
  | 'leftSleeve'
  | 'rightSleeve'
  | 'leftSide'
  | 'rightSide';

type PlacementState = {
  uploadedImage: string | null;
  previewUrl?: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  label: string;
  view: 'front' | 'back' | 'left' | 'right';
  printArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type SavedDesign = {
  id: string;
  productId: string;
  productTitle: string;
  previewUrl: string;
  selectedSize: string;
  selectedColor: string;
  activePlacement: PrintPlacement;
  placements: Partial<Record<PrintPlacement, PlacementState>>;
  previewMode: '2d' | '3d';
  createdAt: string;
};
```

For cart compatibility, keep:

```ts
{
  customDesignId,
  previewUrl,
  customDesignPlacements,
  usedPlacements,
  isCustomized: true
}
```

This preserves the current cart, checkout, orders, and admin preview behavior.

## Placement Switching

The current placement selector in `Customizer.tsx` should remain the source of truth.

Expected behavior:

1. User selects a placement.
2. `activePlacement` changes.
3. 2D preview switches garment mockup view:
   - `front` -> front mockup
   - `back` -> back mockup
   - sleeves/sides -> left or right mockup approximation
4. Upload/adjust controls operate only on `placements[activePlacement]`.
5. Switching away and back preserves each placement independently.
6. Save design compresses and persists all placements with uploaded images.

This mostly already exists for 2D.

## 3D Preview Strategy

Safe MVP approach:

1. Keep the current front UV texture path stable.
2. Add placement-aware configuration in `ProductPreview3D`.
3. Do not immediately attempt perfect UV mapping for every side.
4. Support placements in phases:
   - Front: existing UV texture on `Object_4` and `Object_6`.
   - Back: add a second UV anchor if confirmed on the GLB UV map.
   - Sleeves/sides: use close-to-surface fallback planes first.

Suggested 3D placement config:

```ts
const PRINT_3D_CONFIG = {
  front: {
    method: 'uv',
    uv: { u: 0.25, v: 0.6, size: 230 },
    fallbackPlane: { position: [-0.08, 0.28, 0.876], rotation: [0, 0, 0] },
  },
  back: {
    method: 'plane-first',
    fallbackPlane: { position: [0.08, 0.28, -0.876], rotation: [0, Math.PI, 0] },
  },
  leftSleeve: {
    method: 'plane-first',
    fallbackPlane: { position: [-0.62, 0.3, 0.18], rotation: [0, -Math.PI / 2.5, 0] },
  },
  rightSleeve: {
    method: 'plane-first',
    fallbackPlane: { position: [0.62, 0.3, 0.18], rotation: [0, Math.PI / 2.5, 0] },
  },
  leftSide: {
    method: 'plane-first',
    fallbackPlane: { position: [-0.42, 0.0, 0.35], rotation: [0, -Math.PI / 3, 0] },
  },
  rightSide: {
    method: 'plane-first',
    fallbackPlane: { position: [0.42, 0.0, 0.35], rotation: [0, Math.PI / 3, 0] },
  },
};
```

The exact values should be tuned visually after implementation.

## ProductPreview3D Props

Current props are active-placement only:

```ts
designImage?: string | null;
position: { x: number; y: number };
scale: number;
rotation: number;
placement?: PrintPlacement;
```

Minimal next step:

- Keep these props.
- Make `placement` actually select the 3D config.
- This avoids changing `Customizer.tsx` initially.

Later full multi-placement 3D preview:

```ts
placements?: Partial<Record<PrintPlacement, {
  uploadedImage: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}>>;
activePlacement: PrintPlacement;
showAllPlacements?: boolean;
```

For MVP stability, render only the active placement in 3D first.

## Save Design

`saveDesign()` is already close to the target behavior:

- It finds all placements with uploaded images.
- It compresses each uploaded image to WebP.
- It stores the compressed image in `placementData`.
- It stores `usedPlacements` in `canvasState`.

Recommended adjustments later:

- Store `activePlacement` at the top level.
- Ensure `previewUrl` is the primary active placement preview.
- Keep compressed images only.
- Do not store full-size base64 images in localStorage.

## Add To Cart

Current Add to cart flow should continue working if the saved design shape remains compatible:

- `customDesignId`
- `previewUrl`
- `customDesignPlacements`
- `usedPlacements`
- `isCustomized: true`

No major cart changes should be required.

Important rule:

- Do not require 3D screenshots for cart.
- Cart preview should continue using `savedDesign.previewUrl`.
- Multi-placement details should be shown through `usedPlacements` and `customDesignPlacements`.

## Risks

- The current GLB has overlapping full-shirt meshes (`Object_4`, `Object_6`), not clearly separated front/back/sleeve meshes.
- UV coordinates are usable, but placement-specific UV regions for back and sleeves are not confirmed.
- Applying one CanvasTexture to both full-shirt meshes may make multiple UV prints appear in unexpected places.
- Plane fallback is visually less accurate but much safer for sleeves/sides.
- Storing many placement images can hit localStorage limits unless all previews remain compressed.
- Rendering all placements at once in 3D may create visual clutter or z-fighting.

## Safe Implementation Order

1. Keep the current working front print unchanged.
2. In `ProductPreview3D`, add placement config constants.
3. Make the existing fallback plane placement-aware.
4. Make the current UV texture path run only for `front`.
5. For `back`, `leftSleeve`, `rightSleeve`, `leftSide`, and `rightSide`, use close-to-surface fallback planes first.
6. Confirm active placement switching works in 3D without changing save/cart logic.
7. Run `npm run build`.
8. Manually test:
   - upload front design
   - upload back design
   - switch between placements
   - save design
   - add to cart
   - verify cart used placements
9. Only after the fallback version is stable, inspect UV regions for back/sleeves and consider UV texture support per placement.

## Recommendation

Implement multi-placement 3D in two phases:

Phase 1:

- Active placement only.
- Front uses existing UV texture.
- Other placements use close fallback planes.
- Save/cart remain unchanged.

Phase 2:

- Optional UV tuning for back and sleeves if the GLB UV map allows reliable placement.
- Optional `showAllPlacements` mode after active-placement rendering is stable.
