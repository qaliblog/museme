import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { dbHelpers } from '@/lib/db'
import { getFileMetadata, extractZipWithJSZip, ensureUploadDir } from '@/lib/file-utils'
import { isAudioFile } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir()

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = file.name
    const ext = filename.split('.').pop()?.toLowerCase()

    let savedFiles: string[] = []

    // Handle ZIP files (RAR support requires additional library)
    if (ext === 'zip') {
      try {
        const extractedFiles = await extractZipWithJSZip(buffer)
        savedFiles = extractedFiles

        // Save metadata for each extracted file
        for (const filePath of extractedFiles) {
          const metadata = await getFileMetadata(filePath)
          
          if (isAudioFile(metadata.filename)) {
            const relativePath = filePath.replace(process.cwd(), '').replace(/^\//, '')
            
            try {
              dbHelpers.addAsset({
                filename: metadata.filename,
                file_type: metadata.fileType,
                file_size: metadata.fileSize,
                file_path: relativePath,
              })
            } catch (error) {
              console.error('Error saving metadata:', error)
            }
          }
        }
      } catch (error: any) {
        console.error('Error extracting archive:', error)
        return NextResponse.json(
          { error: `Failed to extract archive: ${error.message}` },
          { status: 500 }
        )
      }
    } else if (ext === 'rar') {
      return NextResponse.json(
        { error: 'RAR file support coming soon. Please use ZIP format.' },
        { status: 400 }
      )
    } else {
      // Handle individual audio files
      const uploadDir = join(process.cwd(), 'uploads', 'assets')
      await mkdir(uploadDir, { recursive: true })
      
      const filePath = join(uploadDir, filename)
      await writeFile(filePath, buffer)
      savedFiles = [filePath]

      const metadata = await getFileMetadata(filePath)
      const relativePath = filePath.replace(process.cwd(), '').replace(/^\//, '')

      try {
        dbHelpers.addAsset({
          filename: metadata.filename,
          file_type: metadata.fileType,
          file_size: metadata.fileSize,
          file_path: relativePath,
        })
      } catch (error: any) {
        console.error('Error saving metadata:', error)
        return NextResponse.json(
          { error: 'Failed to save file metadata' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Uploaded ${savedFiles.length} file(s)`,
      files: savedFiles.length,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
