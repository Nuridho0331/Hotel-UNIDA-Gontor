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

    const amenities = await prisma.amenity.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            roomTypes: true,
          },
        },
      },
    });

    return NextResponse.json(amenities);
  } catch (error) {
    console.error("GET AMENITIES ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil fasilitas." },
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
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { message: "Nama fasilitas wajib diisi." },
        { status: 400 }
      );
    }

    const existingAmenity = await prisma.amenity.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingAmenity) {
      return NextResponse.json(
        { message: "Fasilitas tersebut sudah tersedia." },
        { status: 409 }
      );
    }

    const amenity = await prisma.amenity.create({
      data: {
        name,
      },
    });

    return NextResponse.json(
      {
        message: "Fasilitas berhasil ditambahkan.",
        amenity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE AMENITY ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menambahkan fasilitas." },
      { status: 500 }
    );
  }
}