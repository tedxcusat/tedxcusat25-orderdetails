import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Order, EmailInfo, normalizeOrder } from "@/app/types/order";

// Initialize R2 Client
const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

const MAX_RETRY_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId } = body as { orderId: string };

        if (!orderId) {
            return NextResponse.json(
                { success: false, message: "Order ID is required" },
                { status: 400 }
            );
        }

        const key = `orders/${orderId}.json`;

        // Get the existing order from R2
        const getCommand = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        let order: Order;
        try {
            const response = await r2.send(getCommand);
            const bodyString = await response.Body?.transformToString();

            if (!bodyString) {
                return NextResponse.json(
                    { success: false, message: "Order not found" },
                    { status: 404 }
                );
            }

            const rawOrder = JSON.parse(bodyString);
            order = normalizeOrder(rawOrder);
        } catch {
            return NextResponse.json(
                { success: false, message: "Order not found" },
                { status: 404 }
            );
        }

        // Check if order is accepted (only send emails for accepted orders)
        if (order.status !== 'accepted') {
            return NextResponse.json(
                { success: false, message: "Can only resend emails for accepted orders" },
                { status: 400 }
            );
        }

        // Check if customer has email
        if (!order.customer.email) {
            return NextResponse.json(
                { success: false, message: "Customer email is missing" },
                { status: 400 }
            );
        }

        // Check max retry attempts
        const currentAttempts = order.email?.attempts || 0;
        if (currentAttempts >= MAX_RETRY_ATTEMPTS) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached for this order`,
                    attempts: currentAttempts,
                },
                { status: 429 }
            );
        }

        // Attempt to send email
        let emailResult: { emailStatus: 'not_sent' | 'sent' | 'failed'; error: string | null } = { emailStatus: 'failed', error: null };

        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const emailResponse = await fetch(`${baseUrl}/api/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order, type: 'accepted' }),
            });

            const emailData = await emailResponse.json();
            emailResult = {
                emailStatus: emailData.emailStatus || (emailData.success ? 'sent' : 'failed'),
                error: emailData.error || null,
            };
        } catch (emailError) {
            console.error("Failed to resend confirmation email:", emailError);
            const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
            emailResult = { emailStatus: 'failed', error: errorMessage };
        }

        // Update order's email tracking
        order.email = {
            status: emailResult.emailStatus as EmailInfo['status'],
            attempts: currentAttempts + 1,
            lastAttempt: new Date().toISOString(),
            error: emailResult.error,
        };

        // Save the updated order back to R2
        const putCommand = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(order, null, 2),
            ContentType: "application/json",
        });

        await r2.send(putCommand);

        if (emailResult.emailStatus === 'sent') {
            return NextResponse.json({
                success: true,
                message: `Email resent successfully to ${order.customer.email}`,
                emailStatus: 'sent',
                attempts: order.email.attempts,
            });
        } else {
            return NextResponse.json({
                success: false,
                message: "Failed to resend email",
                emailStatus: 'failed',
                error: emailResult.error,
                attempts: order.email.attempts,
                remainingAttempts: MAX_RETRY_ATTEMPTS - order.email.attempts,
            });
        }
    } catch (error) {
        console.error("Error in resend email:", error);
        return NextResponse.json(
            { success: false, message: "Failed to process resend request" },
            { status: 500 }
        );
    }
}

// GET endpoint to check email status for an order
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json(
                { success: false, message: "Order ID is required" },
                { status: 400 }
            );
        }

        const key = `orders/${orderId}.json`;

        // Get the existing order from R2
        const getCommand = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        try {
            const response = await r2.send(getCommand);
            const bodyString = await response.Body?.transformToString();

            if (!bodyString) {
                return NextResponse.json(
                    { success: false, message: "Order not found" },
                    { status: 404 }
                );
            }

            const rawOrder = JSON.parse(bodyString);
            const order = normalizeOrder(rawOrder);

            return NextResponse.json({
                success: true,
                orderId: order.orderId,
                orderStatus: order.status,
                email: order.email,
                canResend: order.status === 'accepted' &&
                    order.email?.status !== 'sent' &&
                    (order.email?.attempts || 0) < MAX_RETRY_ATTEMPTS,
                maxAttempts: MAX_RETRY_ATTEMPTS,
            });
        } catch {
            return NextResponse.json(
                { success: false, message: "Order not found" },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error("Error checking email status:", error);
        return NextResponse.json(
            { success: false, message: "Failed to check email status" },
            { status: 500 }
        );
    }
}
