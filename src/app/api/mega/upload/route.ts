import { NextResponse } from 'next/server';
import { Storage } from 'megajs';
import { File } from 'megajs';

export async function POST(request: Request) {
  try {
    const { filename, base64Data, credentials } = await request.json();

    // Validate inputs
    if (!filename || !base64Data) {
      console.error('Missing required fields:', { filename: !!filename, base64Data: !!base64Data });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!credentials?.email || !credentials?.password) {
      console.error('Missing Mega credentials');
      return NextResponse.json(
        { error: 'Missing Mega credentials' },
        { status: 400 }
      );
    }

    // Create a buffer from base64
    const buffer = Buffer.from(base64Data, 'base64');
    console.log('Buffer created successfully, size:', buffer.length);

    console.log('Initializing Mega storage...');
    // Initialize Mega storage
    const storage = new Storage({
      email: credentials.email,
      password: credentials.password,
    });

    console.log('Waiting for Mega connection...');
    // Wait for connection
    await storage.ready;
    console.log('Mega connection established successfully');

    console.log('Uploading file to Mega...');
    // Upload file
    const file = await storage.upload(filename, buffer).complete;
    console.log('File uploaded successfully');

    console.log('Getting file URL...');
    // Get the file URL with the encryption key included
    const fileUrl = await file.link({ noKey: false });
    console.log('File URL generated successfully:', fileUrl);

    // Extract file ID and key from the Mega URL
    const [, fileId, fileKey] = fileUrl.match(/file\/([^#]+)#(.+)$/) || [];
    
    if (!fileId || !fileKey) {
      throw new Error('Failed to extract file ID and key from URL');
    }

    // Get direct download URL using the download method
    const downloadInfo = await file.download({ returnCiphertext: false });
    const downloadUrl = downloadInfo.url;
    console.log('Direct download URL:', downloadUrl);

    return NextResponse.json({ 
      fileUrl,
      downloadUrl,
      fileId,
      fileKey
    });
  } catch (error) {
    console.error('Detailed error in mega upload:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
} 