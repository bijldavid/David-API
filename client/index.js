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
    "Wolf staring in a field",
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