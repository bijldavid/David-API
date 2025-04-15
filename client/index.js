import './index.css';

console.log('Hello, world!');



// Array of texts to type
const textArray = [
    "A wolf pack growling in the snow",
    "Moonlight dancing on calm water",
    "Ancient forest hiding many secrets",
    "Stars whispering tales of old times"
  ];
  
  // Get all sections
  const sections = document.querySelectorAll('section');
  let currentIndex = 0;
  
  // Typing speed and settings
  const typingSpeed = 100; // milliseconds per character
  const pauseBeforeErasing = 2000; // milliseconds to pause when text is fully typed
  const pauseBeforeNextSection = 500; // milliseconds to pause between sections
  
  // Function to type text character by character
  function typeText(element, text, currentChar = 0) {
    // Add opening quote immediately if this is the first character
    if (currentChar === 0) {
      element.textContent = '"';
    }
    
    if (currentChar < text.length) {
      // Add the next character of the actual text
      element.textContent = '"' + text.substring(0, currentChar + 1);
      
      // Always ensure the closing quote is present
      element.textContent += '"';
      
      setTimeout(() => typeText(element, text, currentChar + 1), typingSpeed);
    } else {
      // Text is fully typed (with quotes), wait before erasing
      setTimeout(() => eraseText(element, text), pauseBeforeErasing);
    }
  }
  
  // Function to erase text character by character, keeping quotes
  function eraseText(element, fullText) {
    const currentText = element.textContent;
    // Extract the text without the quotes
    const textWithoutQuotes = currentText.substring(1, currentText.length - 1);
    
    if (textWithoutQuotes.length > 0) {
      // Keep the quotes, but erase one character of the middle text
      element.textContent = '"' + textWithoutQuotes.substring(0, textWithoutQuotes.length - 1) + '"';
      setTimeout(() => eraseText(element, fullText), typingSpeed / 2);
    } else {
      // When we're down to just quotes, move to the next section
      setTimeout(showNextSection, pauseBeforeNextSection);
    }
  }
  
  // Function to show the next section and start typing
  function showNextSection() {
    // Hide all sections
    sections.forEach(section => {
      section.style.display = 'none';
    });
    
    // Show the current section
    sections[currentIndex].style.display = 'block';
    
    // Get the typing element and clear its content
    const typingElement = sections[currentIndex].querySelector('.typing');
    typingElement.textContent = '';
    
    // Start typing the text for this section
    typeText(typingElement, textArray[currentIndex]);
    
    // Move to the next index for next time
    currentIndex = (currentIndex + 1) % sections.length;
  }
  
  // Start the animation with the first section
  showNextSection();