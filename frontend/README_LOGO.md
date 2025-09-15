Where to place a logo image for the frontend
===========================================

Place a production-ready PNG or SVG logo file in the `frontend/public` folder so Vite serves it at the root. Recommended filename: `logo.png` or `logo.svg`.

Example path on disk:

```
frontend/public/logo.png
```

Usage in code (image fallback):

```
<img src="/logo.png" alt="CTAS logo" width={120} height={64} />
```

Notes:
- Use `/logo.png` (leading slash) so Vite serves it from the public root at runtime.
- For modern apps consider using an inline SVG component (`CTASLogo.jsx`) to ensure crisp scaling and avoid an extra network request.
