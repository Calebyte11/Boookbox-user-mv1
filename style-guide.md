# BOOOKBOX Style Guide

## Color Palette

- **Primary color**: `#FF7A00` (Orange)
- **Secondary color**: `#522D8A` (Purple)
- **Accent1 color**: `#FF7A001A` (Orange 10% opacity)
- **Background color**: (Define as needed, e.g., `#FFFFFF` for light mode, `#1A202C` for dark mode)
- **Text color**: (Define as needed, e.g., `#2D3748` for primary text)
- **Border color**: (Define as needed, e.g., `#E2E8F0`)
- **Hover color**: (Define for interactive elements)
- **Active color**: (Define for active states)
- **Disabled color**: (Define for disabled states)
- **Shadow color**: (Define for shadows)
- **Gradient color**: (Define if gradients are used)
- **Success color**: (e.g., `#48BB78`)
- **Error color**: (e.g., `#F56565`)
- **Warning color**: (e.g., `#ED8936`)
- **Info color**: (e.g., `#4299E1`)

## Typography

### Brand Heading

- **Font family**: Inter
- **Font weight**: 800 (Extra Bold)
- **Font size**: 64px
- **Line height**: 24px
- **Letter spacing**: -3.5px
- **Text alignment**: Center
- **Vertical alignment**: Middle
  *Note: `vertical-align` is typically for inline/table-cell elements. For block elements, flex/grid alignment is used.*

### Brand Subheading

- **Font family**: System UI or project default (e.g., Inter, SF Pro)
  *Note: "Body Large/Font" seems like a placeholder. Specify the actual font family.*
- **Font weight**: 400 (Regular)
- **Font size**: (Specify, e.g., 16px, 18px)
  *Note: "Body Large/Size" is a placeholder.*
- **Line height**: (Specify, e.g., 24px, 1.5)
  *Note: "Body Large/Line Height" is a placeholder.*
- **Letter spacing**: (Specify, e.g., 0px, 0.5px)
  *Note: "Body Large/Tracking" is a placeholder.*
- **Text alignment**: Center
- **Vertical alignment**: Middle

### General Text

- **Font family**: (Define default body font, e.g., Inter, Roboto)
- **Font size**: (Define base font size, e.g., 16px)
- **Font weight**: (Define default font weight, e.g., 400)
- **Line height**: (Define base line height, e.g., 1.6)

## Spacing

- **Margin**
- **Padding**
- **Border radius**
- **Line height**
- **Letter spacing**
- **Text shadow**
- **Text overflow**
- **Text indent**
- **Text wrap**
- **Text underline**

## Responsive Layout

- **Small screens**: Default styling
- **Medium screens**: `md:` prefix classes
- **Large screens**: `lg:` prefix classes

## Accessibility Guidelines

- Maintain sufficient color contrast for text readability
- Ensure hover and focus states are clearly visible
- Use appropriate semantic HTML elements
- Provide adequate text alternatives for images
- Ensure interactive elements are accessible via keyboard

## Design Principles

1. **Clean & Modern**: Focus on white space, clear typography, and subtle effects
2. **Consistent Interactions**: Similar elements behave similarly across the interface
3. **Progressive Disclosure**: Show users only what they need at each step
4. **Visual Hierarchy**: Guide users to important content and actions
5. **Responsive Design**: Ensure excellent experience across all device sizes

## Best Practices

- Follow component patterns consistently throughout the application
- Use the gradient system for attention-grabbing elements
- Apply hover states to interactive elements
- Implement smooth transitions when elements change state
- Ensure proper spacing between elements for visual breathing room

## Component Styles

### Buttons

#### Create Account Button Style 1

- **Dimensions**: `width: 380px; height: 50px;`
- **Padding**: `top: 14px; right: 20px; bottom: 14px; left: 20px;`
- **Border radius**: `12px`
- **Gap**: `4px` (If using flex/grid for internal elements)

##### Button Label Style 1

- **Font family**: SF Pro
- **Font weight**: 400 (Regular)
- **Font size**: 17px
- **Line height**: 22px
- **Letter spacing**: -0.43px

#### Create Account Button Style 2

- **Dimensions**: `width: 380px; height: 48px;`
- **Padding**: `top: 12px; right: 8px; bottom: 12px; left: 8px;`
- **Border radius**: `40px`
- **Gap**: `8px` (If using flex/grid for internal elements)

### Input Fields

#### Outlined Input Field (Focused)

- **Text configurations**: "Input text" (Placeholder/Label)
- **Leading icon**: False
- **Trailing icon**: False
- **Show supporting text**: False
- **Input text example**: "Email Address"
- **Dimensions**: `width: 380px; height: 56px;`
- **Border radius**: `top-left: 4px; top-right: 4px;` (bottom radii likely also 4px for consistency)
- **Border**: (Specify focused border, e.g., `2px solid #FF7A00`)

#### Outlined Input Field (Not Focused)

- **Border**: `1px solid #79747E` (Schemes-Outline)
- **Dimensions**: `width: 380px; height: 56px;`
- **Border radius**: `4px`
- **Gap**: `10px` (Likely refers to internal spacing if there are multiple elements within the input wrapper)