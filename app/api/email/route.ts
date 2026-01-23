import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Order, EmailInfo } from "@/app/types/order";

// Create transporter using SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Email template for order acceptance
function getAcceptanceEmailHTML(order: Order, logoUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light">
    <title>Order Confirmed - TEDx Merch Store</title>
    <style>
        /* Prevent email clients from changing colors in dark mode */
        @media (prefers-color-scheme: dark) {
            .email-header {
                background-color: #000000 !important;
            }
            .email-header p {
                color: rgba(255,255,255,0.9) !important;
            }
        }
        /* Force light mode for the entire email */
        :root {
            color-scheme: light only;
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header with Logo -->
                    <tr>
                        <td class="email-header" style="background-color: #000000 !important; padding: 30px 40px; text-align: center;" bgcolor="#000000">
                            <img src="${logoUrl}" alt="TEDx Logo" style="height: 40px; width: auto; margin-bottom: 12px;" />
                            <p style="margin: 0; color: rgba(255,255,255,0.9) !important; font-size: 14px;">Order Confirmation</p>
                        </td>
                    </tr>
                    
                    <!-- Success Icon -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" valign="middle" style="width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%;">
                                        <img src="https://img.icons8.com/fluency/96/checkmark.png" alt="Success" style="width: 48px; height: 48px;" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <h2 style="margin: 0 0 10px 0; color: #16a34a; font-size: 24px; text-align: center;">Payment Verified!</h2>
                            <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; text-align: center; line-height: 1.6;">
                                Hi <strong style="color: #1f2937;">${order.customer.name}</strong>, your payment has been verified and your order is confirmed!
                            </p>
                            
                            <!-- Order Details Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Order Details</h3>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order ID</td>
                                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: monospace;">#${order.orderId.toUpperCase()}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Product</td>
                                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${order.product.name}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Size</td>
                                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">${order.product.size}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Transaction ID</td>
                                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; font-family: monospace;">${order.payment.transactionId}</td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding-top: 16px; border-top: 1px solid #e5e7eb;">
                                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="color: #1f2937; font-size: 18px; font-weight: bold;">Total Paid</td>
                                                            <td style="color: #16a34a; font-size: 18px; font-weight: bold; text-align: right;">₹${order.product.price.toLocaleString('en-IN')}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Delivery Address -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Delivery Address</h3>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">${order.customer.address}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- What's Next -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 12px 0; color: #eb0028; font-size: 16px;">What's Next?</h3>
                                        <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                                            <li>Your order will be processed within 24-48 hours</li>
                                            <li>You'll receive updates about your order status</li>
                                            <li>For any queries, contact our support team</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Thank you for supporting TEDx!</p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated email. Please do not reply directly.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { order, type } = body as { order: Order; type: 'accepted' | 'rejected' };

        if (!order || !order.customer.email) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Order or customer email is missing",
                    emailStatus: 'failed' as const,
                    error: "Missing order or email"
                },
                { status: 400 }
            );
        }

        // Only send email for accepted orders (for now)
        if (type !== 'accepted') {
            return NextResponse.json({
                success: true,
                message: "Email not sent for this status type",
                emailStatus: 'not_sent' as const,
            });
        }

        // Use R2 public URL for logo (must upload tedx-logo.png to R2 bucket)
        // Or use a publicly hosted image URL
        const logoUrl = process.env.EMAIL_LOGO_URL || 'https://i.postimg.cc/1thNxGhW/logo-white.png';

        const mailOptions = {
            from: `"TEDx Merch Store" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: order.customer.email,
            subject: `Order Confirmed - #${order.orderId.toUpperCase()} | TEDx Merch Store`,
            html: getAcceptanceEmailHTML(order, logoUrl),
        };

        const info = await transporter.sendMail(mailOptions);

        // Check if email was actually sent (nodemailer returns messageId on success)
        if (info.messageId) {
            return NextResponse.json({
                success: true,
                message: `Confirmation email sent to ${order.customer.email}`,
                emailStatus: 'sent' as const,
                messageId: info.messageId,
            });
        } else {
            return NextResponse.json({
                success: false,
                message: "Email sending failed - no message ID returned",
                emailStatus: 'failed' as const,
                error: "No message ID returned from SMTP server",
            });
        }
    } catch (error) {
        console.error("Error sending email:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            {
                success: false,
                message: "Failed to send email",
                emailStatus: 'failed' as const,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}
