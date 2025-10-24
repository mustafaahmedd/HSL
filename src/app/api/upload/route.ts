import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { extractFiles, saveFiles, validateFile } from '@/lib/upload';

// POST - Upload files
export async function POST(request: NextRequest) {
  try {
    // Check authentication for uploads
    const isAuth = await isAuthenticated(request);
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const category = formData.get('category') as string || 'general';
    const files = extractFiles(formData, 'files');

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate files before uploading
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    // Save files
    const uploadedFiles = await saveFiles(files, category);

    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles.map(file => ({
        originalName: file.originalName,
        filename: file.filename,
        url: file.url,
        size: file.size,
        mimetype: file.mimetype
      }))
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET - Get upload configuration
export async function GET(request: NextRequest) {
  return NextResponse.json({
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg', 'image/webp'],
    categories: ['events', 'players', 'registrations', 'auctions', 'general']
  });
}
