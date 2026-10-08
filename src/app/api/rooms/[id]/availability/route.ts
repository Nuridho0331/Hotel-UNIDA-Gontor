import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const BLOCKING_RESERVATION_STATUSES = [
  "PENDING_DP",
  "WAITING_DP_VERIFICATION",
  "CONFIRMED",
  "CHECKED_IN",
] as const;

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const { searchParams } = new URL(request.url);

    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const guests = Number(searchParams.get("guests"));

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        {
          message:
            "Tanggal check-in dan check-out wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(guests) || guests < 1) {
      return NextResponse.json(
        {
          message: "Jumlah tamu tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (
      !datePattern.test(checkIn) ||
      !datePattern.test(checkOut)
    ) {
      return NextResponse.json(
        {
          message: "Format tanggal tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    // Kita simpan tanggal hotel secara konsisten
    // menggunakan UTC midnight.
    const checkInDate = new Date(
      `${checkIn}T00:00:00.000Z`
    );

    const checkOutDate = new Date(
      `${checkOut}T00:00:00.000Z`
    );

    if (
      Number.isNaN(checkInDate.getTime()) ||
      Number.isNaN(checkOutDate.getTime())
    ) {
      return NextResponse.json(
        {
          message: "Tanggal tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        {
          message:
            "Tanggal check-out harus setelah tanggal check-in.",
        },
        {
          status: 400,
        }
      );
    }

    const roomType = await prisma.roomType.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
        capacity: true,
        basePrice: true,
      },
    });

    if (!roomType) {
      return NextResponse.json(
        {
          message: "Tipe kamar tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    if (guests > roomType.capacity) {
      return NextResponse.json(
        {
          message: `Tipe kamar ini maksimal untuk ${roomType.capacity} tamu.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
      Reservasi bentrok jika:

      existing.checkIn < requestedCheckOut
      DAN
      existing.checkOut > requestedCheckIn
    */

    const availableRooms = await prisma.room.findMany({
      where: {
        roomTypeId: id,

        // Secara operasional kamar harus VACANT
        status: "VACANT",

        // Tidak boleh punya reservasi aktif yang overlap
        reservations: {
          none: {
            status: {
              in: [
                ...BLOCKING_RESERVATION_STATUSES,
              ],
            },

            checkIn: {
              lt: checkOutDate,
            },

            checkOut: {
              gt: checkInDate,
            },
          },
        },
      },

      select: {
        id: true,
        roomNumber: true,
      },

      orderBy: {
        roomNumber: "asc",
      },
    });

    const nights = Math.round(
      (checkOutDate.getTime() -
        checkInDate.getTime()) /
        DAY_IN_MS
    );

    const totalPrice =
      nights * roomType.basePrice;

    return NextResponse.json({
      available: availableRooms.length > 0,

      availableCount: availableRooms.length,

      nights,

      basePrice: roomType.basePrice,

      totalPrice,

      roomType: {
        id: roomType.id,
        name: roomType.name,
        capacity: roomType.capacity,
      },
    });
  } catch (error) {
    console.error(
      "CHECK ROOM AVAILABILITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Gagal memeriksa ketersediaan kamar.",
      },
      {
        status: 500,
      }
    );
  }
}