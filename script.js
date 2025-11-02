let sidebarState = false;
let videosData = [];
let filteredVideos = [];
let loadedVideos = [];
let currentVideo = null;
const videosPerPage = 12;

const searchInput = document.getElementById('searchInput');
const suggestionsContainer = document.getElementById('suggestionsContainer');
const searchTime = document.getElementById('searchTime');
const clearIcon = document.getElementById('clearIcon');
const separatorLine = document.getElementById('separatorLine');
const searchIcon = document.getElementById('searchIcon');
const searchContainer = document.getElementById('searchContainer');
const thumbnailsWrapper = document.getElementById('thumbnailsWrapper');
const thumbnailsContainer = document.getElementById('thumbnailsContainer');
const scrollLineContainer = document.getElementById('scrollLineContainer');
const scrollLine = document.getElementById('scrollLine');
const foldablePage = document.getElementById('foldablePage');
const foldBtn = document.getElementById('foldBtn');
const unfoldBtn = document.getElementById('unfoldBtn');
const videoPlayer = document.getElementById('videoPlayer');
const videoTitle = document.getElementById('videoTitle');
const viewsDate = document.getElementById('viewsDate');
const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');
const shareBtn = document.getElementById('shareBtn');
const shareSection = document.getElementById('shareSection');
const videoLink = document.getElementById('videoLink');
const embedCode = document.getElementById('embedCode');
const channelIconLarge = document.getElementById('channelIconLarge');
const channelNameLarge = document.getElementById('channelNameLarge');
const subscriberCount = document.getElementById('subscriberCount');
const descriptionText = document.getElementById('descriptionText');
const toggleDescription = document.getElementById('toggleDescription');
const relatedVideos = document.getElementById('relatedVideos');

const allSuggestions = [
    "search liked videos on youtube",
    "search like nastya",
    "search like me by meekz",
    "search like the way",
    "search like google",
    "search like a pro",
    "search like",
    "how to search liked videos on facebook",
    "how to search like google in iphone",
    "how to search liked videos on instagram",
    "search engine like google",
    "searching like google kartel ft demarco",
    "searching like my brother",
    "google search like a pro"
];

let selectedIndex = -1;
let isDragging = false;
let arrowScrollInterval = null;
let dragStartY = 0;
let dragStartTop = 0;
const scrollSpeed = 20;
const wheelScrollSpeed = 0.8;
let isLoading = false;

async function loadVideos() {
    try {
        thumbnailsContainer.innerHTML = '<div class="loading-message">Loading videos...</div>';
        const response = await fetch('videoinfo.json');
        videosData = await response.json();
        filteredVideos = [...videosData];
        loadedVideos = [];
        renderInitialVideos();
        initializeScrollLine();
        setupIntersectionObserver();
    } catch (error) {
        console.error('Error loading video data:', error);
        thumbnailsContainer.innerHTML = '<div class="error-message">Failed to load videos. Please try again later.</div>';
    }
}

function renderInitialVideos() {
    const fragment = document.createDocumentFragment();
    const initialVideos = filteredVideos.slice(0, videosPerPage);
    initialVideos.forEach(video => {
        const thumbnailDiv = createThumbnailElement(video);
        fragment.appendChild(thumbnailDiv);
        loadedVideos.push(video);
    });
    thumbnailsContainer.innerHTML = '';
    thumbnailsContainer.appendChild(fragment);
    setupLazyLoading();
}

