# Dark Mode Implementation Analysis

## Current State

### Theme Implementation (`app/context/theme.tsx`)

- **Status**: Static theme without dark mode support
- **Issues**:
  - No `mode` property set (defaults to 'light')
  - Hardcoded colors that don't adapt to dark mode
  - No state management for theme preference
  - No context to expose toggle functionality

### Color Usage Patterns

#### ✅ Theme-Aware (Good)

- Components using MUI theme tokens: `theme.palette.primary.main`, `color="text.primary"`, `bgcolor="background.default"`
- Examples:
  - `Layout.tsx`: Uses `bgcolor: 'background.default'`, `color: 'text.primary'`
  - `Navbar.tsx`: Uses `theme.palette.gradient.headerFooter`
  - `Footer.tsx`: Uses `theme.palette.gradient.headerFooter`, `color={(theme) => theme.palette.primary.main}`

#### ❌ Hardcoded Colors (Needs Refactoring)

**CSS Modules:**

- `app/page.module.css`:

  - `.cmsContent a { color: #333; }` (line 63)
  - `.cmsContent th { background: rgba(0, 0, 0, 0.05); }` (line 82)
  - `.cmsContent :global(.spenpo-container):nth-child(even):not(.hero) { background: rgba(255, 255, 255, 0.92); }` (line 440)
  - `.cmsContent :global(.wp-block-button__link) { background: #1976d2; color: #fff; }` (line 395)

- `app/consulting/consulting.module.css`:
  - Similar hardcoded colors as above

**React Components:**

- `app/components/Breadcrumbs.tsx`: `color: '#555'` (line 9)
- `app/components/Snackbar.tsx`: `color: '#000', bgcolor: '#ddd'` (line 7)
- `app/components/Navbar.tsx`: `color: 'white'` (line 154) - should use theme
- `app/products/components/Product.tsx`: `bgcolor="#eee"`, `border="solid 1px #ddd"` (lines 23-24)
- `app/products/components/AvailableDomain.tsx`: `bgcolor: isSelected ? '#555' : ''`, `color: isSelected ? '#fff' : ''` (lines 24-25)
- `app/products/components/SelectDomain.tsx`: `sx={{ color: 'lightgray' }}` (line 65)
- `app/products/landing-page/components/OverviewStepper.tsx`: `bgcolor: '#fff'` (line 28)
- `app/products/landing-page/[appName]/domains/components/ClientDomain.tsx`: `color: '#555'` (line 134)
- `app/products/landing-page/[appName]/deployments/components/SmallHeader.tsx`: `color: '#555'` (line 5)
- `app/products/landing-page/[appName]/deployments/components/Deployment.tsx`: `bgcolor="#000"`, `color="#fff"` (line 111), `color: '#000'` (line 100)
- `app/components/DeploymentCardClient.tsx`: `bgcolor: '#aaa'` (line 52)
- `app/components/SiteCardClient.tsx`: `bgcolor: '#aaa'` (line 79)

**Background Images:**

- `app/page.tsx`: Hardcoded gradient overlay `linear-gradient(#00416b01, #00416b55)` (line 56)

## Refactoring Strategy

### Phase 1: Core Theme Infrastructure (Priority: High)

1. ✅ Add dark mode state to `ThemeProvider`
2. ✅ Create light and dark palette configurations
3. ✅ Expose `ColorModeContext` with toggle function
4. ✅ Add localStorage persistence for theme preference

### Phase 2: Component Updates (Priority: Medium)

1. ✅ Fix critical components (Breadcrumbs, Snackbar, Navbar)
2. ⚠️ Update product components (can be done incrementally)
3. ⚠️ Update CSS modules (requires CSS variables or conversion to sx props)

### Phase 3: CSS Modules (Priority: Low - Can be incremental)

- CSS modules are harder to make theme-aware
- Options:
  1. Convert to `sx` props where possible
  2. Use CSS variables (requires additional setup)
  3. Use `:global()` with theme-aware classes
  4. Accept that some CMS content may have fixed colors

## Implementation Plan

### Immediate Changes

1. Refactor `ThemeProvider` to support `mode: 'light' | 'dark'`
2. Add `ColorModeContext` to expose `toggleColorMode` function
3. Add dark mode toggle button to Navbar
4. Fix hardcoded colors in Breadcrumbs and Snackbar

### Future Improvements

- Gradually migrate hardcoded colors to theme tokens
- Consider CSS variables for CSS modules
- Add dark mode variants for gradients and backgrounds
- Test all pages for dark mode compatibility

## Notes

- MUI's `createTheme` automatically handles many color adjustments when `mode: 'dark'` is set
- Some custom colors (like gradients) will need explicit dark mode variants
- CSS modules require special handling since they can't directly access theme context
