# API <br> David Bijl

<br>
<br>
<br>

> ## Week 1
> **<sub><sup>31 mar t/m 4 apr</sup></sub>**

**Opdracht omschrijving:** <br>
In dit vak zullen we een van de meest voorkomende app-concepten van vandaag gebruiken en ontdekken dat we deze kunnen maken met moderne webtechnologie met als doel om een rijke gebruikerservaring creëeren.<br><br>

Aan het begin van deze week heb ik een content API gekozen, en gekeken welke andere web API’s ik kon gebruiken. Na wat rond te kijken ben ik uitgekomen op de Pexels API. 

**Mijn concept:** <br>
Ik maak een relatief simpele en leuke game die mooi weergeeft dat een goede alt tag schrijven lang niet zo makkelijk is als het lijkt.
Je ziet steeds vier plaatjes en één korte beschrijving. Kies het plaatje dat het beste bij de tekst past. Zo leer je hoe belangrijk alt-tekst is, vooral voor mensen die een screenreader gebruiken. De game houdt je score bij en geeft je een streak als je meerdere keren goed raadt. Elke ronde heeft nieuwe beelden en teksten, dus het blijft afwisselend én leerzaam.
Een leuke manier om het web toegankelijker te maken voor iedereen!<br>

Om die score bij te houden wil ik local storage gebruiken. Daarnaast wil ik ook de View Transitions API inzetten om soepele overgangen tussen pagina’s te maken. Voor de layout ben ik begonnen met een ontwerp in Adobe XD.<br><br>
<img src="./readme-images/start-page.png" width="426" height="460">
<img src="./readme-images/game-page.png" width="426" height="460">
<img src="./readme-images/detail-page.png" width="426" height="460"><br>
Het design is vrij basic: een startpagina, een gamepagina en een detailpagina. Op de startpagina krijgt de gebruiker een korte uitleg en kan hij een categorie kiezen.

---

<br>
<br>
<br>

> ## Week 2
> **<sub><sup>7 t/m 11 apr</sup></sub>**

Deze week ben ik begonnen met het opzetten van `server.js`, waaronder het koppelen van de Pexels API. Hiervoor moest ik een account aanmaken en een gratis API key aanvragen. Die heb ik netjes in een `.env` bestand gezet zodat hij niet op GitHub komt te staan.

De documentatie van Pexels was duidelijk. Bijvoorbeeld:<br>

``` js
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.pexels.com/v1/search?query=people"
```

Dit in the authorization header plaatsen.
En kon ik met deze url een fecth request aanmaken `GET https://api.pexels.com/v1/...`

De JSON-data die ik terugkreeg heb ik in mijn home route meegegeven aan Liquid om ze op de pagina weer te geven:<br>

``` html
<ul>
    {% for image in images %}
        <li>
            <p>{{ image.displayName | capitalize }}</p>
            <img src="{{ image.urls.regular }}" alt="{{ image.alt_description }}">
        </li>
    {% endfor %}
</ul>
```

Daarnaast heb ik alvast de statische HTML en CSS geschreven voor de verschillende pagina’s, gebaseerd op mijn designs. Dat vind ik minder lastig dan de logica, dus dan kan ik me later beter focussen op de functionaliteit.

Daarna begon ik met het fetchen van de plaatjes. De gebruiker kan kiezen uit categorieën als dieren, voedsel, gebouwen, enzovoort.. met daarbinnen weer subcategorieën. Uiteindelijk had ik zo'n 30 subcategorieën en dus 30 fetch-requests gemaakt. Tijdens een feedbackmoment met Declan bleek dat dat geen goed idee was. Door die vele requests liep ik snel tegen de rate limit van Pexels aan. Zijn tip: kijk of je alles in één fetch kunt regelen.

---

<br>
<br>
<br>

> ## Week 3
> **<sub><sup>14 t/m 17 apr</sup></sub>**

In week 3 ben ik op zoek gegaan naar een slimmere manier om minder requests te doen. Helaas biedt Pexels geen optie om in één keer een algemene fetch te doen. Je moet altijd een query opgeven, wat al snel te specifiek wordt. Er is wel een `curated` optie, maar die gaf me niet de resultaten die ik wilde.

Tijdens het feedbackmoment tipte Cyd mij over de Unsplash API. Die werkt grotendeels hetzelfde als Pexels, maar met één belangrijk voordeel: je kunt je eigen collectie aanmaken. Zo heb ik één collectie gevuld met alle plaatjes die ik nodig had, en kon ik die makkelijk ophalen.

Daarna ging ik verder met de logica in `server.js`. Een belangrijk onderdeel was een filter-systeem. Ik haalde alle foto's in één keer op, maar wilde ze filteren op subcategorieën. Dat deed ik op basis van de alt-tags, met behulp van dit object:

``` js
const subCategoryKeywords = {
    // Animals
    'wolves': ['wolf', 'wolves', 'canine', 'canid', 'lupus'],
    'lions': ['lion', 'lions', 'lioness', 'big cat', 'panthera leo', 'feline'],
    'bears': ['bear', 'bears', 'grizzly', 'polar bear', 'ursus', 'cub', 'teddy'],
    'frogs': ['frog', 'frogs', 'toad', 'toads', 'amphibian', 'tadpole'],
    'fish': ['fish', 'fishes', 'trout', 'salmon', 'aquatic', 'underwater', 'marine'],
    'birds': ['bird', 'birds', 'avian', 'feathered', 'fowl', 'owl', 'eagle', 'hawk', 'parrot', 'duck'],

    // Food
    'burgers': ['burger', 'beef', 'patty', 'fastfood', 'burgers'],
    'pizzas': ['italian', 'pizza', 'pizzas', 'margherita', 'pepperoni'],
    'pastas': ['pasta', 'pastas', 'bolognese', 'carbonara', 'salad'],
    'bread': ['bread', 'slices', 'loaf', 'baked', 'baguette', 'dough'],
    'meat': ['meat', 'raw', 'steak', 'grilled', 'cut'],
    'fries': ['fries', 'potato', 'french']
};
```

Die mapping gebruik ik later in mijn code om te filteren op relevante plaatjes.


---

<br>
<br>
<br>

> ## Week 4
> **<sub><sup>22 t/m 25 apr</sup></sub>**

De laatste week stond in het teken van client-side JavaScript: het bouwen van de game-logica. Om data van de server naar de client te krijgen, stop ik die in een HTML-attribuut:

```html 
<div class="game-container" id="game-container" data-images="{{ images | json | escape }}" data-previous-page="{{ previousPage }}">
```

En aan de client-side lees ik dat zo uit:

```js
const allImages = JSON.parse(document.getElementById('game-container').dataset.images);
```

Naast de game-logica heb ik ook een animatie gemaakt voor de homepage. Die wilde ik eigenlijk in CSS-only doen (typewriter effect), maar meerdere regels animeren bleek lastig. Uiteindelijk heb ik de animatie met AI laten maken. Hier een voorbeeld van een werkende CSS-only versie op één regel:<br>
<a href="https://codepen.io/Dave-deo/pen/YPzmeYB?editors=1100">Codepen - type animation</a>

Tot slot hebben we de app gedeployed via Render.com. Na wat geknutsel is het gelukt!
Check de app hier: <a href="https://david-api-ffwo.onrender.com/">Alt=Match</a>

---

<br>
<br>
<br>

> ## Bronnen

<ul>
    <li>https://github.com/bijlpieter (uitleg van mijn broer)</li>
    <li>ChatGPT</li>
    <li>https://unsplash.com/documentation</li>
    <li>https://www.pexels.com/api/documentation</li>
</ul>

---