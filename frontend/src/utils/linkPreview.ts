export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
  siteName?: string;
}

// Backend API endpoint for link previews
const LINK_PREVIEW_API = '/api/link-preview/preview';

export const extractLinkPreviews = async (content: string): Promise<LinkPreview[]> => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex);

  if (!urls) return [];

  const uniqueUrls = Array.from(new Set(urls));

  try {
    const previews = await Promise.all(
      uniqueUrls.map(async (url) => {
        try {
          const response = await fetch(`${LINK_PREVIEW_API}?url=${encodeURIComponent(url)}`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const preview = await response.json();
          
          return {
            url: preview.url,
            title: preview.title,
            description: preview.description || '',
            image: preview.image,
            siteName: preview.siteName
          } as LinkPreview;
        } catch (error) {
          console.error(`Error fetching preview for ${url}:`, error);
          // Return basic URL info on error
          try {
            const urlObj = new URL(url);
            return {
              url,
              title: urlObj.hostname,
              description: '',
              image: undefined,
              siteName: urlObj.hostname
            };
          } catch {
            return null;
          }
        }
      })
    );

    return previews.filter((preview): preview is LinkPreview => preview !== null);
  } catch (error) {
    console.error('Error extracting link previews:', error);
    return [];
  }
};