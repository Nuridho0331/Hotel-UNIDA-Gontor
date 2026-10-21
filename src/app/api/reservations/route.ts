import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

const BLOCKING_STATUSES = [
  "PENDING_DP",
  "WAITING_DP_VERIFICATION",
  "CONFIRMED",
  "CHECKED_IN",
] as const;

function generateBookingCode() {
  const now = new Date();

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const random = randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `HUG-${date}-${random}`;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Silakan login terlebih dahulu.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const roomTypeId = String(
      body.roomTypeId ?? ""
    ).trim();

    const checkIn = String(
      body.checkIn ?? ""
    ).trim();

    const checkOut = String(
      body.checkOut ?? ""
    ).trim();

    const guestCount = Number(
      body.guestCount
    );

    if (
      !roomTypeId ||
      !checkIn ||
      !checkOut
    ) {
      return NextResponse.json(
        {
          message: "Data reservasi belum lengkap.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1
    ) {
      return NextResponse.json(
        {
          message: "Jumlah tamu tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(checkIn) || !pattern.test(checkOut)) {
      return NextResponse.json({ message: "Format tanggal harus YYYY-MM-DD." }, { status: 400 });
    }

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

    if (checkInDate.toISOString().slice(0, 10) !== checkIn ||
        checkOutDate.toISOString().slice(0, 10) !== checkOut) {
      return NextResponse.json({ message: "Tanggal reservasi tidak valid." }, { status: 400 });
    }
    const today = new Date();
    const localToday = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(today);
    if (checkIn < localToday) {
      return NextResponse.json({ message: "Tanggal check-in tidak boleh di masa lalu." }, { status: 400 });
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        {
          message:
            "Tanggal check-out harus setelah check-in.",
        },
        {
          status: 400,
        }
      );
    }

    const roomType =
      await prisma.roomType.findUnique({
        where: {
          id: roomTypeId,
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

    if (guestCount > roomType.capacity) {
      return NextResponse.json(
        {
          message: `Kapasitas maksimal kamar ini ${roomType.capacity} tamu.`,
        },
        {
          status: 400,
        }
      );
    }

    const DAY =
      1000 * 60 * 60 * 24;

    const nights = Math.round(
      (checkOutDate.getTime() -
        checkInDate.getTime()) /
        DAY
    );

    const totalPrice =
      nights * roomType.basePrice;

    const dpSetting =
      await prisma.systemSetting.findUnique({
        where: {
          key: "BOOKING_DP_AMOUNT",
        },
      });

    const dpAmount = Number(
      dpSetting?.value ?? "100000"
    );

    if (
      !Number.isInteger(dpAmount) ||
      dpAmount <= 0
    ) {
      return NextResponse.json(
        {
          message: "Konfigurasi DP tidak valid.",
        },
        {
          status: 500,
        }
      );
    }

    // Lock per tipe kamar selama pemeriksaan dan pembuatan reservasi.
    // Mencegah dua request memilih unit yang sama secara bersamaan pada PostgreSQL.
    const reservation = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${roomTypeId}))`;

      const availableRoom = await tx.room.findFirst({
        where: {
          roomTypeId,
          status: "VACANT",
          reservations: {
            none: {
              status: { in: [...BLOCKING_STATUSES] },
              checkIn: { lt: checkOutDate },
              checkOut: { gt: checkInDate },
            },
          },
        },
        orderBy: { roomNumber: "asc" },
      });
      if (!availableRoom) return null;

      let bookingCode = generateBookingCode();
      while (await tx.reservation.findUnique({ where: { bookingCode } })) {
        bookingCode = generateBookingCode();
      }

      return tx.reservation.create({
        data: {
          bookingCode,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guestCount,
          totalPrice,
          dpAmount,
          status: "PENDING_DP",
          userId: session.user.id,
          roomId: availableRoom.id,
          payments: {
            create: { type: "DP", amount: dpAmount, status: "UNPAID" },
          },
        },
        include: { room: { include: { roomType: true } }, payments: true },
      });
    });

    if (!reservation) {
      return NextResponse.json(
        { message: "Kamar sudah tidak tersedia untuk tanggal tersebut." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: "Reservasi berhasil dibuat.",

        reservation: {
          id: reservation.id,
          bookingCode:
            reservation.bookingCode,

          checkIn:
            reservation.checkIn,

          checkOut:
            reservation.checkOut,

          guestCount:
            reservation.guestCount,

          nights,

          totalPrice:
            reservation.totalPrice,

          dpAmount:
            reservation.dpAmount,

          status:
            reservation.status,

          room: {
            id: reservation.room.id,

            roomNumber:
              reservation.room.roomNumber,

            roomType:
              reservation.room.roomType.name,
          },
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE RESERVATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "Gagal membuat reservasi.",
      },
      {
        status: 500,
      }
    );
  }
}
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const reservations = await prisma.reservation.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        bookingCode: true,
        checkIn: true,
        checkOut: true,
        totalPrice: true,
        status: true,
        room: { select: { roomNumber: true, roomType: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      { reservations },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("LIST USER RESERVATIONS ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil riwayat reservasi." }, { status: 500 });
  }
}
