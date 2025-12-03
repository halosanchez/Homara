// City data and configuration
const cities = [
  'Chicago', 'New York', 'Portland', 'Los Angeles', 
  'Miami', 'Austin', 'Seattle', 'San Francisco'
];

const cityWebsites = {
  'CHICAGO': 'https://www.chicago.gov',
  'NEW YORK': 'https://www.nyc.gov',
  'PORTLAND': 'https://www.portland.gov',
  'LOS ANGELES': 'https://www.lacity.org',
  'MIAMI': 'https://www.miamigov.com',
  'AUSTIN': 'https://www.austintexas.gov',
  'SEATTLE': 'https://www.seattle.gov',
  'SAN FRANCISCO': 'https://www.sf.gov'
};

const originalCitiesPage1 = ['CHICAGO', 'NEW YORK', 'PORTLAND', 'LOS ANGELES'];
const originalCitiesPage2 = ['MIAMI', 'AUSTIN', 'SEATTLE', 'SAN FRANCISCO'];

// DOM elements
const searchInput = document.getElementById('citySearch');
const dropdown = document.getElementById('autocompleteDropdown');

// Function to get current page boxes
function getCurrentPageBoxes() {
  const currentPageElement = document.querySelector(`#page${currentPage}`);
  return {
    workBox: currentPageElement.querySelector('.work'),
    connectBox: currentPageElement.querySelector('.connect'),
    aboutBox: currentPageElement.querySelector('.about'),
    communityBox: currentPageElement.querySelector('.community')
  };
}

let currentFocus = -1;
let currentPage = 1;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  applyBlackTextToPortlandSeattle();
  addCityClickListeners();
  setupVideoHover();
  setupSearch();
  setupPageNavigation();
});

// Apply black text to Portland and Seattle
function applyBlackTextToPortlandSeattle() {
  const allBoxes = document.querySelectorAll('.box');
  allBoxes.forEach(box => {
    if (box.textContent === 'PORTLAND' || box.textContent === 'SEATTLE') {
      box.classList.add('black-text');
    } else {
      box.classList.remove('black-text');
    }
  });
}

// Add click functionality to city boxes
function addCityClickListeners() {
  const allBoxes = document.querySelectorAll('.box');
  allBoxes.forEach(box => {
    // Remove existing listeners to prevent duplicates
    box.replaceWith(box.cloneNode(true));
  });
  
  // Re-select boxes after cloning and add new listeners
  const refreshedBoxes = document.querySelectorAll('.box');
  refreshedBoxes.forEach(box => {
    box.addEventListener('click', function() {
      const cityName = this.textContent.trim();
      const website = cityWebsites[cityName];
      if (website) {
        window.open(website, '_blank');
      }
    });
  });
}

// Setup video hover functionality
function setupVideoHover() {
  const centerBoxes = document.querySelectorAll('.center');
  
  centerBoxes.forEach(centerBox => {
    const video = centerBox.querySelector('.center-video');
    
    if (video) {
      centerBox.addEventListener('mouseenter', function() {
        video.currentTime = 0;
        video.play().catch(e => {
          console.log('Video play failed:', e);
        });
      });
      
      centerBox.addEventListener('mouseleave', function() {
        video.pause();
        video.currentTime = 0;
      });
    }
  });
}

// Update corner boxes with search results
function updateCornerBoxes(matches) {
  const { workBox, connectBox, aboutBox, communityBox } = getCurrentPageBoxes();
  const boxes = [workBox, connectBox, aboutBox, communityBox];
  const currentOriginals = currentPage === 1 ? originalCitiesPage1 : originalCitiesPage2;

  boxes.forEach((box, index) => {
    if (matches[index]) {
      box.textContent = matches[index].toUpperCase();
      box.style.backgroundColor = 'white';
    } else {
      box.textContent = currentOriginals[index];
      box.style.backgroundColor = 'white';
    }
  });

  applyBlackTextToPortlandSeattle();
  addCityClickListeners();
}

// Reset to original cities
function resetToOriginalCities() {
  const { workBox, connectBox, aboutBox, communityBox } = getCurrentPageBoxes();
  const boxes = [workBox, connectBox, aboutBox, communityBox];
  const currentOriginals = currentPage === 1 ? originalCitiesPage1 : originalCitiesPage2;

  boxes.forEach((box, index) => {
    box.textContent = currentOriginals[index];
    box.style.backgroundColor = 'white';
  });

  applyBlackTextToPortlandSeattle();
  addCityClickListeners();
}

