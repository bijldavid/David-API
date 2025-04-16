import 'dotenv/config';
import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { Liquid } from 'liquidjs';
import sirv from 'sirv';

// Environment variables
const {
  UNSPLASH_ACCESS_KEY,
  NODE_ENV = 'production',
  PORT = 3000
} = process.env;

// Initialize Liquid template engine
const engine = new Liquid({
  extname: '.liquid',
});

// Helper function to render templates
const renderTemplate = (template, data) => {
  const templateData = {
    NODE_ENV,
    ...data
  };
  return engine.renderFileSync(template, templateData);
};

// Global image collection to avoid redundant API calls
let globalImageCollection = null;

/**
 * Get images from global cache or fetch if not available
 * @param {string} collectionId - ID of the Unsplash collection
 * @param {number} pages - Number of pages to fetch
 * @returns {Promise<Array>} - Photos array
 */
async function getGlobalImages(collectionId, pages = 3) {
  // Only fetch if we don't already have the images
  if (!globalImageCollection) {
    console.log('Fetching images from Unsplash (first time)');
    globalImageCollection = await fetchCollectionImages(collectionId, pages);
  } else {
    console.log('Reusing already fetched images');
  }
  
  return globalImageCollection;
}

/**
 * Fetch photos from a specific Unsplash collection
 * @param {string} collectionId - ID of the Unsplash collection
 * @param {number} perPage - Number of photos per page
 * @returns {Promise<Array>} - Photos array
 */
const fetchCollectionImages = async (collectionId, pages = 3) => {
  let allPhotos = [];

  for (let page = 1; page <= pages; page++) {
    const url = `https://api.unsplash.com/collections/${collectionId}/photos?per_page=30&page=${page}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    const pageData = await response.json();

    // Only push if it's actually an array
    if (Array.isArray(pageData)) {
      allPhotos = [...allPhotos, ...pageData];
    }
  }

  return allPhotos;
};

const categoryKeywords = {
  // Animal subcategories
  'wolves': ['wolf', 'wolves', 'canine', 'canid', 'lupus'],
  'lions': ['lion', 'lions', 'lioness', 'big cat', 'panthera leo', 'feline'],
  'bears': ['bear', 'bears', 'grizzly', 'polar bear', 'ursus', 'cub', 'teddy'],
  'frogs': ['frog', 'frogs', 'toad', 'toads', 'amphibian', 'tadpole'],
  'fish': ['fish', 'fishes', 'trout', 'salmon', 'aquatic', 'underwater', 'marine'],
  'birds': ['bird', 'birds', 'avian', 'feathered', 'fowl', 'owl', 'eagle', 'hawk', 'parrot', 'duck'],
  
  // Food subcategories
  'burgers': ['burger', 'beef', 'patty', 'fastfood', 'burgers'],
  'pizzas': ['italian', 'pizza', 'pizzas', 'margherita', 'pepperoni'],
  'pastas': ['pasta', 'pastas', 'bolognese', 'carbonara', 'salad'],
  'bread': ['bread', 'slices', 'loaf', 'baked', 'baguette', 'dough'],
  'meat': ['meat', 'raw', 'steak', 'grilled', 'sliced', 'cut'],
  'fries': ['fries', 'potato', 'french']
};

// Category mappings to determine main category from subcategory
const mainCategories = {
  'wolves': 'animals',
  'lions': 'animals',
  'bears': 'animals',
  'frogs': 'animals',
  'fish': 'animals',
  'birds': 'animals',
  
  'burgers': 'food',
  'pizzas': 'food',
  'pastas': 'food',
  'bread': 'food',
  'meat': 'food',
  'fries': 'food'
};

/**
 * Find images that match keywords for specific categories
 * @param {Array} images - Array of image objects
 * @param {Object} keywordsMap - Map of categories to keywords
 * @returns {Array} - Filtered and categorized images
 */
function findImagesByKeywords(images, keywordsMap) {
  const foundCategories = {};
  const resultImages = [];

  images.forEach(image => {
    if (!image.alt_description) return;

    const description = image.alt_description.toLowerCase();

    for (const [category, keywords] of Object.entries(keywordsMap)) {
      if (foundCategories[category]) continue;

      if (keywords.some(keyword => description.includes(keyword))) {
        foundCategories[category] = true;
        resultImages.push({
          ...image,
          category: category,
          displayName: category.charAt(0).toUpperCase() + category.slice(1)
        });
        break;
      }
    }
  });
  return resultImages;
}

// Initialize application
const app = new App();

// Configure middleware
app.use(logger());
app.use('/', sirv(NODE_ENV === 'development' ? 'client' : 'dist'));

// Home route - shows categories
app.get('/', async (req, res) => {
  const collectionId = '6vTF-IB0SOQ';
  // Use global image collection
  const allImages = await getGlobalImages(collectionId, 3);

  console.log(`Using ${allImages.length} images from collection`);

  // Extract animal and food categories from the same collection
  const animalKeywords = {
    'wolves': categoryKeywords['wolves'],
    'lions': categoryKeywords['lions'],
    'bears': categoryKeywords['bears'],
    'frogs': categoryKeywords['frogs'],
    'fish': categoryKeywords['fish'],
    'birds': categoryKeywords['birds']
  };

  const foodKeywords = {
    'burgers': categoryKeywords['burgers'],
    'pizzas': categoryKeywords['pizzas'],
    'pastas': categoryKeywords['pastas'],
    'bread': categoryKeywords['bread'],
    'meat': categoryKeywords['meat'],
    'fries': categoryKeywords['fries']
  };

  const animalImages = findImagesByKeywords(
    allImages.filter(img => img.alt_description), 
    animalKeywords
  );

  const foodImages = findImagesByKeywords(
    allImages.filter(img => img.alt_description),
    foodKeywords
  );

  return res.send(renderTemplate('server/views/index.liquid', {
    title: 'Home',
    animalImages: animalImages,
    foodImages: foodImages
  }));
});

// Game route - shows specific subcategory
app.get('/game/:subcategory', async (req, res) => {
  const subcategory = req.params.subcategory.toLowerCase();
  const mainCategory = mainCategories[subcategory] || 'unknown';
  
  // Use global image collection
  const collectionId = '6vTF-IB0SOQ';
  const allImages = await getGlobalImages(collectionId, 3);
  
  // Get images for this specific subcategory
  const subcategoryImages = allImages.filter(image => {
    if (!image.alt_description) return false;
    
    const description = image.alt_description.toLowerCase();
    const keywords = categoryKeywords[subcategory] || [];
    
    return keywords.some(keyword => description.includes(keyword));
  }).map(image => ({
    ...image,
    category: subcategory,
    displayName: subcategory.charAt(0).toUpperCase() + subcategory.slice(1)
  }));
  
  return res.send(renderTemplate('server/views/game.liquid', {
    title: `${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)} Game`,
    category: subcategory,
    mainCategory: mainCategory,
    images: subcategoryImages,
    previousPage: req.headers.referer || '/'
  }));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server available on http://localhost:${PORT}`);
});