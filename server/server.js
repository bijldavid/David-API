import 'dotenv/config';
import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { Liquid } from 'liquidjs';
import sirv from 'sirv';

// API key gekoppeld vanuit .env
const key = process.env.key;

let pexelsData;

const fetchPexels = async (query = "animals", pages = 5) => {
  try {
    let allPhotos = [];

    // Fetch multiple pages
    for (let page = 1; page <= pages; page++) {
      const url = `https://api.pexels.com/v1/search?query=${query}&per_page=80&page=${page}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': key
        }
      });

      const data = await response.json();
      
      // Add photos from this page to the allPhotos array
      allPhotos = [...allPhotos, ...data.photos];
    }

    return { photos: allPhotos };
  } catch (error) {
    console.error("Error fetching from Pexels:", error);
    return { photos: [] };
  }
};






const engine = new Liquid({
  extname: '.liquid',
});

const app = new App();

app
  .use(logger())
  .use('/', sirv(process.env.NODE_ENV === 'development' ? 'client' : 'dist'))
  .listen(3000, () => console.log('Server available on http://localhost:3000'));

app.get('/', async (req, res) => {
  const query = req.query.query || 'animals'; // Default to 'animals' if no query is provided
  const filterKeyword = req.query.filter || 'wolf'; // Default to 'wolf' if no filter is provided

  const pexelData = await fetchPexels(query);
  // const pexelData = await fetchPexels('animals', 5);

  // Filter images by alt tag if a filter keyword is set
  const filteredImages = pexelData.photos.filter(photo => {
    const alt = (photo.alt || '').toLowerCase();
    return alt.includes(filterKeyword.toLowerCase());
  });

  return res.send(renderTemplate('server/views/index.liquid', {
    title: 'Home',
    images: filteredImages // Pass filtered images to the template
  }));
});











// voor detail pagina
app.get('/plant/:id/', async (req, res) => {
  const id = req.params.id;
  const item = data[id];
  if (!item) {
    return res.status(404).send('Not found');
  }
  return res.send(renderTemplate('server/views/detail.liquid', {
    title: `Detail page for ${id}`,
    item: item
  }));
});

const renderTemplate = (template, data) => {
  const templateData = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    ...data
  };

  return engine.renderFileSync(template, templateData);
};
