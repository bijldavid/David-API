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
function renderTemplate(template, data) {
  const templateData = {
    NODE_ENV,
    ...data
  };
  return engine.renderFileSync(template, templateData);
};

// Global image collection to avoid redundant API calls
let globalImageCollection = null;
const collectionId = '6vTF-IB0SOQ';

/**
 * Get images from global cache or fetch if not available
 * @param {number} pages - Number of pages to fetch
 * @returns {Promise<Array>} - Photos array
 */
async function getGlobalImages(pages = 3) {
  // Only fetch if we don't already have the images
  if (!globalImageCollection) {
    globalImageCollection = await fetchCollectionImages(pages);
  }

  return globalImageCollection;
}

/**
 * Fetch photos from a specific Unsplash collection
 * @param {number} pages - Number of photos per page
 * @returns {Promise<Array>} - Photos array
 */
async function fetchCollectionImages(pages) {
  let allPhotos = [];

  for (let page = 1; page <= pages; page++) {
    const url = `https://api.unsplash.com/collections/${collectionId}/photos?per_page=30&page=${page}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    const pageData = await response.json();

    // allPhotos = [...allPhotos, ...pageData];
    allPhotos.push(...pageData);
  }

  return allPhotos;
};

const subCategoryKeywords = {
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
  'meat': ['meat', 'raw', 'steak', 'grilled', 'cut'],
  'fries': ['fries', 'potato', 'french']
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

    for (const [subcategory, keywords] of Object.entries(keywordsMap)) {
      if (foundCategories[subcategory]) continue;

      if (keywords.some(keyword => description.includes(keyword))) {
        foundCategories[subcategory] = true;
        resultImages.push({
          ...image,
          category: subcategory,
          displayName: subcategory.charAt(0).toUpperCase() + subcategory.slice(1)
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
app.get('/', async (request, response) => {
  // Use global image collection
  const allImages = await getGlobalImages();

  // Extract animal and food categories from the same collection
  const animalKeywords = {
    'wolves': subCategoryKeywords['wolves'],
    'lions': subCategoryKeywords['lions'],
    'bears': subCategoryKeywords['bears'],
    'frogs': subCategoryKeywords['frogs'],
    'fish': subCategoryKeywords['fish'],
    'birds': subCategoryKeywords['birds']
  };

  const foodKeywords = {
    'burgers': subCategoryKeywords['burgers'],
    'pizzas': subCategoryKeywords['pizzas'],
    'pastas': subCategoryKeywords['pastas'],
    'bread': subCategoryKeywords['bread'],
    'meat': subCategoryKeywords['meat'],
    'fries': subCategoryKeywords['fries']
  };

  const animalImages = findImagesByKeywords(allImages, animalKeywords);
  const foodImages = findImagesByKeywords(allImages, foodKeywords);

  return response.send(renderTemplate('server/views/index.liquid', {
    title: 'Home',
    animalImages: animalImages,
    foodImages: foodImages
  }));
});




// Game route - shows specific subcategory
app.get('/game/:subcategory', async (request, response) => {
  const subcategory = request.params.subcategory.toLowerCase();

  // Use global image collection
  const allImages = await getGlobalImages();

  // Get images for this specific subcategory
  const subcategoryImages = allImages.filter(image => {
    if (!image.alt_description) return false;

    const description = image.alt_description.toLowerCase();
    const keywords = subCategoryKeywords[subcategory] || [];

    return keywords.some(keyword => description.includes(keyword));
  }).map(image => ({
    ...image,
    category: subcategory,
  }));

  return response.send(renderTemplate('server/views/game.liquid', {
    title: `${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)} Game`,
    category: subcategory,
    images: subcategoryImages,
    previousPage: request.headers.referer || '/'
  }));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server available on http://localhost:${PORT}`);
});


// STAP 1: server begint met runnen (npm run dev)
// STAP 2: gebruiker gaat naar de homepage
// STAP 3: tinyhttp called de functie de home route
// STAP 4: in die functie halen we alle fotos op van unsplash API (homepage laat ook fotos zien)
// STAP 5: gebruiker kiest een categorie
// STAP 6: browser van gebruiker redirect de gebruiker naar /game/category
// STAP 7: tinyhttp called de game route
// STAP 8: deze route heeft alle fotos al
// STAP 9: we filteren alle fotos op deze category
// STAP 10: we geven alle fotos aan game.liquid
// STAP 11: liquid voegt alle fotos in een JSON in een attribuut van #game-container (dit wordt verstuurd naar de client)

// STAP 12: nu komen we bij de index.js, hier begint de game logic
// STAP 13: 
