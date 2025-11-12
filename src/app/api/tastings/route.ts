import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

const createTastingSchema = z.object({
  wineCatalogId: z.string().optional(),
  wineId: z.string(),
  gameId: z.string().optional(),
  rating: z.number().min(1).max(10),
  comments: z.string().optional(),
  location: z.string().optional(),
  occasion: z.string().optional(),
})

// POST /api/tastings - Create a new tasting history entry
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { wineId, wineCatalogId, gameId, rating, comments, location, occasion } = createTastingSchema.parse(body)

    // Get the wine to find its catalog entry
    const wine = await prisma.wine.findUnique({
      where: { id: wineId },
      include: {
        catalog: true,
      },
    })

    if (!wine) {
      return NextResponse.json(
        { error: 'Wine not found' },
        { status: 404 }
      )
    }

    // Use the wine's catalog ID or the provided one
    const catalogId = wineCatalogId || wine.wineCatalogId

    if (!catalogId) {
      return NextResponse.json(
        { error: 'Wine catalog entry not found' },
        { status: 400 }
      )
    }

    // Create the tasting history entry
    const tasting = await prisma.tastingHistory.create({
      data: {
        userId: user.id,
        wineCatalogId: catalogId,
        wineId,
        gameId: gameId || null,
        rating,
        comments: comments || null,
        location: location || null,
        occasion: occasion || null,
      },
      include: {
        wine: true,
        game: true,
      },
    })

    return NextResponse.json({ tasting })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create tasting error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/tastings - Fetch user's tasting history with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const minRating = searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined
    const maxRating = searchParams.get('maxRating') ? parseInt(searchParams.get('maxRating')!) : undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build the where clause
    const where: any = {
      userId: user.id,
    }

    if (search) {
      where.wine = {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {}
      if (minRating !== undefined) where.rating.gte = minRating
      if (maxRating !== undefined) where.rating.lte = maxRating
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Build the orderBy clause
    const orderBy: any = {}
    if (sortBy === 'createdAt' || sortBy === 'rating') {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const tastings = await prisma.tastingHistory.findMany({
      where,
      orderBy,
      include: {
        wine: true,
        game: {
          select: {
            code: true,
            difficulty: true,
          },
        },
        gameWine: {
          select: {
            name: true,
            year: true,
          },
        },
      },
    })

    return NextResponse.json({ tastings })
  } catch (error) {
    console.error('Fetch tastings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
