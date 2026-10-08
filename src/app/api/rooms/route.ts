import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const roomTypes = await prisma.roomType.findMany({
      orderBy: {
        basePrice: "asc",
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

    const data = roomTypes.map((roomType) => ({
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
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET PUBLIC ROOMS ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil data kamar.",
      },
      {
        status: 500,
      }
    );
  }
}