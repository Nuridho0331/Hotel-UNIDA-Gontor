import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/prisma";

// GET semua tipe kamar
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const roomTypes = await prisma.roomType.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });

    return NextResponse.json(roomTypes);
  } catch (error) {
    console.error("GET ROOM TYPES ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data tipe kamar." },
      { status: 500 }
    );
  }
}

// CREATE tipe kamar
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const capacity = Number(body.capacity);
    const basePrice = Number(body.basePrice);
    const image = String(body.image ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { message: "Nama tipe kamar wajib diisi." },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { message: "Deskripsi kamar wajib diisi." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      return NextResponse.json(
        { message: "Kapasitas kamar tidak valid." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(basePrice) || basePrice < 1) {
      return NextResponse.json(
        { message: "Harga kamar tidak valid." },
        { status: 400 }
      );
    }

    const existingRoomType = await prisma.roomType.findUnique({
      where: {
        name,
      },
    });

    if (existingRoomType) {
      return NextResponse.json(
        { message: "Tipe kamar dengan nama tersebut sudah ada." },
        { status: 409 }
      );
    }

    const roomType = await prisma.roomType.create({
      data: {
        name,
        description,
        capacity,
        basePrice,
        image: image || null,
      },
    });

    return NextResponse.json(
      {
        message: "Tipe kamar berhasil ditambahkan.",
        roomType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE ROOM TYPE ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menambahkan tipe kamar." },
      { status: 500 }
    );
  }
}