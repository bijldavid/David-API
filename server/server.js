import 'dotenv/config';
import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { Liquid } from 'liquidjs';
import sirv from 'sirv';


// .env variables
const {
  UNSPLASH_ACCESS_KEY,
  NODE_ENV = 'production',
  PORT = 3000
} = process.env;

// Liquid template engine
const engine = new Liquid({
  extname: '.liquid',
});

// Helper functie om steeds de NODE ENV toe te voegen
function renderTemplate(template, data) {
  const templateData = {
    NODE_ENV,
    ...data
  };
  return engine.renderFileSync(template, templateData);
};

// Variable voor alle images
let globalImageCollection = null;
const collectionId = '6vTF-IB0SOQ';

/**
 * Functie roept fecthcollectionimages aan tenzij zolang hij null is
 * @param {number} pages - Number of pages to fetch
 * @returns {Promise<Array>} - Photos array
 */
async function getGlobalImages(pages = 3) {
  if (!globalImageCollection) {
    globalImageCollection = await fetchCollectionImages(pages);
  }

  return globalImageCollection;
}

/**
 * Functie om plaatjes uit de Unsplash API op te halen
 * @param {number} pages - Number of photos per page
 * @returns {Promise<Array>} - Photos array
 */
async function fetchCollectionImages(pages) {
  let allImages = [];

  for (let page = 1; page <= pages; page++) {
    const url = `https://api.unsplash.com/collections/${collectionId}/photos?per_page=30&page=${page}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    const pageData = await response.json();

    // allImages = [...allImages, ...pageData];
    // Alle nieuwe pageData wordt achteraan de allPhots array toegevoegd
    allImages.push(...pageData);
  }

  return allImages;
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

    // In const subcategory worden alle keys geplaatst en in keywords alle values
    for (const [subcategory, keywords] of Object.entries(keywordsMap)) {
      // Als een subcategory al in de foundCategory array zit, ga dan door naar de volgende
      if (foundCategories[subcategory]) continue;

      // Als een van de keywords in de alt text description zit, dan runt de if statement
      // Some = als er minstents 1 overeenkomt
      if (keywords.some(keyword => description.includes(keyword))) {
        foundCategories[subcategory] = true;
        resultImages.push({
          ...image,
          category: subcategory,
          displayName: subcategory.charAt(0).toUpperCase() + subcategory.slice(1)
        });
        // Stop wanneer we de juiste category hebben gevonden
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

// Home route
app.get('/', async (request, response) => {

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




// Game route
app.get('/game/:subcategory', async (request, response) => {

  const subcategory = request.params.subcategory.toLowerCase();

  const allImages = await getGlobalImages();

  // Voor alle fotos die ik heb, return true / false 
  const filteredImages = allImages.filter(image => {
    if (!image.alt_description) return false;

    const description = image.alt_description.toLowerCase();
    // De const keywords bevat de array met alle keywords van de huidige subcategory
    const keywords = subCategoryKeywords[subcategory] || [];

    return keywords.some(keyword => description.includes(keyword));
  })

  // Op alle images die zijn overgebleven, voeg category toe aan elke foto
  const subcategoryImages = filteredImages.map(image => ({
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