function createThumbnailElement(video) {
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'video-thumbnail';
    thumbnailDiv.dataset.category = video.category;
    thumbnailDiv.innerHTML = `
        <div class="thumbnail-overlay"><span class="duration">${video.duration}</span></div>
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="${video.thumbnail_url}" alt="Video Thumbnail" class="thumbnail" loading="lazy">
        <div class="info">
            <img src="${video.channel_icon}" alt="Channel Icon" class="channel-icon">
            <div class="details">
                <span class="title">${video.title}</span>
                <span class="channel-name">${video.channel_name}</span>
                <span class="views">${video.views}</span>
            </div>
        </div>
        <button class="options-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="white"></path>
            </svg>
        </button>
        <div class="options-menu">
            <ul>
                <li><a href="#">Watch Later</a></li>
                <li><a href="#">Copy Link</a></li>
            </ul>
        </div>
    `;

    const thumbnailImg = thumbnailDiv.querySelector('.thumbnail');
    thumbnailImg.addEventListener('click', () => {
        sidebarState = document.querySelector('.sidebar').classList.contains('collapsed');
        foldablePage.classList.remove('folded');
        foldablePage.classList.add('unfolded');
        foldBtn.style.display = 'block';
        unfoldBtn.style.display = 'none';
        document.querySelector('.sidebar').classList.add('collapsed');
        loadVideo(video);
    });

    const optionsBtn = thumbnailDiv.querySelector('.options-btn');
    optionsBtn.addEventListener('click', () => toggleOptions(optionsBtn));

    return thumbnailDiv;
}

function loadVideo(video) {
    currentVideo = video;
    videoPlayer.src = video.video_url;
    videoTitle.textContent = video.title;
    viewsDate.textContent = `${video.views} • ${video.upload_date || 'Unknown Date'}`;
    channelIconLarge.src = video.channel_icon;
    channelNameLarge.textContent = video.channel_name;
    subscriberCount.textContent = `${video.subscribers || 'Unknown'} subscribers`;
    descriptionText.textContent = video.description || 'No description available.';
    likeBtn.querySelector('span').textContent = video.likes || 0;
    dislikeBtn.querySelector('span').textContent = video.dislikes || 0;
    videoLink.value = video.video_url;
    embedCode.value = `<iframe width="560" height="315" src="${video.video_url}" frameborder="0" allowfullscreen></iframe>`;
    subscribeBtn.classList.remove('subscribed');
    subscribeBtn.textContent = 'Subscribe';
    likeBtn.classList.remove('active');
    dislikeBtn.classList.remove('active');
    descriptionText.classList.remove('expanded');
    toggleDescription.textContent = 'Show More';
    videoPlayer.play();
    renderRelatedVideos();
}

function renderRelatedVideos() {
    relatedVideos.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const otherVideos = videosData.filter(v => v !== currentVideo).slice(0, 10);
    otherVideos.forEach(video => {
        const relatedDiv = document.createElement('div');
        relatedDiv.className = 'related-video';
        relatedDiv.innerHTML = `
            <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="${video.thumbnail_url}" alt="Related Video Thumbnail" loading="lazy">
            <div class="details">
                <span class="title">${video.title}</span>
                <span class="channel-name">${video.channel_name}</span>
                <span class="views">${video.views}</span>
            </div>
        `;
        relatedDiv.addEventListener('click', () => loadVideo(video));
        fragment.appendChild(relatedDiv);
    });
    relatedVideos.appendChild(fragment);
    setupLazyLoading();
}

function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                loadMoreVideos();
            }
        });
    }, {
        root: thumbnailsContainer,
        threshold: 0.1
    });

    const sentinel = document.createElement('div');
    sentinel.id = 'sentinel';
    thumbnailsContainer.appendChild(sentinel);
    observer.observe(sentinel);
}

function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '100px 0px',
        threshold: 0.01
    });

    images.forEach(img => imageObserver.observe(img));
}

function loadMoreVideos() {
    if (isLoading || loadedVideos.length >= filteredVideos.length) return;

    isLoading = true;
    const fragment = document.createDocumentFragment();
    const startIndex = loadedVideos.length;
    const nextVideos = filteredVideos.slice(startIndex, startIndex + videosPerPage);

    nextVideos.forEach(video => {
        const thumbnailDiv = createThumbnailElement(video);
        fragment.appendChild(thumbnailDiv);
        loadedVideos.push(video);
    });

    thumbnailsContainer.insertBefore(fragment, document.getElementById('sentinel'));
    setupLazyLoading();
    isLoading = false;
    updateScrollLineHeight();
}

