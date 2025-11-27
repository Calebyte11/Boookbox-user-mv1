# BoookBox PWA 🍽️

A Progressive Web Application (PWA) that creates a social-impact platform connecting meal sponsors with recipients through partnered restaurants. Built with React 19, TypeScript, and Vite.

## 🌟 Features

### For Sponsors
- **Meal Gifting**: Purchase meals for individuals or groups
- **Restaurant Selection**: Browse partnered restaurants and their menu items
- **Flexible Redemption**: Support for pickup and delivery options
- **Bulk Ordering**: Special features for orders of 100+ meals
- **Custom Ticket Design**: Upload personalized meal ticket designs for large orders
- **Multiple Recipients**: Gift meals to multiple recipients at once

### For Recipients
- **Easy Redemption**: Simple meal ticket redemption system
- **Location-based**: Find nearby participating restaurants
- **Real-time Updates**: Track meal availability and status

### For Restaurants
- **Menu Management**: Manage available meals and pricing
- **Order Processing**: Handle sponsored meal orders
- **Real-time Integration**: Seamless order fulfillment system

## 🚀 Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4 with custom animations
- **UI Components**: Radix UI primitives
- **State Management**: Zustand for global state
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form with Yup validation
- **Routing**: React Router v7
- **PWA**: Workbox for service worker and offline functionality
- **Icons**: Lucide React
- **Carousel**: Swiper.js

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── features/           # Feature-based modules
│   ├── auth/          # Authentication components and logic
│   ├── sponsor/       # Sponsor-related features
│   ├── recipient/     # Recipient-related features (in development)
│   └── restaurant/    # Restaurant-related features (in development)
├── pages/             # Top-level page components
├── config/            # Configuration files (routes, etc.)
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── services/          # API service layer
├── store/             # Zustand stores
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── assets/            # Static assets (images, fonts, icons)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bookbox-pwa
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:5173](http://localhost:5173) to view the application.

## 📱 PWA Features

- **Offline Support**: Works without internet connection
- **Installable**: Can be installed on mobile devices and desktop
- **Push Notifications**: Real-time updates for orders and meals
- **Responsive Design**: Optimized for all screen sizes
- **Service Worker**: Caching for improved performance

## 🎨 Design System

The application uses a consistent design system with:
- **Primary Color**: `#FF7A00` (Orange)
- **Typography**: Custom font families for headers and body text
- **Components**: Built with Radix UI for accessibility
- **Responsive**: Mobile-first design approach

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=your_api_base_url
VITE_FIREBASE_CONFIG=your_firebase_config
```

### PWA Configuration

PWA settings can be modified in:
- `public/manifest.json` - App manifest
- `vite.config.ts` - Vite PWA plugin configuration

## 📦 Key Dependencies

### Production Dependencies
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible UI primitives
- **Zustand**: Lightweight state management
- **TanStack Query**: Data fetching and caching
- **React Hook Form**: Performant forms with validation
- **React Router**: Client-side routing
- **Firebase**: Backend services (authentication, database)
- **Vite PWA Plugin**: Progressive Web App capabilities

### Development Dependencies
- **Vite**: Fast build tool and dev server
- **ESLint**: Code linting and formatting
- **TypeScript ESLint**: TypeScript-specific linting rules

## 🎯 Core Features Implementation

### Meal Ordering Flow
1. **Browse Restaurants**: Users can explore partnered restaurants
2. **Select Meals**: Choose from restaurant menus with customization options
3. **Configure Order**: Set redemption method (pickup/delivery), recipients
4. **Payment**: Secure payment processing for sponsored meals
5. **Ticket Generation**: Create redeemable meal tickets for recipients

### State Management
- **Cart Store**: Manages meal selections and quantities
- **Auth Store**: User authentication state
- **UI Store**: Global UI state (modals, notifications)

### Form Validation
- **Order Forms**: Complex multi-step forms with conditional validation
- **User Registration**: Email, phone, and address validation
- **Payment Forms**: Credit card and billing information validation

## 🔐 Authentication

The app supports multiple authentication methods:
- Email/Password registration and login
- Phone number verification
- Address confirmation for delivery options

## 📱 Mobile-First Design

- Touch-friendly interfaces
- Swipe gestures for carousels
- Optimized for various screen sizes
- Native app-like experience when installed

## 🚧 Development Status

### Completed Features ✅
- Sponsor meal ordering workflow
- Restaurant browsing and meal selection
- Shopping cart functionality
- Order form with validation
- PWA setup and offline support
- Responsive UI components

### In Development 🚧
- Recipient meal redemption system
- Restaurant dashboard
- Payment integration
- Push notifications
- Advanced search and filtering

### Planned Features 📋
- Multi-language support
- Analytics dashboard
- Social sharing features
- Loyalty program integration
- API integration for real restaurant data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

---

Built with ❤️ to make a positive social impact through food sharing.
