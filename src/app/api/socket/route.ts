import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return new NextResponse('WebSocket endpoint - use Socket.io client to connect', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Socket.io endpoint ready' })
}