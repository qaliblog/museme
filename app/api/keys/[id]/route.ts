import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    try {
      dbHelpers.deleteApiKey(id)
      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Error deleting key:', error)
      return NextResponse.json(
        { error: 'Failed to delete API key' },
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { is_active } = await request.json()

    try {
      dbHelpers.updateApiKey(id, { is_active: !!is_active })
      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Error updating key:', error)
      return NextResponse.json(
        { error: 'Failed to update API key' },
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