// Setup search functionality
function setupSearch() {
  searchInput.addEventListener('input', function() {
    const value = this.value.toLowerCase();
    dropdown.innerHTML = '';
    currentFocus = -1;

    if (!value) {
      dropdown.style.display = 'none';
      resetToOriginalCities();
      return;
    }

    const matches = cities.filter(city =>
      city.toLowerCase().includes(value)
    );

    if (matches.length > 0) {
      dropdown.style.display = 'block';
      matches.forEach((match) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = match;
        item.addEventListener('click', function() {
          searchInput.value = match;
          dropdown.style.display = 'none';

          const searchMatches = cities.filter(city =>
            city.toLowerCase().includes(match.toLowerCase())
          ).slice(0, 4);
          updateCornerBoxes(searchMatches);
        });
        dropdown.appendChild(item);
      });

      const cornerMatches = matches.slice(0, 4);
      updateCornerBoxes(cornerMatches);
    } else {
      dropdown.style.display = 'none';
      resetToOriginalCities();
    }
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', function(e) {
    const items = dropdown.querySelectorAll('.autocomplete-item');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentFocus++;
      if (currentFocus >= items.length) currentFocus = 0;
      setActive(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentFocus--;
      if (currentFocus < 0) currentFocus = items.length - 1;
      setActive(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentFocus > -1 && items[currentFocus]) {
        items[currentFocus].click();
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      currentFocus = -1;
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-container')) {
      dropdown.style.display = 'none';
      currentFocus = -1;
    }
  });
}

function setActive(items) {
  items.forEach((item, index) => {
    item.classList.toggle('highlighted', index === currentFocus);
  });
}

// Setup page navigation
function setupPageNavigation() {
  const scrollArrow = document.getElementById('scrollArrow');
  const scrollArrowUp = document.getElementById('scrollArrowUp');
  const page1 = document.getElementById('page1');
  const page2 = document.getElementById('page2');
  let scrollAccumulator = 0;

  // Detect scroll attempts to show arrows
  window.addEventListener('wheel', function(e) {
    e.preventDefault();

    if (currentPage === 1) {
      if (e.deltaY > 0) {
        scrollAccumulator += Math.abs(e.deltaY);
        if (scrollAccumulator > 300) {
          scrollArrow.classList.add('visible');
        }
      } else {
        scrollAccumulator = Math.max(0, scrollAccumulator - Math.abs(e.deltaY));
        if (scrollAccumulator <= 100) {
          scrollArrow.classList.remove('visible');
        }
      }
    } else if (currentPage === 2) {
      if (e.deltaY < 0) {
        scrollAccumulator += Math.abs(e.deltaY);
        if (scrollAccumulator > 300) {
          scrollArrowUp.classList.add('visible');
        }
      } else {
        scrollAccumulator = Math.max(0, scrollAccumulator - Math.abs(e.deltaY));
        if (scrollAccumulator <= 100) {
          scrollArrowUp.classList.remove('visible');
        }
      }
    }
  }, { passive: false });

  // Navigate to page 2
  scrollArrow.addEventListener('click', function() {
    if (currentPage === 1) {
      page1.classList.add('transitioning');
      page2.classList.add('transitioning');

      setTimeout(() => {
        page1.classList.add('hidden');
        page2.classList.add('active');
        scrollArrow.classList.remove('visible');
        scrollAccumulator = 0;
        currentPage = 2;

        updatePageContent();
      }, 50);

      setTimeout(() => {
        page1.classList.remove('transitioning');
        page2.classList.remove('transitioning');
      }, 800);
    }
  });

  // Navigate to page 1
  scrollArrowUp.addEventListener('click', function() {
    if (currentPage === 2) {
      page1.classList.add('transitioning');
      page2.classList.add('transitioning');

      setTimeout(() => {
        page1.classList.remove('hidden');
        page2.classList.remove('active');
        scrollArrowUp.classList.remove('visible');
        scrollAccumulator = 0;
        currentPage = 1;

        updatePageContent();
      }, 50);

      setTimeout(() => {
        page1.classList.remove('transitioning');
        page2.classList.remove('transitioning');
      }, 800);
    }
  });

  // ESC key navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && currentPage === 2) {
      scrollArrowUp.click();
    }
  });
}

function updatePageContent() {
  if (searchInput.value) {
    const value = searchInput.value.toLowerCase();
    const matches = cities.filter(city =>
      city.toLowerCase().includes(value)
    ).slice(0, 4);
    updateCornerBoxes(matches);
  } else {
    resetToOriginalCities();
  }

  applyBlackTextToPortlandSeattle();
  addCityClickListeners();
}
