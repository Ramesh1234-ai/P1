# Frontend Implementation Guide - Payment & Analytics

## Components Created

### 1. Payment System

**Main Component:** `src/components/pages/payment.jsx`
- Tab-based interface for Payment History, Statistics, and New Payments
- Fetches payment data from backend API
- Real-time payment status updates

**Sub-components:**

#### PaymentForm.jsx
- Form to create new payments
- Supports multiple payment methods (Card, UPI, Wallet)
- Validation and error handling
- Transaction ID generation on backend

**Usage:**
```jsx
<PaymentForm 
  onSuccess={handlePaymentSuccess}
  userId={user?.id}
/>
```

#### PaymentHistory.jsx
- Displays all user payments in a list
- Expandable payment details
- Verify payment status
- Cancel pending payments
- Date formatting and status indicators

**Usage:**
```jsx
<PaymentHistory 
  payments={payments} 
  onDelete={handleDeletePayment}
  onRefresh={fetchPayments}
/>
```

#### PaymentStats.jsx
- Summary statistics dashboard
- Payment method breakdown
- Success rate metrics
- Visual charts and bars

**Usage:**
```jsx
<PaymentStats stats={stats} />
```

### 2. Analytics System

**Main Component:** `src/components/pages/analyticsDashboard.jsx`
- Comprehensive analytics dashboard
- Multiple tabs: Overview, Engagement, Devices, Regions, Streams
- Charts and visualizations using Recharts
- Real-time data updates

**Features:**
- KPI cards with trend indicators
- Line charts for viewer trends
- Pie charts for device distribution
- Growth metrics (weekly/monthly)
- Top performing streams
- Regional data visualization

### 3. API Integration

**Updated:** `src/services/apiClient.js`

New API endpoints:

```javascript
// Payment APIs
paymentAPI.createPayment(data)           // POST /api/payment/create
paymentAPI.getPaymentHistory(userId)     // GET /api/payment/history/:userId
paymentAPI.verifyPayment(transactionId)  // GET /api/payment/verify/:transactionId
paymentAPI.getPaymentStats(userId)       // GET /api/payment/stats/:userId
paymentAPI.updatePaymentStatus(txnId, status) // PUT /api/payment/status/:transactionId
paymentAPI.deletePayment(transactionId)  // DELETE /api/payment/:transactionId

// Analytics APIs
analyticsAPI.getStreamAnalytics(streamId)
analyticsAPI.getUserAnalytics(userId)
analyticsAPI.getAnalyticsByDateRange(userId, startDate, endDate)
analyticsAPI.generateReport(userId)
analyticsAPI.updateEngagementMetrics(streamId, data)
```

## Setup Instructions

### 1. Install Dependencies (if needed)

```bash
npm install recharts
```

The project already has Axios and React Router installed.

### 2. Add Routes to App.jsx or your router configuration

```jsx
import Payment from './components/pages/payment';
import AnalyticsDashboard from './components/pages/analyticsDashboard';

// In your router:
<Route path="/payment" element={<Payment />} />
<Route path="/analytics" element={<AnalyticsDashboard />} />
```

### 3. Update Navigation Menu

Add links to the sidebar/navbar:

```jsx
<NavLink to="/payment">Payments</NavLink>
<NavLink to="/analytics">Analytics</NavLink>
```

### 4. Environment Variables

Ensure your `.env` file has:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

The apiClient.js is configured to use this URL.

## Component Usage Examples

### Payment Page Example

```jsx
import { User } from "@clerk/react";
import Payment from "./components/pages/payment";

function App() {
  return <Payment />;
}
```

### Analytics Dashboard Example

```jsx
import AnalyticsDashboard from "./components/pages/analyticsDashboard";

function App() {
  return <AnalyticsDashboard />;
}
```

## Data Flow

### Payment Data Flow

```
Payment Component
├── Hooks into useUser() from Clerk
├── Fetches user payment data
│   ├── Payment History (GET)
│   └── Payment Stats (GET)
├── Displays three tabs
│   ├── History Tab → PaymentHistory component
│   ├── Stats Tab → PaymentStats component
│   └── New Payment Tab → PaymentForm component
└── Updates on success/delete
```

### Analytics Data Flow

```
AnalyticsDashboard Component
├── Fetches report data on mount
├── Processes report structure
└── Renders tabs with data visualization
    ├── Overview → KPI cards + charts
    ├── Engagement → Metrics cards
    ├── Devices → Pie chart
    ├── Regions → Top regions list
    └── Streams → Top performing streams
```

## Key Features

### Security
- ✅ Clerk authentication integration
- ✅ Protected routes with requireAuth
- ✅ JWT token in requests
- ✅ Secure payment handling

### User Experience
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Responsive design
- ✅ Empty states

### Data Visualization
- ✅ Line charts for trends
- ✅ Bar charts for comparisons
- ✅ Pie charts for distribution
- ✅ Progress bars for metrics

## Backend Integration

Ensure your backend is running with:

```bash
npm start  # Backend server on port 5000
```

### Required Backend Routes

All routes should be protected with Clerk middleware:

**Payment Routes:**
- POST /api/payment/create
- GET /api/payment/history/:userId
- GET /api/payment/verify/:transactionId
- GET /api/payment/stats/:userId
- PUT /api/payment/status/:transactionId
- DELETE /api/payment/:transactionId

**Analytics Routes:**
- POST /api/analytics/create
- GET /api/analytics/stream/:streamId
- GET /api/analytics/user/:userId
- GET /api/analytics/range
- GET /api/analytics/report/:userId
- PUT /api/analytics/engagement/:streamId

## Styling

All components use Tailwind CSS with:
- Dark theme (slate-900, slate-800)
- Blue accent color (#3b82f6)
- Responsive grid layouts
- Custom animations

## Toast Notifications

Simple toast system implemented in `src/utils/toast.js`:

```javascript
import { toast } from '../utils/toast';

toast.success('Payment created!');
toast.error('Payment failed');
toast.info('Processing...');
toast.warning('Please verify your details');
```

## Troubleshooting

### Payment API calls failing
- Verify backend is running on port 5000
- Check Clerk token is being sent
- Verify MongoDB connection

### Analytics not loading
- Ensure user has made streams first
- Check backend analytics model
- Verify date range query parameters

### UI not responsive
- Clear browser cache
- Ensure Tailwind CSS is built
- Check viewport meta tag

## Next Steps

1. **Testing:** Create test data in MongoDB
2. **Staging:** Deploy frontend to staging server
3. **Backend Integration:** Connect payment gateway (Stripe, Razorpay)
4. **Webhooks:** Set up payment confirmations
5. **Notifications:** Add email confirmations

## File Structure

```
src/
├── components/
│   ├── pages/
│   │   ├── payment.jsx
│   │   ├── analyticsDashboard.jsx
│   │   └── ...
│   ├── payment/
│   │   ├── PaymentForm.jsx
│   │   ├── PaymentHistory.jsx
│   │   └── PaymentStats.jsx
│   └── common/
│       └── ...
├── services/
│   └── apiClient.js (updated)
├── utils/
│   └── toast.js
└── ...
```

---

**Last Updated:** April 2026
**Status:** ✅ Ready for Integration
