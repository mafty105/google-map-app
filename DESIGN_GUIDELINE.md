# Design Guideline

This document outlines the visual design guidelines for the Family Weekend Planner frontend, based on [IKYU Design Guideline](https://www.ikyu.co.jp/design_guideline).

## Design Philosophy

Follow IKYU's principle of providing a **consistent product experience** with clean, user-focused design.

## Color Palette

### Primary Colors

```css
/* Whites and Neutrals */
--white: #ffffff;

/* Grays (for backgrounds, borders, text) */
--gray-100: (light gray for backgrounds)
--gray-200: (lighter borders)
--gray-500: (text secondary)
--gray-800: (text primary)

/* Brand Colors - Adapt for travel/family context */
--primary-blue: #1a4473;     /* Main brand color (Stay Main) */
--accent-blue: #008dde;       /* Accent/interactive (Stay Sub) */
--secondary-gold: #af9b65;    /* Secondary accent (Res Main) */
--light-blue: #82a9da;        /* Soft backgrounds (Spa Main) */
```

### Usage Guidelines

- **Primary Blue (#1a4473)**: Headers, primary buttons, important elements
- **Accent Blue (#008dde)**: Links, interactive elements, hover states
- **White (#ffffff)**: Main backgrounds, cards
- **Grays**: Text hierarchy, borders, subtle backgrounds
- **Light Blue (#82a9da)**: Soft backgrounds, info boxes

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Kaku Gothic ProN',
             'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', sans-serif;
```

### Text Styles

**Headings:**
- **Title XL**: 48px, font-weight: 700 (main page title)
- **Title L**: 32px, font-weight: 700 (section headers)
- **Title M**: 24px, font-weight: 700 (subsections)

**Body Text:**
- **Paragraph L**: 16px, font-weight: 400 (main content)
- **Paragraph M**: 12px, font-weight: 400 (small text, captions)

**Line Height:**
- Headings: 1.2-1.4
- Body text: 1.6-1.8 (for readability)

### Japanese Text Considerations

- Use appropriate line-height for Japanese characters (1.6-1.8)
- Support both Hiragino and Noto Sans JP
- Ensure good readability for mixed Japanese/English content

## Spacing & Layout

### Spacing Scale

Based on 8px grid system:

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

### Layout Guidelines

- **Page margins**: 24px (mobile), 48px (desktop)
- **Component spacing**: 16px between related elements
- **Section spacing**: 48px between major sections
- **Card padding**: 24px

### Responsive Breakpoints

```css
--mobile: 320px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1440px;
```

## Components

### Buttons

**Primary Button:**
- Background: `--primary-blue` (#1a4473)
- Text: white, 16px, font-weight: 500
- Padding: 12px 24px
- Border-radius: 8px
- Hover: slightly darker background

**Secondary Button:**
- Background: transparent
- Border: 1px solid `--primary-blue`
- Text: `--primary-blue`, 16px, font-weight: 500
- Padding: 12px 24px
- Border-radius: 8px
- Hover: light blue background

**Quick Reply Buttons:**
- Background: white
- Border: 1px solid `--gray-200`
- Text: `--gray-800`, 14px
- Padding: 8px 16px
- Border-radius: 20px (pill shape)
- Hover: `--light-blue` background

### Cards

- Background: white
- Border: 1px solid `--gray-200` or subtle shadow
- Border-radius: 12px
- Padding: 24px
- Shadow: 0 2px 8px rgba(0, 0, 0, 0.08)

### Chat Interface

**User Message Bubble:**
- Background: `--primary-blue` (#1a4473)
- Text: white
- Border-radius: 18px (rounded corners, flat on bottom-right)
- Padding: 12px 16px
- Align: right

**Assistant Message Bubble:**
- Background: `--gray-100` (light gray)
- Text: `--gray-800`
- Border-radius: 18px (rounded corners, flat on bottom-left)
- Padding: 12px 16px
- Align: left

### Forms & Inputs

- Border: 1px solid `--gray-300`
- Border-radius: 8px
- Padding: 12px 16px
- Font-size: 16px
- Focus: border color changes to `--accent-blue`
- Placeholder: `--gray-500`

## Icons

- Use simple, line-based icons
- Stroke width: 2px
- Size: 20px or 24px (depending on context)
- Color: inherit from parent or `--gray-800`

## Borders & Dividers

- Border width: 1px
- Border color: `--gray-200` (subtle)
- Border radius: 8-12px for cards, 4-6px for buttons

## Accessibility

### Color Contrast

- Ensure WCAG AA compliance (4.5:1 for normal text)
- Use sufficient contrast between text and background
- Don't rely on color alone to convey information

### Focus States

- Visible focus indicators for keyboard navigation
- Focus ring: 2px solid `--accent-blue` with 2px offset

### Touch Targets

- Minimum 44x44px for interactive elements (mobile)
- Adequate spacing between clickable elements

## Writing Principles (Japanese Context)

- Use polite Japanese (です・ます form)
- Keep messages concise and clear
- Use natural conversational tone
- Provide clear call-to-actions
- Support both Japanese and English when needed

## Reference Implementation

When building components, refer to:
1. This guideline for colors, typography, spacing
2. IKYU's clean, minimal aesthetic
3. Mobile-first approach
4. Japanese language best practices

## Example Component Styles

### Chat Container

```css
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-lg);
  background: white;
}

.chat-message-user {
  background: #1a4473;
  color: white;
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  margin-left: auto;
  max-width: 70%;
}

.chat-message-assistant {
  background: #f5f5f5;
  color: #2c3e50;
  padding: 12px 16px;
  border-radius: 18px 18px 18px 4px;
  margin-right: auto;
  max-width: 70%;
}
```

### Button Styles

```css
.btn-primary {
  background: #1a4473;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #0f2d4f;
}

.quick-reply {
  background: white;
  border: 1px solid #e0e0e0;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-reply:hover {
  background: #82a9da;
  border-color: #82a9da;
  color: white;
}
```

---

**Reference**: [IKYU Design Guideline](https://www.ikyu.co.jp/design_guideline)
**Last Updated**: 2025-11-12
**Status**: Active - Use when implementing frontend (Issue #9)
