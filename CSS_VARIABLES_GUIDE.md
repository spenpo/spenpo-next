# CSS Variables for Theme-Aware CSS Modules

## Overview

This approach allows CSS modules to access theme values (like dark mode) through CSS variables that are set dynamically based on the theme context.

## How It Works

### 1. ThemeCSSVariables Component

The `ThemeCSSVariables` component (`app/components/ThemeCSSVariables.tsx`) sets CSS variables on the document root (`:root` / `html` element) based on the current theme mode.

- It uses the `ColorModeContext` to get the current mode
- Sets different CSS variable values for light and dark modes
- Updates automatically when the mode changes

### 2. CSS Variables Available

| Variable                  | Light Mode                  | Dark Mode                   | Usage                      |
| ------------------------- | --------------------------- | --------------------------- | -------------------------- |
| `--cms-link-color`        | `#333`                      | `#90caf9`                   | Link text color            |
| `--cms-text-color`        | `#000`                      | `#e0e0e0`                   | Primary text color         |
| `--cms-text-color-dark`   | `rgba(0, 0, 0, 0.9)`        | `#b0b0b0`                   | Secondary text color       |
| `--cms-bg-overlay`        | `rgba(0, 0, 0, 0.05)`       | `rgba(255, 255, 255, 0.05)` | Overlay backgrounds        |
| `--cms-bg-container`      | `rgba(255, 255, 255, 0.92)` | `rgba(255, 255, 255, 0.08)` | Container backgrounds      |
| `--cms-bg-container-even` | `rgba(255, 255, 255, 0.92)` | `rgba(255, 255, 255, 0.12)` | Even container backgrounds |
| `--cms-border-color`      | `rgba(0, 0, 0, 0.08)`       | `rgba(255, 255, 255, 0.12)` | Border colors              |
| `--cms-button-bg`         | `#1976d2`                   | `#1976d2`                   | Button background          |
| `--cms-button-bg-hover`   | `#1565c0`                   | `#1565c0`                   | Button hover state         |
| `--cms-table-header-bg`   | `rgba(0, 0, 0, 0.05)`       | `rgba(255, 255, 255, 0.08)` | Table header background    |
| `--cms-card-bg-start`     | `rgba(255, 255, 255, 0.7)`  | `rgba(255, 255, 255, 0.1)`  | Card gradient start        |
| `--cms-card-bg-end`       | `rgba(255, 255, 255, 0.55)` | `rgba(255, 255, 255, 0.08)` | Card gradient end          |

### 3. Using CSS Variables in CSS Modules

Replace hardcoded colors with CSS variables using the `var()` function with a fallback:

```css
/* Before */
.cmsContent a {
  color: #333;
}

/* After */
.cmsContent a {
  color: var(--cms-link-color, #333);
}
```

The fallback value (`#333` in this case) ensures the styles work even if the CSS variable isn't set (e.g., during SSR or before the component mounts).

## Implementation

### Files Updated

1. **`app/components/ThemeCSSVariables.tsx`** (new)

   - Component that sets CSS variables based on theme mode

2. **`app/components/Layout.tsx`**

   - Added `<ThemeCSSVariables />` to render the component

3. **`app/consulting/consulting.module.css`**

   - Updated link colors, table headers, card backgrounds, text colors, and buttons

4. **`app/page.module.css`**
   - Updated link colors, table headers, container backgrounds, card backgrounds, text colors, and buttons

## Adding New CSS Variables

To add a new CSS variable:

1. **Add it to `ThemeCSSVariables.tsx`**:

   ```tsx
   root.style.setProperty(
     '--cms-new-variable',
     mode === 'dark' ? '#darkValue' : '#lightValue'
   )
   ```

2. **Use it in your CSS module**:
   ```css
   .myClass {
     color: var(--cms-new-variable, #fallback);
   }
   ```

## Benefits

- ✅ CSS modules can access theme values
- ✅ No need to convert CSS modules to `sx` props
- ✅ Maintains separation of concerns (CSS stays in CSS files)
- ✅ Works with SSR (fallback values ensure styles work before hydration)
- ✅ Easy to extend with new variables
- ✅ Centralized theme variable management

## Notes

- CSS variables are set on `document.documentElement` (the `<html>` element)
- Variables update automatically when theme mode changes
- Always provide fallback values in `var()` for SSR compatibility
- The component renders nothing (returns `null`) - it only sets CSS variables
