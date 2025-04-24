// import './index.css';

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// HOMEPAGE ANIMATIE (DOOR AI)
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

document.addEventListener('DOMContentLoaded', () => {
  const cardElements = document.querySelectorAll('.hero > div:nth-of-type(2) ul li');
  cardElements.forEach(card => {
    card.style.animationPlayState = 'paused';
  });

  const textArray = [
    "Wolves playing in a zoo",
    "Wolves biting each other",
    "2 wolves chilling in a forest",
    "Wolf staring at his prey",
    "A wolf pack growling in the snow"
  ];
  const sections = document.querySelectorAll('.hero section');

  const CARD_CYCLE_DURATION = 25000;
  const CARDS_COUNT = 5;
  const SECTION_DURATION = CARD_CYCLE_DURATION / CARDS_COUNT;

  const typingDuration = 1000;
  const displayPause = 3500;
  const erasingDuration = 500;

  function typeText(element, text, currentChar = 0, typingSpeed) {
    if (currentChar === 0) {
      element.textContent = '"';
    }

    if (currentChar < text.length) {
      element.textContent = '"' + text.substring(0, currentChar + 1) + '"';
      setTimeout(() => typeText(element, text, currentChar + 1, typingSpeed), typingSpeed);
    } else {
      setTimeout(() => eraseText(element, text), displayPause);
    }
  }

  function eraseText(element, text) {
    const totalChars = text.length;
    const erasingSpeed = erasingDuration / totalChars;

    const eraseStep = () => {
      const currentText = element.textContent;
      const textWithoutQuotes = currentText.substring(1, currentText.length - 1);

      if (textWithoutQuotes.length > 0) {
        element.textContent = '"' + textWithoutQuotes.slice(0, -1) + '"';
        setTimeout(eraseStep, erasingSpeed);
      }
    };

    eraseStep();
  }

  function showSection(index) {
    sections.forEach(section => {
      section.style.display = 'none';
    });

    const section = sections[index];
    section.style.display = 'block';

    const typingElement = section.querySelector('.typing');
    typingElement.textContent = '';

    const text = textArray[index];
    const chars = text.length;
    const typingSpeed = typingDuration / chars;

    typeText(typingElement, text, 0, typingSpeed);
  }

  let currentSectionIndex = 0;

  function startSynchronizedAnimations() {
    cardElements.forEach(card => {
      card.style.animationPlayState = 'running';
    });

    showSection(0);

    setInterval(() => {
      currentSectionIndex = (currentSectionIndex + 1) % sections.length;
      showSection(currentSectionIndex);
    }, SECTION_DURATION);
  }

  startSynchronizedAnimations();
});













// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// CLIENT SIDE GAME LOGIC
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

