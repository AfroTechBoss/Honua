import express from 'express';
import { getLinkPreview } from 'link-preview-js';
import { supabase } from '../utils/supabaseClient';

const router = express.Router();

interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
  siteName?: string;
  timestamp: number;
}

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Utility function to handle image URL resolution
const resolveImageUrl = (imageUrl: string, baseUrl: string): string => {
  try {
    if (!imageUrl) return '';
    // Handle relative URLs
    if (imageUrl.startsWith('/')) {
      const baseUrlObj = new URL(baseUrl);
      return `${baseUrlObj.protocol}//${baseUrlObj.host}${imageUrl}`;
    }
    // Handle protocol-relative URLs
    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`;
    }
    // Return absolute URLs as-is
    return imageUrl;
  } catch {
    return '';
  }
};

// Get link preview with caching
router.get('/preview', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Check cache first
    const { data: cachedPreview } = await supabase
      .from('link_previews')
      .select('*')
      .eq('url', url)
      .single();

    // If we have a valid cached preview that's not expired, return it
    if (cachedPreview && Date.now() - cachedPreview.timestamp < CACHE_DURATION) {
      return res.json(cachedPreview);
    }

    // Fetch fresh preview with better error handling
    let preview;
    try {
      preview = await getLinkPreview(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        timeout: 10000 // 10 second timeout
      });
    } catch (previewError) {
      console.error('Error fetching link preview:', previewError);
      // Handle the error gracefully by falling back to basic URL info
      const urlObj = new URL(url);
      return res.json({
        url,
        title: urlObj.hostname,
        description: '',
        image: undefined,
        siteName: urlObj.hostname,
        timestamp: Date.now()
      });
    }

    let linkPreview: LinkPreview;

    if (preview && 'title' in preview) {
      linkPreview = {
        url,
        title: preview.title || new URL(url).hostname,
        description: preview.description || '',
        image: Array.isArray(preview.images) && preview.images.length > 0
          ? resolveImageUrl(preview.images[0], url)
          : undefined,
        siteName: preview.siteName || new URL(url).hostname,
        timestamp: Date.now()
      };
    } else {
      // Fallback to basic URL info
      const urlObj = new URL(url);
      linkPreview = {
        url,
        title: urlObj.hostname,
        description: '',
        image: undefined,
        siteName: urlObj.hostname,
        timestamp: Date.now()
      };
    }

    // Update cache
    await supabase
      .from('link_previews')
      .upsert(linkPreview, { onConflict: 'url' });

    res.json(linkPreview);
  } catch (error) {
    console.error('Error fetching link preview:', error);
    // Return basic URL info on error
    try {
      const urlObj = new URL(req.query.url as string);
      const fallbackPreview = {
        url: req.query.url,
        title: urlObj.hostname,
        description: '',
        image: undefined,
        siteName: urlObj.hostname,
        timestamp: Date.now()
      };
      res.json(fallbackPreview);
    } catch {
      res.status(500).json({ error: 'Failed to fetch link preview' });
    }
  }
});

export default router;