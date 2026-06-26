# Build Errors and Solutions

This document serves as a historical reference for build errors encountered during the development and deployment phases, along with their detailed solutions. It's intended to help quickly resolve similar issues in the future.

---

## 1. Annotation Type Mismatch (Next.js / Vercel Build)

**Date:** June 2026
**Environment:** Next.js Production Build (Vercel)

### The Error

During the `npm run build` process on Vercel, the Next.js compiler failed during the TypeScript checking phase with the following error output:

```text
./src/components/editor/Toolbar.tsx:134:63
Type error: Argument of type 'Annotation[]' is not assignable to parameter of type 'Annotation[]'.
  Type 'Annotation' is not assignable to type 'Annotation'. Two different types with this name exist, but they are unrelated.
    Types of property 'type' are incompatible.
      Type '"text" | "draw" | "image" | "sign" | "line" | "arrow" | "rectangle" | "highlight" | "stamp" | "circle" | "triangle" | "star" | "diamond"' is not assignable to type '"text" | "draw" | "image" | "sign" | "line" | "arrow" | "rectangle" | "highlight" | "stamp"'.
        Type '"circle"' is not assignable to type '"text" | "draw" | "image" | "sign" | "line" | "arrow" | "rectangle" | "highlight" | "stamp"'.
```

### The Cause

This is a classic TypeScript synchronization issue. 
The Redux state and components (like `Toolbar.tsx`) were updated to support new annotation shapes: `'circle'`, `'triangle'`, `'star'`, and `'diamond'`. 
However, the PDF generation utility (`frontend/src/utils/pdfGenerator.ts`) defined its own internal `Annotation` interface that had not been updated to include these new shape types. 

When `Toolbar.tsx` attempted to pass its `annotations` state to the `generatePDF()` function, TypeScript correctly flagged that the shapes inside the array might be incompatible with what `generatePDF()` expected.

### The Solution

The solution is to keep the type definitions in sync. The `Annotation` interface in `pdfGenerator.ts` needs to be updated to include the missing types in its string union.

**File:** `frontend/src/utils/pdfGenerator.ts`

**Changes Made:**
```diff
interface Annotation {
    id: string;
-   type: 'text' | 'draw' | 'image' | 'sign' | 'line' | 'arrow' | 'rectangle' | 'highlight' | 'stamp';
+   type: 'text' | 'draw' | 'image' | 'sign' | 'line' | 'arrow' | 'rectangle' | 'highlight' | 'stamp' | 'circle' | 'triangle' | 'star' | 'diamond';
    x: number;
    y: number;
    page: number;
    // ...
}
```

*Note: While this fixes the TypeScript compilation error, if you want the PDF to actually render these new shapes upon download, you will also need to add the drawing logic for circles, triangles, stars, and diamonds within the `generatePDF` function using the `pdf-lib` methods.*
