# Design Guidelines for Buñuelos Ordering System

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern food delivery platforms like DoorDash and local restaurant ordering systems, focusing on warm, appetizing visuals that emphasize the artisanal nature of buñuelos while maintaining professional functionality for the administrative dashboard.

## Key Design Principles
- **Trust & Reliability**: Professional appearance to build customer confidence in online ordering
- **Warmth & Appetite Appeal**: Colors and imagery that evoke the comfort of traditional buñuelos
- **Dual Experience**: Clear separation between customer-facing warmth and admin efficiency

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Brand Primary: 32 85% 45% (warm golden brown - buñuelos color)
- Secondary: 25 75% 35% (deeper brown for contrast)

**Light Mode:**
- Background: 0 0% 98%
- Surface: 0 0% 100% 
- Text Primary: 0 0% 15%

**Dark Mode:**
- Background: 220 15% 8%
- Surface: 220 12% 12%
- Text Primary: 0 0% 92%

**Accent Colors:**
- Success: 142 76% 36% (for completed orders)
- Warning: 38 92% 50% (for pending orders)
- Error: 0 84% 60% (for cancelled orders)

### B. Typography
**Font Families:**
- Primary: Inter (clean, professional for UI)
- Display: Poppins (friendly for headings and branding)

**Scale:**
- Display: 2.5rem (40px) - Poppins 600
- Heading: 1.875rem (30px) - Poppins 600
- Subheading: 1.25rem (20px) - Inter 500
- Body: 1rem (16px) - Inter 400
- Caption: 0.875rem (14px) - Inter 400

### C. Layout System
**Spacing Units:** Consistent use of Tailwind units 2, 4, 8, 12, 16
- Micro spacing: p-2, gap-2
- Standard spacing: p-4, m-4, gap-4
- Section spacing: p-8, my-8
- Large sections: p-12, my-16

**Grid System:**
- Customer interface: Single column mobile-first, 2-column on tablet+
- Admin dashboard: 12-column grid with sidebar navigation

### D. Component Library

**Customer Interface Components:**
- **Order Type Selection**: Large card-based selection (physical vs delivery)
- **Product Cards**: Image, name, price with warm styling
- **Order Summary**: Sticky sidebar with running total
- **Forms**: Rounded corners, warm focus states
- **Buttons**: Primary (golden), secondary (outline), with subtle shadows

**Administrative Dashboard Components:**
- **Navigation**: Left sidebar with order status indicators
- **Order Cards**: Compact view with status badges and quick actions
- **Data Tables**: Clean, scannable with sorting/filtering
- **Modals**: For order details, receipt viewing, editing
- **Status Indicators**: Color-coded badges for order states

**Shared Components:**
- **Notifications**: Toast messages with appropriate colors
- **Loading States**: Subtle spinners with brand colors
- **Forms**: Consistent styling across customer and admin areas

### E. Visual Treatments

**Customer Areas:**
- **Gradients**: Subtle warm gradients (32 85% 55% to 25 75% 45%) for hero sections
- **Background**: Warm off-white with subtle texture suggestions
- **Cards**: Soft shadows, rounded corners (8px radius)
- **Images**: Food photography with warm color grading

**Administrative Areas:**
- **Background**: Clean whites/grays for data clarity
- **Tables**: Alternating row colors for readability
- **Status Colors**: Clear visual hierarchy for order states
- **Charts**: Brand colors for data visualization

## Specific Interface Requirements

### Order Type Selection Screen
- Two large, equal cards: "Pedido Físico" and "Pedido a Domicilio"
- Icons and clear descriptions for each option
- Warm, inviting color scheme

### Delivery Order Form
- Progressive disclosure of fields
- Clear sections: Contact Info, Delivery Address, Payment Method
- File upload area for transfer receipts with preview
- Form validation with helpful error messages

### Dashboard Improvements
- **Dual View**: Separate tabs/sections for physical vs delivery orders
- **Order Details**: Expandable cards showing all customer information
- **Receipt Viewer**: Modal overlay for uploaded transfer receipts
- **Print Actions**: Prominent print buttons for thermal printer
- **WhatsApp Integration**: Quick message sending with status updates

## Images
- **Hero Image**: Not required - focus on clean card-based selection
- **Product Images**: High-quality photos of different buñuelos types
- **Background Patterns**: Subtle food-related textures or patterns
- **Icons**: Food service icons (delivery truck, storefront, receipt, etc.)
- **Receipt Uploads**: Preview thumbnails with expansion capability

## Accessibility & Performance
- High contrast ratios in both light and dark modes
- Keyboard navigation for all interactive elements
- Screen reader friendly labels and descriptions
- Optimized images and efficient loading for mobile users
- Clear visual hierarchy for order status and urgency levels