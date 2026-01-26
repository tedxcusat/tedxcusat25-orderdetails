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

function generateReferralCode() {
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

    const code = generateReferralCode();
    const filename = `referrals/ref-${code}.json`;
    const createdAt = new Date().toISOString();

    const referralData = {
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
        Body: JSON.stringify(referralData, null, 2),
        ContentType: "application/json",
      })
    );

    return NextResponse.json({
      success: true,
      code,
      message: "Referral code generated successfully",
    });
  } catch (error) {
    console.error("Error creating referral:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create referral code" },
      { status: 500 }
    );
  }
}
