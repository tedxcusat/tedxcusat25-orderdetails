# TEDx Merch Store - Order Management Dashboard

A comprehensive order management system for TEDx merchandise sales with automated email notifications and payment verification.

## 🎯 Overview

This Next.js application provides an admin dashboard to manage customer orders for TEDx merchandise. It features payment screenshot verification, order status management, automated email confirmations with a robust retry mechanism, and seamless integration with Cloudflare R2 for storage.

## ✨ Key Features

### Order Management
- **Real-time Dashboard**: View all orders with filtering, searching, and sorting capabilities
- **Payment Verification**: Review payment screenshots before accepting/rejecting orders
- **Multi-status Support**: Pending, Accepted, and Rejected order states
- **Order Details**: Comprehensive view of customer info, product details, and payment information

### Email Notification System
- **Automated Emails**: Send professional confirmation emails when orders are accepted
- **Email Status Tracking**: Monitor email delivery with status indicators (Sent/Failed/Not Sent)
- **Smart Retry Mechanism**: Automatic retry with up to 5 attempts for failed emails
- **Email Resend**: Manual resend option for failed email deliveries
- **Dark Mode Support**: Email templates remain consistent across light/dark modes

### Advanced Filtering
- Search by customer name, phone, order ID, or transaction ID
- Filter by product, size, order status, and email status
- Quick access to orders with failed emails requiring attention

### Statistics Dashboard
- Total orders count
- Accepted, pending, and rejected orders
- Total revenue from accepted orders
- Real-time filtering results

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: Cloudflare R2 (S3-compatible)
- **Email**: Nodemailer with SMTP
- **SDK**: AWS SDK v3 for S3 operations

## 📋 Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Cloudflare R2 bucket
- SMTP email server credentials

## 🚀 Getting Started

### 1. Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Email Logo URL (optional)
EMAIL_LOGO_URL=https://your-logo-url.com/logo.png
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

## 📁 Project Structure

```
order-details/
├── app/
│   ├── api/
│   │   ├── email/
│   │   │   ├── route.ts          # Email sending endpoint
│   │   │   └── resend/
│   │   │       └── route.ts      # Email resend endpoint
│   │   ├── image/
│   │   │   └── route.ts          # Image proxy for R2
│   │   └── orders/
│   │       ├── route.ts          # List all orders
│   │       └── [orderId]/
│   │           └── route.ts      # Update order status
│   ├── types/
│   │   └── order.ts              # TypeScript interfaces
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main dashboard
├── public/
│   └── tedx-logo.png             # TEDx logo
├── .env                          # Environment variables
└── README.md
```

## 🔌 API Endpoints

### Orders

#### GET `/api/orders`
Retrieve all orders from R2 storage.

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "total": 10
}
```

#### PATCH `/api/orders/[orderId]`
Update order status (accept/reject) and trigger email notification.

**Request:**
```json
{
  "status": "accepted" | "rejected" | "pending"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated to accepted",
  "order": {...},
  "emailSent": true,
  "emailStatus": "sent"
}
```

### Email

#### POST `/api/email`
Send confirmation email for an order.

**Request:**
```json
{
  "order": {...},
  "type": "accepted"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Confirmation email sent to customer@email.com",
  "emailStatus": "sent",
  "messageId": "..."
}
```

#### POST `/api/email/resend`
Resend email for a specific order (max 5 attempts).

**Request:**
```json
{
  "orderId": "ORDER123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email resent successfully",
  "emailStatus": "sent",
  "attempts": 2,
  "remainingAttempts": 3
}
```

#### GET `/api/email/resend?orderId=ORDER123`
Check email status for an order.

**Response:**
```json
{
  "success": true,
  "orderId": "ORDER123",
  "orderStatus": "accepted",
  "email": {
    "status": "failed",
    "attempts": 2,
    "lastAttempt": "2026-01-23T10:00:00Z",
    "error": "Connection timeout"
  },
  "canResend": true,
  "maxAttempts": 5
}
```

## 📧 Email Features

### Email Status Tracking
Each order tracks:
- **Status**: `not_sent`, `sent`, or `failed`
- **Attempts**: Number of send attempts (max 5)
- **Last Attempt**: Timestamp of last send
- **Error**: Error message if failed

### Automatic Retry Logic
- Email sending is attempted when order is accepted
- Failed attempts are logged with error details
- Manual resend available for up to 5 total attempts
- Prevents infinite retry loops

### Email Template Features
- Professional HTML design
- Responsive and mobile-friendly
- Dark mode resistant (stays consistent)
- Includes order details, customer info, and delivery address
- TEDx branded with logo

## 🎨 UI Components

### Dashboard Statistics
- Total orders
- Accepted/Pending/Rejected counts
- Accepted revenue
- Filtered results count

### Order Table
- Customer information
- Product and size
- Price and date
- Order status badge
- Email status indicator
- Quick view action

### Filters
- Search bar (name, phone, order ID, transaction ID)
- Product filter
- Size filter
- Order status filter
- **Email status filter** (All/Sent/Failed/Not Sent)

### Order Detail Modal
- Full customer and product information
- Payment screenshot viewer
- Order status management
- **Email status section** (for accepted orders):
  - Current email status
  - Attempt counter
  - Last attempt timestamp
  - Error messages
  - **Resend button** (when applicable)
  - Success/error feedback

## 🔧 Configuration

### R2 Storage Structure
Orders are stored as JSON files:
```
orders/
  ├── ORDER123.json
  ├── ORDER124.json
  └── ...
```

### Order JSON Schema
```typescript
{
  orderId: string;
  timestamp: string;
  verified: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  product: {
    id: string;
    name: string;
    size: string;
    price: number;
  };
  payment: {
    transactionId: string;
    screenshotUrl: string;
  };
  email?: {
    status: 'not_sent' | 'sent' | 'failed';
    attempts: number;
    lastAttempt: string | null;
    error: string | null;
  };
}
```

## 🚨 Troubleshooting

### R2 Connection Issues
If you see `ETIMEDOUT` errors:
- Check if Cloudflare R2 is accessible from your network
- Verify VPN/firewall settings
- Test connection: `Test-NetConnection -ComputerName r2.cloudflarestorage.com -Port 443`
- Try using mobile hotspot if on restricted network

### Email Sending Issues
- Verify SMTP credentials
- For Gmail: Use [App Password](https://support.google.com/accounts/answer/185833)
- Check email status in order details
- Use resend feature for failed emails

### Environment Variables
- Ensure all required environment variables are set
- Restart dev server after `.env` changes

## 📝 Development Notes

### Database Schema Changes
The `email` field was added to track email delivery status. This is:
- **Optional** in the schema (`email?: EmailInfo`)
- **Backward compatible** with existing orders
- **Auto-initialized** by `normalizeOrder()` function

No database migration required - new field is added automatically.

## 🔐 Security Considerations

- Environment variables should never be committed
- SMTP credentials should use app passwords, not main passwords
- R2 access keys should have minimal required permissions
- Production deployments should use HTTPS

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

## 🤝 Contributing

This project is maintained for TEDx event merchandise management. For issues or feature requests, please contact the development team.

## 📄 License

Proprietary - TEDx Event Management System
