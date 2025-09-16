# Buñuelos Ordering System

## Overview

This is a food ordering system specifically designed for "El Rey de los Buñuelos" (The King of Buñuelos), a traditional Colombian pastry shop. The system allows customers to place orders either for in-store pickup or delivery, with a comprehensive admin dashboard for order management. Successfully migrated from React/Node.js/PostgreSQL to pure HTML/CSS/JavaScript/PHP with file-based storage for maximum simplicity and traditional web development approach.

## User Preferences

Preferred communication style: Simple, everyday language.
Technology preferences: HTML, CSS, JavaScript, PHP (no frameworks), file-based storage instead of database systems.

## System Architecture

### Frontend Architecture
- **Pure HTML/CSS/JavaScript**: No framework dependencies, using vanilla JavaScript for maximum compatibility and simplicity
- **Responsive Design**: Mobile-first approach with custom CSS styling and warm gradient backgrounds
- **Multi-page Application**: Separate pages for customer ordering (`pages/index.html`) and admin dashboard (`pages/admin.html`)
- **View-based Navigation**: Single-page app behavior with JavaScript view management for smooth user experience
- **Real-time Updates**: Auto-refresh functionality in admin dashboard for live order monitoring

### Backend Architecture
- **PHP-based API**: RESTful API structure with dedicated endpoints (`api/menu.php`, `api/orders.php`)
- **File-based Data Storage**: JSON files for storing orders with automatic directory creation
- **Simple Routing**: Basic PHP routing system in `index.php` for clean URL structure
- **Security Validation**: Server-side price validation to prevent tampering attacks

### Core Components
- **Order Management**: Complete order lifecycle from creation to completion with status tracking
- **Queue System**: Automatic queue assignment (tradicionales, especiales, mixtos) based on item types
- **Menu Management**: Static menu system with categories (traditional, special) and fixed pricing
- **Admin Dashboard**: Comprehensive dashboard with statistics, order filtering, and status management
- **Order Processing**: Turn number generation and order code assignment for tracking

### API Endpoints
- **GET /api/menu.php**: Returns complete menu with categories and pricing
- **GET /api/orders.php**: Returns all orders for admin dashboard
- **POST /api/orders.php**: Creates new order with server-side validation
- **PUT /api/orders.php**: Updates order status (pending → preparing → ready → delivered)

### Design System
- **Color Palette**: Warm golden browns (#d97706, #92400e) inspired by buñuelos
- **Typography**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI)
- **Layout**: Consistent spacing and responsive grid layouts
- **Dual Experience**: Customer-facing warmth vs admin efficiency in design approach

### Security Features
- **CORS Configuration**: Proper cross-origin resource sharing setup for API access
- **Input Validation**: Server-side validation for all order data
- **Price Protection**: Server validates all prices against authoritative menu data
- **File Security**: JSON data files not directly accessible via web routing

## File Structure

```
/
├── index.php              # Main router and entry point
├── pages/
│   ├── index.html         # Customer ordering interface
│   └── admin.html         # Admin dashboard
├── styles/
│   ├── main.css          # Customer interface styles
│   └── admin.css         # Admin dashboard styles  
├── scripts/
│   ├── app.js            # Customer interface logic
│   └── admin.js          # Admin dashboard logic
├── api/
│   ├── menu.php          # Menu API endpoint
│   └── orders.php        # Orders API endpoint
└── data/
    └── orders.json       # Order storage (auto-created)
```

## External Dependencies

### Runtime Requirements
- **PHP 8.2+**: Core language runtime with built-in server capability
- **File System**: Write permissions for order storage in `data/` directory

### Browser Requirements
- **Modern Browser Support**: JavaScript ES6+ support for fetch API and template literals
- **No External Libraries**: Pure vanilla JavaScript, HTML5, and CSS3 only
- **Responsive Design**: Works on mobile, tablet, and desktop devices

### Development Environment
- **Replit PHP Environment**: Configured to run on port 5000 with proper host binding
- **No Build Process**: Direct PHP execution without compilation or bundling
- **Auto-deployment**: Changes reflect immediately without restart (development mode)

## Migration Notes

Successfully migrated from:
- **React** → Pure HTML/CSS/JavaScript
- **Node.js/Express** → PHP with built-in server
- **TypeScript** → Vanilla JavaScript  
- **Tailwind CSS** → Custom CSS
- **PostgreSQL** → File-based JSON storage
- **Complex build system** → Simple PHP routing

All original functionality preserved including order flow, menu management, admin dashboard, and order processing capabilities.