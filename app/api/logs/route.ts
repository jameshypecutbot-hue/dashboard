import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllLogs, 
  getTopLevelLogs, 
  getLogsBySessionId, 
  getLogsByParentId,
  createLog, 
  deleteAllLogs 
} from '@/lib/store';

// GET /api/logs - Get logs with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verbose = searchParams.get('verbose') === 'true';
    const sessionId = searchParams.get('sessionId');
    const parentId = searchParams.get('parentId');
    
    let logs;
    
    if (parentId) {
      // Get children of specific log
      logs = getLogsByParentId(parentId);
    } else if (sessionId) {
      // Get logs from specific session
      logs = getLogsBySessionId(sessionId);
    } else if (!verbose) {
      // Default: get only top-level logs
      logs = getTopLevelLogs();
    } else {
      // Verbose: get all logs
      logs = getAllLogs();
    }
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

// POST /api/logs - Create a new log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.message && !body.content) {
      return NextResponse.json(
        { error: 'message or content is required' },
        { status: 400 }
      );
    }
    
    const newLog = createLog(body);
    
    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json(
      { error: 'Failed to create log' },
      { status: 500 }
    );
  }
}

// DELETE /api/logs - Delete all logs
export async function DELETE() {
  try {
    deleteAllLogs();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting logs:', error);
    return NextResponse.json(
      { error: 'Failed to delete logs' },
      { status: 500 }
    );
  }
}
