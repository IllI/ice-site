import { NextResponse } from 'next/server';
import { uploadToImgur } from '@/utils/imgurUpload';

export async function POST(request: Request) {
  try {
    const { base64Data } = await request.json();

    if (!base64Data) {
      return NextResponse.json(
        { error: 'Missing image data' },
        { status: 400 }
      );
    }

    const imageUrl = await uploadToImgur(base64Data);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error in Imgur upload route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    );
  }
} 