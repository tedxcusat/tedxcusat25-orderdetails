import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Order, normalizeOrder } from "@/app/types/order";

// Initialize R2 Client
const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

export async function GET() {
    try {
        // List all objects in the orders/ prefix
        const listCommand = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
            Prefix: "orders/",
        });

        const listResponse = await r2.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return NextResponse.json({ success: true, orders: [] });
        }

        // Fetch each order JSON file
        const orders: Order[] = await Promise.all(
            listResponse.Contents.filter(obj => obj.Key?.endsWith('.json')).map(async (obj) => {
                const getCommand = new GetObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: obj.Key,
                });

                const response = await r2.send(getCommand);
                const bodyString = await response.Body?.transformToString();

                if (bodyString) {
                    const rawOrder = JSON.parse(bodyString);
                    // Normalize order to handle legacy data without status field
                    return normalizeOrder(rawOrder);
                }
                return null;
            })
        ).then(results => results.filter((order): order is Order => order !== null));

        // Sort by timestamp (newest first)
        orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({
            success: true,
            orders,
            total: orders.length,
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
