import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/db'

export async function GET() {
  try {
    const keys = dbHelpers.getApiKeys()
    return NextResponse.json(keys || [])
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    try {
      const savedKey = dbHelpers.addApiKey(key)
      return NextResponse.json({
        success: true,
        key: savedKey,
      })
    } catch (error: any) {
      console.error('Error adding key:', error)
      return NextResponse.json(
        { error: 'Failed to add API key' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
