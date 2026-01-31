import { NextRequest, NextResponse } from 'next/server';
import { getLogById, getLogsByParentId, deleteLog } from '@/lib/store';

// GET /api/logs/[id] - Get a single log by ID with its nested children
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const log = getLogById(id);
    
    if (!log) {
      return NextResponse.json(
        { error: 'Log not found' },
        { status: 404 }
      );
    }
    
    // Get all nested logs (children of this log)
    const children = getLogsByParentId(id);
    
    return NextResponse.json({
      ...log,
      children: children
    });
  } catch (error) {
    console.error('Error fetching log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch log' },
      { status: 500 }
    );
  }
}

// DELETE /api/logs/[id] - Delete a specific log and its children
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deletedCount = deleteLog(id);
    
    return NextResponse.json({ 
      success: true, 
      deleted: deletedCount 
    });
  } catch (error) {
    console.error('Error deleting log:', error);
    return NextResponse.json(
      { error: 'Failed to delete log' },
      { status: 500 }
    );
  }
}
