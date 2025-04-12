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

/**
 * Fetch photos from a specific Unsplash collection
 * @param {string} collectionId - ID of the Unsplash collection
 * @param {number} perPage - Number of photos per page
 * @returns {Promise<{photos: Array}>} - Photos array
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







// Initialize application
const app = new App();

// Configure middleware
app.use(logger());
app.use('/', sirv(NODE_ENV === 'development' ? 'client' : 'dist'));





// Add this function before your route definition
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

  console.log(`Found ${resultImages.length} images for categories: ${Object.keys(foundCategories).join(', ')}`);
  return resultImages;
}





app.get('/', async (req, res) => {
  const collectionId = '6vTF-IB0SOQ';
  // Single API fetch
  const allImages = await fetchCollectionImages(collectionId, 3);

  console.log(`Fetched ${allImages.length} images from Unsplash`);

  // Define all your keyword sets
  const animalKeywords = {
    'wolves': ['wolf', 'wolves', 'canine', 'canid', 'lupus'],
    'lions': ['lion', 'lions', 'lioness', 'big cat', 'panthera leo', 'feline'],
    'bears': ['bear', 'bears', 'grizzly', 'polar bear', 'ursus', 'cub', 'teddy'],
    'frogs': ['frog', 'frogs', 'toad', 'toads', 'amphibian', 'tadpole'],
    'fish': ['fish', 'fishes', 'trout', 'salmon', 'aquatic', 'underwater', 'marine'],
    'birds': ['bird', 'birds', 'avian', 'feathered', 'fowl', 'owl', 'eagle', 'hawk', 'parrot', 'duck']
  };

  const foodKeywords = {
    'burgers': ['burger', 'beef', 'patty', 'fastfood', 'burgers'],
    'pizzas': ['italian', 'pizza', 'pizzas', 'margherita', 'pepperoni'],
    'pastas': ['pasta', 'pastas', 'bolognese', 'carbonara', 'salad'],
    'bread': ['bread', 'slices', 'loaf', 'baked', 'baguette', 'dough'],
    'meat': ['meat', 'raw', 'steak', 'grilled', 'sliced', 'cut'],
    'fries': ['fries', 'potato', 'french']
  };

  // Extract both sets from the same image collection
  // Run these filters separately
  const animalImages = findImagesByKeywords(
    allImages.filter(img => img.alt_description), // Only use images with descriptions
    animalKeywords
  );

  const foodImages = findImagesByKeywords(
    allImages.filter(img => img.alt_description), // Only use images with descriptions
    foodKeywords
  );

  return res.send(renderTemplate('server/views/index.liquid', {
    title: 'Home',
    animalImages: animalImages,
    foodImages: foodImages
  }));
});









function getImagesByCategory(category, allImages) {
  return allImages.filter(image =>
    image.category === category ||
    (image.alt_description && image.alt_description.toLowerCase().includes(category))
  );
}


app.get('/game/:category', async (req, res) => {
  const category = req.params.category;

  // Fetch all images first
  const collectionId = '6vTF-IB0SOQ';
  const allImages = await fetchCollectionImages(collectionId, 3);

  // Get images for this specific category
  let categoryImages;

  if (category === 'animals') {
    const animalKeywords = {
      'wolves': ['wolf', 'wolves', 'canine', 'canid', 'lupus'],
      'lions': ['lion', 'lions', 'lioness', 'big cat', 'panthera leo', 'feline'],
      'bears': ['bear', 'bears', 'grizzly', 'polar bear', 'ursus', 'cub', 'teddy'],
      'frogs': ['frog', 'frogs', 'toad', 'toads', 'amphibian', 'tadpole'],
      'fish': ['fish', 'fishes', 'trout', 'salmon', 'aquatic', 'underwater', 'marine'],
      'birds': ['bird', 'birds', 'avian', 'feathered', 'fowl', 'owl', 'eagle', 'hawk', 'parrot', 'duck']
    };
    categoryImages = findImagesByKeywords(allImages, animalKeywords);
  } else if (category === 'food') {
    const foodKeywords = {
      'burgers': ['burger', 'beef', 'patty', 'fastfood', 'burgers'],
      'pizzas': ['italian', 'pizza', 'pizzas', 'margherita', 'pepperoni'],
      'pastas': ['pasta', 'pastas', 'bolognese', 'carbonara', 'salad'],
      'bread': ['bread', 'slices', 'loaf', 'baked', 'baguette', 'dough'],
      'meat': ['meat', 'raw', 'steak', 'grilled', 'sliced', 'cut'],
      'fries': ['fries', 'potato', 'french']
    };
    categoryImages = findImagesByKeywords(allImages, foodKeywords);
  } else {
    categoryImages = [];
  }

  // Use your render function instead of res.render
  return res.send(renderTemplate('server/views/game.liquid', {
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} Game`,
    category: category,
    images: categoryImages,
    previousPage: req.headers.referer || '/'
  }));
});



// Start server
app.listen(PORT, () => {
  console.log(`Server available on http://localhost:${PORT}`);
});