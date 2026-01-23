import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Order, OrderStatus, EmailInfo, normalizeOrder } from "@/app/types/order";

// Initialize R2 Client
const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params;
        const body = await request.json();
        const { status } = body as { status: OrderStatus };

        if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
            return NextResponse.json(
                { success: false, message: "Invalid status. Must be 'pending', 'accepted', or 'rejected'" },
                { status: 400 }
            );
        }

        const key = `orders/${orderId}.json`;

        // Get the existing order
        const getCommand = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        const response = await r2.send(getCommand);
        const bodyString = await response.Body?.transformToString();

        if (!bodyString) {
            return NextResponse.json(
                { success: false, message: "Order not found" },
                { status: 404 }
            );
        }

        // Parse and normalize the order (handles legacy data without status field)
        const rawOrder = JSON.parse(bodyString);
        const order = normalizeOrder(rawOrder);

        // Update the order status and verified flag
        order.status = status;
        order.verified = status === 'accepted';

        // Initialize email tracking if accepting order
        let emailResult: { emailStatus: 'not_sent' | 'sent' | 'failed'; error: string | null } = { emailStatus: 'not_sent', error: null };

        // Send confirmation email if order was accepted
        if (status === 'accepted' && order.customer.email) {
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

                // Update order's email tracking
                order.email = {
                    status: emailResult.emailStatus as EmailInfo['status'],
                    attempts: (order.email?.attempts || 0) + 1,
                    lastAttempt: new Date().toISOString(),
                    error: emailResult.error,
                };
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
                const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
                emailResult = { emailStatus: 'failed', error: errorMessage };

                // Update order's email tracking for failure
                order.email = {
                    status: 'failed',
                    attempts: (order.email?.attempts || 0) + 1,
                    lastAttempt: new Date().toISOString(),
                    error: errorMessage,
                };
            }
        }

        // Save the updated order back to R2
        const putCommand = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(order, null, 2),
            ContentType: "application/json",
        });

        await r2.send(putCommand);

        return NextResponse.json({
            success: true,
            message: `Order status updated to ${status}`,
            order,
            emailSent: emailResult.emailStatus === 'sent',
            emailStatus: emailResult.emailStatus,
            emailError: emailResult.error,
        });
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update order" },
            { status: 500 }
        );
    }
}