function updateScrollLineHeight() {
    const totalVideos = filteredVideos.length;
    const visibleHeight = thumbnailsContainer.clientHeight;
    const estimatedHeightPerVideo = 180;
    const estimatedTotalHeight = totalVideos * estimatedHeightPerVideo;

    if (estimatedTotalHeight <= visibleHeight) {
        scrollLineContainer.style.display = 'none';
        return;
    }

    scrollLineContainer.style.display = 'block';
    const scrollLineHeight = (visibleHeight / estimatedTotalHeight) * (scrollLineContainer.clientHeight - 20);
    scrollLine.style.height = `${Math.max(scrollLineHeight, 30)}px`;
}

function initializeScrollLine() {
    updateScrollLineHeight();

    const totalVideos = filteredVideos.length;
    const estimatedHeightPerVideo = 180;
    const estimatedTotalHeight = totalVideos * estimatedHeightPerVideo;
    const contentScrollHeight = estimatedTotalHeight - thumbnailsContainer.clientHeight;
    const scrollLineMaxTop = scrollLineContainer.clientHeight - scrollLine.clientHeight - 20;

    thumbnailsContainer.addEventListener('scroll', () => {
        if (isDragging) return;
        const scrollRatio = thumbnailsContainer.scrollTop / contentScrollHeight;
        const newTop = scrollRatio * scrollLineMaxTop;
        scrollLine.style.top = `${newTop + 10}px`;
    });

    scrollLine.addEventListener('mousedown', startDragging);
    scrollLine.addEventListener('touchstart', startDragging, { passive: false });

    document.addEventListener('keydown', handleArrowKeys);
    document.addEventListener('keyup', stopArrowScroll);

    thumbnailsContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        thumbnailsContainer.scrollTop += e.deltaY * wheelScrollSpeed;
    }, { passive: false });

    const initialScrollRatio = thumbnailsContainer.scrollTop / contentScrollHeight;
    scrollLine.style.top = `${initialScrollRatio * scrollLineMaxTop + 10}px`;
}

function startDragging(e) {
    e.preventDefault();
    isDragging = true;
    scrollLine.classList.add('active');

    const rect = scrollLineContainer.getBoundingClientRect();
    dragStartY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    dragStartTop = parseFloat(scrollLine.style.top || '10') - 10;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchmove', onDragTouch, { passive: false });
    document.addEventListener('touchend', stopDragging);
}

function onDrag(e) {
    if (!isDragging) return;

    const rect = scrollLineContainer.getBoundingClientRect();
    const currentY = e.clientY;
    const deltaY = currentY - dragStartY;
    const scrollLineMaxTop = scrollLineContainer.clientHeight - scrollLine.clientHeight - 20;

    let newTop = dragStartTop + deltaY;
    newTop = Math.max(0, Math.min(newTop, scrollLineMaxTop));
    scrollLine.style.top = `${newTop + 10}px`;

    const totalVideos = filteredVideos.length;
    const estimatedHeightPerVideo = 180;
    const estimatedTotalHeight = totalVideos * estimatedHeightPerVideo;
    const contentScrollHeight = estimatedTotalHeight - thumbnailsContainer.clientHeight;
    if (contentScrollHeight <= 0) return;
    const scrollRatio = newTop / scrollLineMaxTop;
    thumbnailsContainer.scrollTop = scrollRatio * contentScrollHeight;
}

function onDragTouch(e) {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - dragStartY;
    const scrollLineMaxTop = scrollLineContainer.clientHeight - scrollLine.clientHeight - 20;

    let newTop = dragStartTop + deltaY;
    newTop = Math.max(0, Math.min(newTop, scrollLineMaxTop));
    scrollLine.style.top = `${newTop + 10}px`;

    const totalVideos = filteredVideos.length;
    const estimatedHeightPerVideo = 180;
    const estimatedTotalHeight = totalVideos * estimatedHeightPerVideo;
    const contentScrollHeight = estimatedTotalHeight - thumbnailsContainer.clientHeight;
    if (contentScrollHeight <= 0) return;
    const scrollRatio = newTop / scrollLineMaxTop;
    thumbnailsContainer.scrollTop = scrollRatio * contentScrollHeight;
}

