import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client(
  import.meta.env.VITE_GOOGLE_CLIENT_ID,
  import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  import.meta.env.VITE_GOOGLE_REDIRECT_URI
);

// Initialize the Google Slides API client
const slides = google.slides({ version: 'v1', auth: oauth2Client });

export const createGoogleSlides = async (title: string, content: any[]) => {
  try {
    // Create a new presentation
    const presentation = await slides.presentations.create({
      requestBody: {
        title: title
      }
    });

    const presentationId = presentation.data.presentationId;
    if (!presentationId) throw new Error('Failed to create presentation');

    // Create slides based on the provided content
    const requests = content.map((slide, index) => ({
      createSlide: {
        objectId: `slide_${index}`,
        insertionIndex: index,
        slideLayoutReference: {
          predefinedLayout: 'BLANK'
        },
        placeholderIdMappings: []
      }
    }));

    // Add content to slides
    content.forEach((slide, index) => {
      // Add title
      if (slide.title) {
        requests.push({
          insertText: {
            objectId: `slide_${index}`,
            insertionIndex: 0,
            text: slide.title
          }
        });
      }

      // Add content
      if (slide.content) {
        requests.push({
          insertText: {
            objectId: `slide_${index}`,
            insertionIndex: slide.title ? slide.title.length : 0,
            text: '\n\n' + slide.content
          }
        });
      }

      // Add image if present
      if (slide.image) {
        requests.push({
          createImage: {
            objectId: `image_${index}`,
            url: slide.image,
            elementProperties: {
              pageObjectId: `slide_${index}`,
              size: {
                height: { magnitude: 200, unit: 'PT' },
                width: { magnitude: 300, unit: 'PT' }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 100,
                translateY: 100,
                unit: 'PT'
              }
            }
          }
        });
      }
    });

    // Execute the requests to create and update slides
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: {
        requests
      }
    });

    return {
      presentationId,
      url: `https://docs.google.com/presentation/d/${presentationId}/edit`
    };
  } catch (error) {
    console.error('Error creating Google Slides:', error);
    throw error;
  }
};

export const updateGoogleSlides = async (presentationId: string, updates: any[]) => {
  try {
    const requests = updates.map(update => ({
      ...update,
      presentationId
    }));

    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: {
        requests
      }
    });
  } catch (error) {
    console.error('Error updating Google Slides:', error);
    throw error;
  }
};

export const getAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive.file'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
};

export const handleAuthCallback = async (code: string) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Error handling auth callback:', error);
    throw error;
  }
};