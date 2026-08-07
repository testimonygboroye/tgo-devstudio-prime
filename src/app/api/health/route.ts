import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const mongooseInstance = await connectToDatabase();
    const readyState = mongooseInstance.connection.readyState;

    return NextResponse.json({
      status: "ok",
      database: readyState === 1 ? "connected" : "not connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    );
  }
}