function stopDragging() {
    if (!isDragging) return;
    isDragging = false;
    scrollLine.classList.remove('active');

    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDragging);
    document.removeEventListener('touchmove', onDragTouch);
    document.removeEventListener('touchend', stopDragging);
}

function handleArrowKeys(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (arrowScrollInterval) return;

        const direction = e.key === 'ArrowDown' ? 1 : -1;
        arrowScrollInterval = setInterval(() => {
            thumbnailsContainer.scrollTop += direction * scrollSpeed;
        }, 10);
    }
}

function stopArrowScroll() {
    clearInterval(arrowScrollInterval);
    arrowScrollInterval = null;
}

function copyToClipboard(elementId) {
    const input = document.getElementById(elementId);
    input.select();
    document.execCommand('copy');
    alert('Copied to clipboard!');
}

likeBtn.addEventListener('click', () => {
    if (dislikeBtn.classList.contains('active')) {
        dislikeBtn.classList.remove('active');
        let count = parseInt(dislikeBtn.querySelector('span').textContent);
        dislikeBtn.querySelector('span').textContent = count - 1;
    }
    likeBtn.classList.toggle('active');
    let count = parseInt(likeBtn.querySelector('span').textContent);
    likeBtn.querySelector('span').textContent = likeBtn.classList.contains('active') ? count + 1 : count - 1;
});

dislikeBtn.addEventListener('click', () => {
    if (likeBtn.classList.contains('active')) {
        likeBtn.classList.remove('active');
        let count = parseInt(likeBtn.querySelector('span').textContent);
        likeBtn.querySelector('span').textContent = count - 1;
    }
    dislikeBtn.classList.toggle('active');
    let count = parseInt(dislikeBtn.querySelector('span').textContent);
    dislikeBtn.querySelector('span').textContent = dislikeBtn.classList.contains('active') ? count + 1 : count - 1;
});

shareBtn.addEventListener('click', () => {
    shareSection.classList.toggle('active');
    shareSection.style.top = `${shareBtn.offsetTop + shareBtn.offsetHeight + 5}px`;
    shareSection.style.right = '10px';
});

subscribeBtn.addEventListener('click', () => {
    subscribeBtn.classList.toggle('subscribed');
    subscribeBtn.textContent = subscribeBtn.classList.contains('subscribed') ? 'Subscribed' : 'Subscribe';
});

toggleDescription.addEventListener('click', () => {
    descriptionText.classList.toggle('expanded');
    toggleDescription.textContent = descriptionText.classList.contains('expanded') ? 'Show Less' : 'Show More';
});

document.addEventListener('click', (e) => {
    if (!shareBtn.contains(e.target) && !shareSection.contains(e.target)) {
        shareSection.classList.remove('active');
    }
});

searchInput.addEventListener('input', function(e) {
    const query = e.target.value;
    selectedIndex = -1;

    if (query.length > 0) {
        clearIcon.style.display = 'flex';
        separatorLine.style.display = 'block';
        searchIcon.style.color = '#fff';
    } else {
        clearIcon.style.display = 'none';
        separatorLine.style.display = 'none';
        searchIcon.style.color = '#aaa';
    }

    if (query.length === 0) {
        suggestionsContainer.style.display = 'none';
        searchTime.style.display = 'none';
        return;
    }

    const filtered = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase())
    );

    showSuggestions(filtered, query.toLowerCase());
});

clearIcon.addEventListener('click', function() {
    searchInput.value = '';
    searchInput.focus();
    clearIcon.style.display = 'none';
    separatorLine.style.display = 'none';
    searchIcon.style.color = '#aaa';
    suggestionsContainer.style.display = 'none';
});

