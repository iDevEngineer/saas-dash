# Dynamic Pricing Management System

This project now features a fully dynamic pricing management system that allows you to manage
pricing plans through a database and admin UI instead of static configuration files.

## 🎯 Features

- **Database-Driven Pricing**: All pricing plans are stored in PostgreSQL
- **Admin UI**: Complete admin interface for managing pricing plans
- **Dynamic Features**: Flexible feature management with categories and values
- **Real-time Updates**: Changes reflect immediately across the application
- **Stripe Integration**: Automatic synchronization with Stripe pricing
- **Flexible Configuration**: Support for trial periods, popular badges, and custom pricing

## 📊 Database Schema

### Core Tables

- **`pricing_plans`**: Main pricing plan information
- **`pricing_features`**: Master list of available features
- **`plan_features`**: Junction table linking plans to features with specific values

### Key Fields

- `price`: Stored in cents for precision
- `interval`: billing frequency (month/year)
- `trialPeriodDays`: free trial duration
- `isPopular`: highlights plan as most popular
- `isActive`: soft delete functionality
- `sortOrder`: custom ordering

## 🚀 Getting Started

### 1. Initial Data Seeding

```bash
# Run the pricing seed script to populate initial data
npx tsx src/lib/db/seed-pricing.ts
```

This creates:

- 3 default pricing plans (Basic, Pro, Enterprise)
- 11 feature categories
- Plan-feature relationships

### 2. Admin Access

Navigate to `/dashboard/admin/pricing` (requires authentication) to:

- View all pricing plans
- Create new plans
- Edit existing plans
- Activate/deactivate plans
- Manage features and pricing

### 3. API Endpoints

- `GET /api/pricing/plans` - Fetch all active plans
- `POST /api/pricing/plans` - Create new plan
- `GET /api/pricing/plans/[id]` - Get specific plan
- `PUT /api/pricing/plans/[id]` - Update plan
- `DELETE /api/pricing/plans/[id]` - Deactivate plan

## 🔧 Configuration

### Environment Variables

The system now supports dynamic Stripe Price IDs, but you can still set defaults:

```env
STRIPE_PRICE_ID_BASIC=price_basic_id
STRIPE_PRICE_ID_PRO=price_pro_id
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_id
```

### Stripe Integration

1. Create products and prices in Stripe Dashboard
2. Update pricing plans in admin UI with Stripe Price IDs
3. Webhook automatically maps Stripe events to database plans

## 🎨 UI Components

### Dynamic Pricing Cards

The `DynamicPricingCards` component automatically:

- Fetches plans from the database
- Displays features from the plan-feature relationships
- Handles Stripe checkout integration
- Shows loading states and error handling

### Admin Management

The admin interface provides:

- CRUD operations for pricing plans
- Feature management
- Real-time preview
- Form validation
- Soft delete functionality

## 🔄 Migration from Static Config

The system maintains backward compatibility:

- Original `pricing-cards.tsx` still works with static config
- New `pricing-cards-dynamic.tsx` uses database data
- Webhook updated to use database lookups
- Old config file remains for reference

## 🚀 Benefits

1. **No Code Deployments**: Change pricing without code changes
2. **A/B Testing**: Easy to test different pricing strategies
3. **Seasonal Pricing**: Quickly adjust for promotions
4. **Feature Flexibility**: Add/remove features without development
5. **Audit Trail**: Track all pricing changes
6. **Multi-Currency**: Support for different currencies (future enhancement)

## 🎯 Future Enhancements

- Multi-currency support
- Usage-based pricing tiers
- Promotional codes and discounts
- Plan comparison tools
- Analytics and conversion tracking
- Automated Stripe synchronization

---

Your pricing is now fully dynamic and manageable through the admin interface! 🎉
