import { NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/db'
import { geminiManager } from '@/lib/gemini-manager'

export async function POST() {
  try {
    await geminiManager.initialize()

    // Get all unanalyzed assets
    const assets = dbHelpers.getUnanalyzedAssets() as any[]

    if (!assets || assets.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No unanalyzed assets found',
      })
    }

    let analyzedCount = 0

    // Analyze each asset
    for (const asset of assets) {
      try {
        const result = await geminiManager.analyzeSound(
          asset.filename,
          asset.file_type
        )

        if (result.success && result.data) {
          // Parse JSON response
          let analysisData
          try {
            // Extract JSON from response (handle cases where AI adds extra text)
            const jsonMatch = result.data.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              analysisData = JSON.parse(jsonMatch[0])
            } else {
              throw new Error('No JSON found in response')
            }
          } catch (parseError) {
            console.error('Error parsing analysis response:', parseError)
            continue
          }

          // Update asset with analysis
          try {
            dbHelpers.updateAsset(asset.id, {
              description: analysisData.description,
              category: analysisData.category,
              tags: analysisData.tags || [],
              analyzed: true,
              analysis_prompt: `Analyze this audio file: ${asset.filename}`,
              analysis_response: result.data,
            })
            analyzedCount++
          } catch (updateError) {
            console.error('Error updating asset:', updateError)
            continue
          }
        }
      } catch (error: any) {
        console.error(`Error analyzing ${asset.filename}:`, error)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      count: analyzedCount,
      message: `Analyzed ${analyzedCount} of ${assets.length} assets`,
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    )
  }
}
