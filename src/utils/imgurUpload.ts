interface ImgurResponse {
  data: {
    id: string;
    title: string | null;
    description: string | null;
    datetime: number;
    type: string;
    animated: boolean;
    width: number;
    height: number;
    size: number;
    views: number;
    bandwidth: number;
    vote: string | null;
    favorite: boolean;
    nsfw: boolean | null;
    section: string | null;
    account_url: string | null;
    account_id: number | null;
    is_ad: boolean;
    in_most_viral: boolean;
    has_sound: boolean;
    tags: string[];
    ad_type: number;
    ad_url: string;
    edited: string;
    in_gallery: boolean;
    deletehash: string;
    name: string;
    link: string;
  };
  success: boolean;
  status: number;
}

export async function uploadToImgur(base64Data: string): Promise<string> {
  try {
    // Remove data URL prefix if present
    const imageData = base64Data.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, '');

    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
        type: 'base64',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.data?.error || 'Failed to upload to Imgur');
    }

    const result: ImgurResponse = await response.json();

    if (!result.success) {
      throw new Error('Failed to upload image to Imgur');
    }

    // Return the direct image URL
    return result.data.link;
  } catch (error) {
    console.error('Error uploading to Imgur:', error);
    throw error;
  }
} 