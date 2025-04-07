import 'dotenv/config';
import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { Liquid } from 'liquidjs';
import sirv from 'sirv';

// API key gekoppeld vanuit .env
const key = process.env.key;

let pexelsData;

const fetchPexels = async () => {
  try {
    const url = "https://api.pexels.com/v1/search?query=people";

    const response = await fetch(url, {
      headers: {
        'Authorization': key
      }
    });

    // Zet de data uit de API om in .json 
    pexelsData = await response.json();
    console.log(pexelsData);
    console.log('pexelDataCollected');
    return pexelsData;
  } catch (error) {
    console.error("Error fetching pexels:", error);
    return [];
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
  const pexelData = await fetchPexels();
  console.log(pexelsData)

  return res.send(renderTemplate('server/views/index.liquid', { title: 'Home', images: pexelData }));
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
