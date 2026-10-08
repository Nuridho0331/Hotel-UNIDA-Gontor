import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const roomType = await prisma.roomType.findUnique({
      where: {
        id,
      },

      include: {
        amenities: {
          include: {
            amenity: true,
          },
        },

        _count: {
          select: {
            rooms: true,
          },
        },
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

    const data = {
      id: roomType.id,
      name: roomType.name,
      description: roomType.description,
      capacity: roomType.capacity,
      basePrice: roomType.basePrice,
      image: roomType.image,
      totalUnits: roomType._count.rooms,

      amenities: roomType.amenities.map(
        (item) => item.amenity.name
      ),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET ROOM DETAIL ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil detail kamar.",
      },
      {
        status: 500,
      }
    );
  }
}