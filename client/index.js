import './index.css';

console.log('Hello, world!');



// First, stop the CSS animations initially by adding a class
document.addEventListener('DOMContentLoaded', () => {
  const cardElements = document.querySelectorAll('.hero > div:nth-of-type(2) ul li');
  cardElements.forEach(card => {
    card.style.animationPlayState = 'paused';
  });

  // Set up our text animation system
  const textArray = [
    "Wolves playing in a zoo",
    "Wolves biting each other",
    "2 wolves chilling in a forest",
    "Wolf staring at his prey",
    "A wolf pack growling in the snow"
  ];
  const sections = document.querySelectorAll('.hero section');

  // Constants for timing - these should match your CSS animation steps
  const CARD_CYCLE_DURATION = 25000; // 25s to match your CSS animation
  const CARDS_COUNT = 5;
  const SECTION_DURATION = CARD_CYCLE_DURATION / CARDS_COUNT; // 5s per card/section

  const typingDuration = 1000;  // 1s
  const displayPause = 3500;    // 3.5s
  const erasingDuration = 500;  // 0.5s

  // Function to type text character by character
  function typeText(element, text, currentChar = 0, typingSpeed) {
    if (currentChar === 0) {
      element.textContent = '"';
    }

    if (currentChar < text.length) {
      element.textContent = '"' + text.substring(0, currentChar + 1) + '"';
      setTimeout(() => typeText(element, text, currentChar + 1, typingSpeed), typingSpeed);
    } else {
      // Fully typed, pause before erasing
      setTimeout(() => eraseText(element, text), displayPause);
    }
  }

  // Function to erase text
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
      // We don't call showNextSection here anymore,
      // the main timer will handle section transitions
    };

    eraseStep();
  }

  // Show a specific section and start typing
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

  // Initialize synchronized animation system
  let currentSectionIndex = 0;

  // Start both animations at the same time
  function startSynchronizedAnimations() {
    // Start CSS animations
    cardElements.forEach(card => {
      card.style.animationPlayState = 'running';
    });

    // Initial text animation
    showSection(0);

    // Set up the master timer that drives everything
    setInterval(() => {
      currentSectionIndex = (currentSectionIndex + 1) % sections.length;
      showSection(currentSectionIndex);
    }, SECTION_DURATION);
  }

  // Start everything
  startSynchronizedAnimations();
});














// game.js - Client-side game logic
document.addEventListener('DOMContentLoaded', () => {
  // Get all images from the data attribute we'll add to the container
  const allImages = JSON.parse(document.getElementById('game-container').dataset.images);
  let unusedImages = [...allImages]; // Clone the array to track unused images
  let currentImages = []; // Will store the current 4 images
  let correctImageIndex = -1; // Index of the correct image in currentImages

  const altDisplayElement = document.getElementById('alt-display');
  const imageGrid = document.getElementById('image-grid');
  const resultDialog = document.getElementById('result-dialog');
  const dialogContent = document.getElementById('dialog-content');
  const continueButton = document.getElementById('continue-button');
  const exitButton = document.getElementById('exit-button');

  // Start the game
  startNewRound();

  // Function to start a new round
  function startNewRound() {
    // If we have less than 4 unused images, reset the unused images pool
    if (unusedImages.length < 4) {
      unusedImages = [...allImages];
    }

    // Randomly select 4 images from unused images
    currentImages = [];
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * unusedImages.length);
      currentImages.push(unusedImages[randomIndex]);
      // Remove the selected image from unusedImages
      unusedImages.splice(randomIndex, 1);
    }

    // Randomly select one of the 4 images as the correct one
    correctImageIndex = Math.floor(Math.random() * 4);
    const correctImage = currentImages[correctImageIndex];

    // Display the alt text to match
    altDisplayElement.textContent = correctImage.alt_description || "No description available";

    // Clear and populate the image grid
    imageGrid.innerHTML = '';
    currentImages.forEach((image, index) => {
      const listItem = document.createElement('li');
      const button = document.createElement('button');
      const img = document.createElement('img');

      img.src = image.urls.regular;
      img.alt = "Game image";

      button.appendChild(img);
      button.addEventListener('click', () => handleImageClick(index));

      listItem.appendChild(button);
      imageGrid.appendChild(listItem);
    });
  }

  // Function to handle image clicks
  // Function to handle image clicks
  function handleImageClick(clickedIndex) {
    const clickedImage = currentImages[clickedIndex];
    const isCorrect = clickedIndex === correctImageIndex;

    // Prepare dialog content
    let content = `
    <div class="dialog-inner">
      <div>
        <small>You guessed:</small>
        <h2>${isCorrect ? 'Correct' : 'Incorrect'}</h2>
        <div>
          <button id="continue-button" class="close-modal">Continue Playing</button>
          <button id="exit-button" class="close-modal">Exit game</button>
        </div>
      </div>
      <ul class="photo-info">
        <li><strong>Description:</strong> ${clickedImage.alt_description || 'No description available'}</li>
        <li><strong>Photographer:</strong> ${clickedImage.user.name}</li>
        <li><strong>Location:</strong> ${clickedImage.location?.name || 'Unknown'}</li>
        <li><strong>Likes:</strong> ${clickedImage.likes}</li>
        <li><strong>Created:</strong> ${new Date(clickedImage.created_at).toLocaleDateString()}</li>
        <li><strong>ID:</strong> ${clickedImage.id}</li>
      </ul>
      <img src="${clickedImage.urls.regular}" alt="${clickedImage.alt_description || 'Image'}">
    </div>
  `;

    dialogContent.innerHTML = content;
    resultDialog.showModal();

    // Need to reattach event listeners since we replaced the HTML
    document.getElementById('continue-button').addEventListener('click', () => {
      resultDialog.close();
      startNewRound();
    });

    document.getElementById('exit-button').addEventListener('click', () => {
      resultDialog.close();
      window.location.href = document.getElementById('game-container').dataset.previousPage;
    });
  }
});