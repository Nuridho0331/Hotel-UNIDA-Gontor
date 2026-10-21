
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "../../../../../lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: Context
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (session.user.role !== "USER") {
      return NextResponse.json(
        {
          message:
            "Detail reservasi pribadi hanya untuk tamu.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const reservation = await prisma.reservation.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        bookingCode: true,
        checkIn: true,
        checkOut: true,
        guestCount: true,
        totalPrice: true,
        dpAmount: true,
        status: true,
        createdAt: true,
        room: {
          select: {
            roomNumber: true,
            roomType: {
              select: {
                name: true,
                image: true,
                capacity: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            type: true,
            amount: true,
            method: true,
            status: true,
            proofImage: true,
            paidAt: true,
            verifiedAt: true,
            notes: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { message: "Reservasi tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { reservation },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET RESERVATION DETAIL ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil detail reservasi." },
      { status: 500 }
    );
  }
}
