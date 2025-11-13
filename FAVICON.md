# Favicon Documentation

## Overview
The Wine Tasting Game application uses a custom favicon featuring a wine bottle design to reinforce brand identity and improve user experience across browsers and devices.

## Current Favicon Files

The following favicon files are located in the `/public` directory:

### Core Files
- **favicon.ico** (15KB) - Multi-size ICO file for legacy browser support (16x16, 32x32, 48x48)
- **favicon.svg** (682 bytes) - Vector SVG source file for modern browsers
- **apple-touch-icon.png** (180x180px, 2.2KB) - iOS home screen icon

### Additional Sizes
- **favicon-16x16.png** - Standard small favicon
- **favicon-32x32.png** - Standard medium favicon  
- **android-chrome-192x192.png** - Android home screen icon
- **android-chrome-512x512.png** - High-resolution Android icon

## Design Description

The favicon features:
- A wine bottle silhouette in dark burgundy/brown tones (#4a1e1e, #5a2e2e)
- A cork/cap in brown (#8b4513)
- Wine level indicator inside the bottle (#722f37)
- Subtle highlight for depth (#ffffff with opacity)
- Optional gold label accent (#d4af37)

The design is simple, recognizable at small sizes, and clearly represents a wine bottle theme.

## Browser Support

The favicon has been tested and works across:
- ✅ Chrome/Edge (Windows, macOS, Linux, Android)
- ✅ Firefox (all platforms)
- ✅ Safari (macOS, iOS)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Implementation

The favicon is referenced in the application's root layout (`src/app/layout.tsx`):

```tsx
{/* Icons */}
<link rel="icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
```

Modern browsers will automatically detect and use `favicon.svg` when available, falling back to `favicon.ico` for older browsers.

## How to Update the Favicon

If you need to update or replace the favicon in the future, follow these steps:

### Method 1: Update the SVG Source (Recommended)

1. **Edit the source SVG file:**
   ```bash
   nano public/favicon.svg
   ```
   Or use any SVG editor (Inkscape, Figma, etc.)

2. **Regenerate all formats:**
   ```bash
   cd public
   
   # Generate Apple touch icon (180x180)
   rsvg-convert favicon.svg -w 180 -h 180 -o apple-touch-icon.png
   
   # Generate standard favicon sizes
   rsvg-convert favicon.svg -w 16 -h 16 -o favicon-16x16.png
   rsvg-convert favicon.svg -w 32 -h 32 -o favicon-32x32.png
   
   # Generate Android icons
   rsvg-convert favicon.svg -w 192 -h 192 -o android-chrome-192x192.png
   rsvg-convert favicon.svg -w 512 -h 512 -o android-chrome-512x512.png
   
   # Generate multi-size ICO file
   rsvg-convert favicon.svg -w 32 -h 32 -o favicon-32.png
   convert favicon-32.png -define icon:auto-resize=16,32,48 favicon.ico
   rm favicon-32.png
   ```

3. **Verify the changes:**
   - Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
   - Check favicon displays correctly in browser tab
   - Test on mobile devices if possible

### Method 2: Replace with New Images

If you have pre-made favicon images:

1. **Replace the files in `/public`:**
   - Ensure filenames match exactly: `favicon.ico`, `apple-touch-icon.png`, etc.
   - Recommended sizes:
     - favicon.ico: 16x16, 32x32, 48x48 (multi-size ICO)
     - apple-touch-icon.png: 180x180
     - android-chrome-192x192.png: 192x192
     - android-chrome-512x512.png: 512x512

2. **Optional: Update the SVG source** for consistency

3. **Clear browser cache** to see changes

## Required Tools

To regenerate favicon files from SVG, you'll need:

### Ubuntu/Debian:
```bash
sudo apt-get install librsvg2-bin imagemagick
```

### macOS (Homebrew):
```bash
brew install librsvg imagemagick
```

### Windows:
- Install [Inkscape](https://inkscape.org/) for SVG conversion
- Or use online tools like [RealFaviconGenerator](https://realfavicongenerator.net/)

## Online Favicon Generators

If you prefer not to install tools locally, you can use:

1. **RealFaviconGenerator** (https://realfavicongenerator.net/)
   - Upload your SVG or image
   - Generates all required sizes and formats
   - Provides meta tags (verify they match our layout.tsx)

2. **Favicon.io** (https://favicon.io/)
   - Generate from text, image, or emoji
   - Simple and fast

3. **Favicon Generator** (https://www.favicon-generator.org/)
   - Upload image and get all sizes

## Testing the Favicon

After updating:

1. **Local testing:**
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Check browser tab for favicon
   ```

2. **Clear browser cache:**
   - Chrome/Edge: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (macOS)
   - Firefox: Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (macOS)
   - Safari: Cmd+Option+E then Cmd+R

3. **Test on multiple browsers:**
   - Desktop: Chrome, Firefox, Safari, Edge
   - Mobile: iOS Safari, Chrome Mobile

4. **Check PWA manifest:**
   - Ensure `public/manifest.json` has correct icon references
   - Test "Add to Home Screen" on mobile

## Common Issues

### Favicon not updating after changes
**Problem:** Browser is caching old favicon  
**Solution:** 
- Hard refresh: Ctrl+Shift+R or Cmd+Shift+R
- Clear browser cache completely
- Try in incognito/private browsing mode
- Wait a few minutes (browsers can be slow to update favicons)

### Favicon looks blurry on retina displays
**Problem:** Low-resolution favicon  
**Solution:** 
- Ensure you have high-resolution versions (192x192, 512x512)
- Use SVG when possible (automatically scales)

### Favicon not showing on iOS
**Problem:** Missing apple-touch-icon.png  
**Solution:** 
- Verify `apple-touch-icon.png` exists in `/public`
- Should be 180x180 pixels
- Referenced in layout.tsx

## Version History

- **v1.4.2** (2024-11-13) - Initial favicon implementation with wine bottle design
  - Added SVG source file
  - Generated ICO, PNG formats in multiple sizes
  - Created comprehensive documentation

## Contributing

When updating the favicon:
1. Follow the steps in "How to Update the Favicon"
2. Ensure all formats are regenerated
3. Test across browsers
4. Update this documentation if process changes
5. Commit with conventional commit message: `feat(ui): update favicon design`

## License

The favicon design is part of the Wine Tasting Game project and follows the same license as the main application.
