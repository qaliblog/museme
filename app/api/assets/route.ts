import { NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/db'

export async function GET() {
  try {
    const assets = dbHelpers.getAllAssets()
    
    // Parse tags from JSON string
    const parsedAssets = assets.map((asset: any) => ({
      ...asset,
      tags: asset.tags ? JSON.parse(asset.tags) : [],
      analyzed: asset.analyzed === 1,
    }))

    return NextResponse.json(parsedAssets)
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