searchInput.addEventListener('keydown', function(e) {
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectedIndex < items.length - 1) {
            selectedIndex++;
            updateSelectedItem(items);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedIndex > 0) {
            selectedIndex--;
            updateSelectedItem(items);
        }
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selectedItem = items[selectedIndex];
        if (selectedItem) {
            searchInput.value = selectedItem.querySelector('.suggestion-text').textContent;
            suggestionsContainer.style.display = 'none';
        }
    }
});

function updateSelectedItem(items) {
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.style.backgroundColor = '#303030';
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.style.backgroundColor = '';
        }
    });
}

function showSuggestions(suggestions, query) {
    if (suggestions.length === 0) {
        suggestionsContainer.style.display = 'none';
        searchTime.style.display = 'none';
        return;
    }

    suggestionsContainer.innerHTML = '';

    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';

        const icon = document.createElement('div');
        icon.className = 'suggestion-icon';
        icon.innerHTML = '<i class="fas fa-search"></i>';

        const text = document.createElement('div');
        text.className = 'suggestion-text';

        const startIndex = suggestion.toLowerCase().indexOf(query);
        if (startIndex !== -1) {
            const before = suggestion.substring(0, startIndex);
            const match = suggestion.substring(startIndex, startIndex + query.length);
            const after = suggestion.substring(startIndex + query.length);
            text.innerHTML = `${before}<span class="suggestion-highlight">${match}</span>${after}`;
        } else {
            text.textContent = suggestion;
        }

        item.appendChild(icon);
        item.appendChild(text);
        item.addEventListener('click', () => {
            searchInput.value = suggestion;
            suggestionsContainer.style.display = 'none';
        });

        suggestionsContainer.appendChild(item);
    });

    searchTime.textContent = `About ${suggestions.length} results`;
    searchTime.style.display = 'block';
    suggestionsContainer.appendChild(searchTime);

    suggestionsContainer.style.display = 'block';
}

document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !clearIcon.contains(e.target) && !searchIcon.contains(e.target)) {
        suggestionsContainer.style.display = 'none';
    }
});

searchInput.addEventListener('focus', function() {
    if (searchInput.value.length > 0) {
        const query = searchInput.value.toLowerCase();
        const filtered = allSuggestions.filter(suggestion =>
            suggestion.toLowerCase().includes(query)
        );
        showSuggestions(filtered, query);
    }
});

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
    sidebarState = sidebar.classList.contains('collapsed');
}

function setSidebarState() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebarState) {
        sidebar.classList.add('collapsed');
    } else {
        sidebar.classList.remove('collapsed');
    }
}

function toggleOptions(button) {
    const menu = button.nextElementSibling;
    document.querySelectorAll('.options-menu').forEach(m => {
        if (m !== menu) m.classList.remove('active');
    });
    menu.classList.toggle('active');

    menu.querySelectorAll('li a').forEach(o => {
        o.addEventListener('click', () => menu.classList.remove('active'));
    });
}

function filterCategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category || (category === 'all' && btn.textContent === 'All')) {
            btn.classList.add('active');
        }
    });

    filteredVideos = videosData.filter(video => category === 'all' || video.category === category);
    loadedVideos = [];
    renderInitialVideos();
    initializeScrollLine();
}

function toggleSearch() {
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
        searchInput.focus();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadVideos();

    foldBtn.style.display = 'none';

    foldBtn.addEventListener('click', () => {
        foldablePage.classList.remove('unfolded');
        foldablePage.classList.add('folded');
        foldBtn.style.display = 'none';
        unfoldBtn.style.display = 'block';
        setSidebarState();
        videoPlayer.pause();
    });

    unfoldBtn.addEventListener('click', () => {
        foldablePage.classList.remove('folded');
        foldablePage.classList.add('unfolded');
        foldBtn.style.display = 'block';
        unfoldBtn.style.display = 'none';
        document.querySelector('.sidebar').classList.add('collapsed');
    });
});