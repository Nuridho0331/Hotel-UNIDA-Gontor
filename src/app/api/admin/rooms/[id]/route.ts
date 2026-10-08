import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "../../../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedStatuses = [
  "VACANT",
  "OCCUPIED",
  "OUT_OF_ORDER",
] as const;

// EDIT UNIT KAMAR
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

    const roomNumber = String(body.roomNumber ?? "").trim();
    const floor = String(body.floor ?? "").trim();
    const roomTypeId = String(body.roomTypeId ?? "").trim();
    const status = String(body.status ?? "").trim();

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

    if (
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number]
      )
    ) {
      return NextResponse.json(
        { message: "Status kamar tidak valid." },
        { status: 400 }
      );
    }

    const currentRoom = await prisma.room.findUnique({
      where: {
        id,
      },
    });

    if (!currentRoom) {
      return NextResponse.json(
        { message: "Unit kamar tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pastikan nomor kamar tidak dipakai unit lain
    const duplicateRoomNumber =
      await prisma.room.findFirst({
        where: {
          roomNumber,
          NOT: {
            id,
          },
        },
      });

    if (duplicateRoomNumber) {
      return NextResponse.json(
        { message: "Nomor kamar sudah digunakan." },
        { status: 409 }
      );
    }

    // Pastikan RoomType valid
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

    const updatedRoom = await prisma.room.update({
      where: {
        id,
      },

      data: {
        roomNumber,
        floor: floor || null,
        roomTypeId,

        status:
          status as
            | "VACANT"
            | "OCCUPIED"
            | "OUT_OF_ORDER",
      },

      include: {
        roomType: true,
      },
    });

    return NextResponse.json({
      message: "Unit kamar berhasil diperbarui.",
      room: updatedRoom,
    });
  } catch (error) {
    console.error("UPDATE ROOM ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal memperbarui unit kamar.",
      },
      {
        status: 500,
      }
    );
  }
}

// DELETE UNIT KAMAR
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

    const room = await prisma.room.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { message: "Unit kamar tidak ditemukan." },
        { status: 404 }
      );
    }

    // Jangan hapus kamar yang sudah pernah dipakai reservasi
    if (room._count.reservations > 0) {
      return NextResponse.json(
        {
          message:
            "Unit kamar tidak dapat dihapus karena sudah memiliki data reservasi.",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.room.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Unit kamar berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE ROOM ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal menghapus unit kamar.",
      },
      {
        status: 500,
      }
    );
  }
}