import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/prisma";

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

    const rooms = await prisma.room.findMany({
      include: {
        roomType: true,
      },
      orderBy: {
        roomNumber: "asc",
      },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("GET ROOMS ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data kamar." },
      { status: 500 }
    );
  }
}

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

    const roomNumber = String(body.roomNumber ?? "").trim();
    const floor = String(body.floor ?? "").trim();
    const roomTypeId = String(body.roomTypeId ?? "").trim();

    if (!roomNumber) {
      return NextResponse.json(
        { message: "Nomor kamar wajib diisi." },
        { status: 400 }
      );
    }

    if (!roomTypeId) {
      return NextResponse.json(
        { message: "Tipe kamar wajib dipilih." },
        { status: 400 }
      );
    }

    const existingRoom = await prisma.room.findUnique({
      where: {
        roomNumber,
      },
    });

    if (existingRoom) {
      return NextResponse.json(
        { message: "Nomor kamar sudah digunakan." },
        { status: 409 }
      );
    }

    const roomType = await prisma.roomType.findUnique({
      where: {
        id: roomTypeId,
      },
    });

    if (!roomType) {
      return NextResponse.json(
        { message: "Tipe kamar tidak ditemukan." },
        { status: 404 }
      );
    }

    const room = await prisma.room.create({
      data: {
        roomNumber,
        floor: floor || null,
        roomTypeId,

        // status otomatis VACANT dari schema Prisma
      },

      include: {
        roomType: true,
      },
    });

    return NextResponse.json(
      {
        message: "Unit kamar berhasil ditambahkan.",
        room,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE ROOM ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menambahkan unit kamar." },
      { status: 500 }
    );
  }
}