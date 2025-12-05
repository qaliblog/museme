import { NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/db'

export async function GET() {
  try {
    const songs = dbHelpers.getAllSongs()
    return NextResponse.json(songs || [])
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
