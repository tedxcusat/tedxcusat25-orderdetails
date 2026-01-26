import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "TXC-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, dept, phone } = body;

    if (!name || !dept || !phone) {
      return NextResponse.json(
        { success: false, message: "Name, Department, and Phone are required" },
        { status: 400 }
      );
    }

    const code = generateCouponCode();
    // Use 'coupons/' path and 'coupon-' prefix as per original spec/existing app
    const filename = `coupons/coupon-${code}.json`;
    const createdAt = new Date().toISOString();

    const couponData = {
      code,
      referrer: {
        name,
        dept,
        phone,
      },
      createdAt,
    };

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        Body: JSON.stringify(couponData, null, 2),
        ContentType: "application/json",
      })
    );

    return NextResponse.json({
      success: true,
      code,
      message: "Coupon generated successfully",
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create coupon code" },
      { status: 500 }
    );
  }
}
