export interface Customer {
    name: string;
    email: string;
    phone: string;
    address: string;
}

export interface Product {
    id: string;
    name: string;
    size: string;
    price: number;
}

export interface Payment {
    transactionId: string;
    screenshotUrl: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'rejected';
export type EmailStatus = 'not_sent' | 'sent' | 'failed';

export interface EmailInfo {
    status: EmailStatus;
    attempts: number;
    lastAttempt: string | null;
    error: string | null;
}

export interface Order {
    orderId: string;
    timestamp: string;
    verified: boolean;
    status: OrderStatus;
    customer: Customer;
    product: Product;
    payment: Payment;
    email?: EmailInfo;
}

// Helper function to normalize order data from DB (handles legacy orders without status field)
export function normalizeOrder(rawOrder: Partial<Order> & { orderId: string; timestamp: string; customer: Customer; product: Product; payment: Payment }): Order {
    // Derive status from verified field if status is missing
    let status: OrderStatus = rawOrder.status || 'pending';

    // If status doesn't exist, derive from verified field
    if (!rawOrder.status) {
        if (rawOrder.verified === true) {
            status = 'accepted';
        } else {
            status = 'pending';
        }
    }

    // Initialize email info if not present
    const email: EmailInfo = rawOrder.email || {
        status: 'not_sent',
        attempts: 0,
        lastAttempt: null,
        error: null,
    };

    return {
        ...rawOrder,
        verified: rawOrder.verified ?? false,
        status,
        email,
    } as Order;
}
