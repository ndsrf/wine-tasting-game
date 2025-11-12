import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/wines/[catalogId]/stats - Get wine statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { catalogId: string } }
) {
  try {
    const { catalogId } = params

    // Get wine catalog info
    const wine = await prisma.wineCatalog.findUnique({
      where: { id: catalogId },
    })

    if (!wine) {
      return NextResponse.json(
        { error: 'Wine not found' },
        { status: 404 }
      )
    }

    // Get all tastings for this wine
    const tastings = await prisma.tastingHistory.findMany({
      where: { wineCatalogId: catalogId },
      select: {
        rating: true,
        createdAt: true,
      },
    })

    if (tastings.length === 0) {
      return NextResponse.json({
        wine,
        stats: {
          totalTastings: 0,
          averageRating: 0,
          ratingDistribution: {},
        },
      })
    }

    // Calculate statistics
    const totalTastings = tastings.length
    const totalRating = tastings.reduce((sum, t) => sum + t.rating, 0)
    const averageRating = totalRating / totalTastings

    // Rating distribution (1-10)
    const ratingDistribution: Record<number, number> = {}
    for (let i = 1; i <= 10; i++) {
      ratingDistribution[i] = 0
    }
    tastings.forEach((t) => {
      ratingDistribution[t.rating]++
    })

    return NextResponse.json({
      wine,
      stats: {
        totalTastings,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution,
      },
    })
  } catch (error) {
    console.error('Wine stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
