import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "../../../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// EDIT ROOM TYPE
export async function PATCH(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;
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

    const currentRoomType = await prisma.roomType.findUnique({
      where: {
        id,
      },
    });

    if (!currentRoomType) {
      return NextResponse.json(
        { message: "Tipe kamar tidak ditemukan." },
        { status: 404 }
      );
    }

    const duplicateName = await prisma.roomType.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
    });

    if (duplicateName) {
      return NextResponse.json(
        { message: "Nama tipe kamar sudah digunakan." },
        { status: 409 }
      );
    }

    const updatedRoomType = await prisma.roomType.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        capacity,
        basePrice,
        image: image || null,
      },
    });

    return NextResponse.json({
      message: "Tipe kamar berhasil diperbarui.",
      roomType: updatedRoomType,
    });
  } catch (error) {
    console.error("UPDATE ROOM TYPE ERROR:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui tipe kamar." },
      { status: 500 }
    );
  }
}

// DELETE ROOM TYPE
export async function DELETE(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const roomType = await prisma.roomType.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });

    if (!roomType) {
      return NextResponse.json(
        { message: "Tipe kamar tidak ditemukan." },
        { status: 404 }
      );
    }

    // Proteksi: jangan hapus RoomType yang sudah punya unit kamar
    if (roomType._count.rooms > 0) {
      return NextResponse.json(
        {
          message:
            "Tipe kamar tidak dapat dihapus karena sudah memiliki unit kamar.",
        },
        { status: 409 }
      );
    }

    await prisma.roomType.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Tipe kamar berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE ROOM TYPE ERROR:", error);

    return NextResponse.json(
      { message: "Gagal menghapus tipe kamar." },
      { status: 500 }
    );
  }
}