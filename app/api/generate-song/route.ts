import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/db'
import { geminiManager } from '@/lib/gemini-manager'

export async function POST(request: NextRequest) {
  try {
    await geminiManager.initialize()

    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Get all analyzed assets
    const assets = dbHelpers.getAnalyzedAssets() as any[]

    const availableSamples = (assets || []).map(asset => ({
      filename: asset.filename,
      description: asset.description || '',
      category: asset.category || 'other',
      tags: asset.tags ? JSON.parse(asset.tags) : [],
    }))

    // Generate song arrangement
    const result = await geminiManager.generateSong(prompt, availableSamples)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate song' },
        { status: 500 }
      )
    }

    // Parse JSON response
    let songData
    try {
      const jsonMatch = result.data.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        songData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError: any) {
      return NextResponse.json(
        { error: `Failed to parse song data: ${parseError.message}` },
        { status: 500 }
      )
    }

    // Save to database
    try {
      const savedSong = dbHelpers.addSong({
        prompt,
        bpm: songData.bpm,
        duration_seconds: songData.duration_seconds,
        structure: songData.structure,
        sounds_used: songData.sounds_used,
        melody_description: songData.melody_description,
        song_data: songData,
        status: 'completed',
      })

      return NextResponse.json({
        success: true,
        song: savedSong,
      })
    } catch (saveError) {
      console.error('Error saving song:', saveError)
      return NextResponse.json(
        { error: 'Failed to save song' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Song generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Song generation failed' },
      { status: 500 }
    )
  }
}