document.addEventListener('DOMContentLoaded', () => {
  // Get all images from the data attribute we'll add to the container
  const allImages = JSON.parse(document.getElementById('game-container').dataset.images);
  let unusedImages = [...allImages];
  let currentImages = [];
  let correctImageIndex = null;

  // Score bijhouden variable
  let streak = Number(sessionStorage.getItem('streak')) || 0;
  let correctAnswers = Number(sessionStorage.getItem('correctAnswers')) || 0;
  let wrongAnswers = Number(sessionStorage.getItem('wrongAnswers')) || 0;


  // DOM elements
  const altDisplayElement = document.getElementById('alt-display');
  const imageGrid = document.getElementById('image-grid');
  const resultDialog = document.getElementById('result-dialog');
  const dialogContent = document.getElementById('dialog-content');
  const categoryTitle = document.getElementById('category-title')

  // Score elements
  const streakElement = document.querySelector('footer h3:nth-child(1) .break');
  const correctElement = document.querySelector('footer h3:nth-child(2) .break');
  const wrongElement = document.querySelector('footer h3:nth-child(3) .break');

  // Begin de game
  startNewRound();
  updateScoreDisplay();

  function updateScoreDisplay() {
    streakElement.textContent = streak;
    correctElement.textContent = correctAnswers;
    wrongElement.textContent = wrongAnswers;
  }


  function startNewRound() {
    // Zodra er minder dan 4 images zijn, reset de image pool
    if (unusedImages.length < 4) {
      unusedImages = [...allImages];
    }

    // ik kies random 1 image uit unusedimages en die zet ik in currentimages. Die haal ik uit unusedimages en dat doe ik 4x
    currentImages = [];
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * unusedImages.length);
      currentImages.push(unusedImages[randomIndex]);
      unusedImages.splice(randomIndex, 1);
    }

    // Kies 1 van de 4 currentImage
    correctImageIndex = Math.floor(Math.random() * 4);
    const correctImage = currentImages[correctImageIndex];


    categoryTitle.textContent = correctImage.category.charAt(0).toUpperCase() + correctImage.category.slice(1);
    altDisplayElement.textContent = `"${correctImage.alt_description}"`;

    // Vullen we de image grid
    imageGrid.innerHTML = '';
    currentImages.forEach((image, index) => {
      const listItem = document.createElement('li');
      const button = document.createElement('button');
      const img = document.createElement('img');

      img.src = image.urls.regular;
      img.alt = "Game image";

      button.appendChild(img);
      // index geeft mee welke image geklikt is
      button.addEventListener('click', () => handleImageClick(index));

      listItem.appendChild(button);
      imageGrid.appendChild(listItem);
    });
  }

  // Checken of de geklikte waarde klopt met de random gekoze waarde
  function handleImageClick(clickedIndex) {
    const clickedImage = currentImages[clickedIndex];
    const isCorrect = clickedIndex === correctImageIndex;

    // update de score van de gebruiker
    if (isCorrect) {
      streak++;
      correctAnswers++;
    } else {
      streak = 0;
      wrongAnswers++;
    }

    updateScoreDisplay();

    // Opslaan in de session storage
    sessionStorage.setItem('streak', streak);
    sessionStorage.setItem('correctAnswers', correctAnswers);
    sessionStorage.setItem('wrongAnswers', wrongAnswers);


    // Dynamische dialog met data over het geklikte plaatje
    let content = `
    <div class="dialog-inner">
      <div>
        <small>You guessed:</small>
        <h2>${isCorrect ? 'Correct' : 'Incorrect'}</h2>
        <div>
          <button id="exit-button" class="close-modal">Exit game</button>
          <button id="continue-button" class="close-modal">Continue Playing</button>
        </div>
      </div>
      <ul class="photo-info">
        <li><small>Photographer: ${clickedImage.user.name}</small></li>
        <li><small>Location: ${clickedImage.location?.name || 'Unknown'}</small></li>
        <li><small>Likes: ${clickedImage.likes}</small></li>
        <li><small>Created: ${new Date(clickedImage.created_at).toLocaleDateString()}</small></li>
        <li><small>ID: ${clickedImage.id}</small></li>
      </ul>
      <img src="${clickedImage.urls.full}" alt="${clickedImage.alt_description || 'Image'}">
    </div>
  `;

    dialogContent.innerHTML = content;
    resultDialog.showModal();


    // Als er geen returnValue wordt meegegeven dan triggered deze event
    resultDialog.addEventListener('close', (event) => {
      if (!event.currentTarget.returnValue) {
        startNewRound();
      }
    });

    document.getElementById('continue-button').addEventListener('click', () => {
      resultDialog.returnValue = 'continue';
      resultDialog.close();
      startNewRound();
    });

    document.getElementById('exit-button').addEventListener('click', () => {
      resultDialog.returnValue = 'exit';
      resultDialog.close();
      window.location.href = document.getElementById('game-container').dataset.previousPage;
    });
  }
});


// view transition
document.addEventListener('navigate', () => {
  if (!document.startViewTransition) {
      return
  } else {
      document.startViewTransition(() => {
          console.log('View transition started');
      })
  }
})