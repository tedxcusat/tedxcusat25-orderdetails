import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

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
      discountValue: body.discountValue || 0,
      discountType: body.discountType || "fixed",
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
      url: `https://tedxcusat.in/merch?ref=${code}`,
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

export async function GET() {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: "referrals/",
    });

    const listResponse = await r2.send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return NextResponse.json({ success: true, referrals: [] });
    }

    const referrals = await Promise.all(
      listResponse.Contents.filter((obj) => obj.Key?.endsWith(".json")).map(
        async (obj) => {
          try {
            const getCommand = new GetObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: obj.Key,
            });

            const response = await r2.send(getCommand);
            const bodyString = await response.Body?.transformToString();

            if (bodyString) {
              return JSON.parse(bodyString);
            }
            return null;
          } catch (error) {
            console.warn(`Skipping referral file ${obj.Key}:`, error);
            return null;
          }
        }
      )
    );

    const validReferrals = referrals
      .filter((r) => r !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      referrals: validReferrals,
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}
