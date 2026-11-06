const TMDB_API_KEY = '0ec4078ea6e52e0b9e2e1115cded41e5';
const WATCHLIST_KEY = 'mymovie-watchlist';
const RECOMMENDATION_KEY = 'mymovie-recommendations';
const STATUS_OPTIONS = ['Plan to Watch', 'Watching', 'Watched'];


const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const statusMessage = document.getElementById('statusMessage');
const movieResults = document.getElementById('movieResults');
const genreSelect = document.getElementById('genreSelect');
const genreButton = document.getElementById('genreButton');
const recommendButton = document.getElementById('recommendButton');
const discoverPage = document.getElementById('discoverPage');
const watchlistPage = document.getElementById('watchlistPage');
const detailsPage = document.getElementById('detailsPage');
const discoverNav = document.getElementById('discoverNav');
const watchlistNav = document.getElementById('watchlistNav');
const backButton = document.getElementById('backButton');
const detailsStatus = document.getElementById('detailsStatus');
const movieDetails = document.getElementById('movieDetails');

// Fetch data from TMDB API
function tmdbRequest(endpoint, parameters = {}) {
    let url = 'https://api.themoviedb.org/3' + endpoint;
    const query = new URLSearchParams(parameters);
    query.set('api_key', TMDB_API_KEY);
    url += '?' + query.toString();

    return fetch(url)
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Request failed. Please try again.');
            }
            
            return response.json();
        });
}

function searchMovies(query) {
    return tmdbRequest('/search/movie', { query: query });
}

function getMoviesByGenre(genreId) {
    return tmdbRequest('/discover/movie', {
        with_genres: genreId,
        sort_by: 'popularity.desc'
    });
}

function getMovieDetails(movieId) {
    return tmdbRequest('/movie/' + movieId);
}

// Local Storage: Read saved movies
function getWatchlist() {
    try {
        return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
    } catch (error) {
        return [];
    }
}

// Save movies
function saveWatchlist(watchlist) {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
}

// Save the recommendation results
function saveRecommendations(movies) {
    localStorage.setItem(RECOMMENDATION_KEY, JSON.stringify(movies));
}

// Show the Discover page
function showDiscoverPage() {
    discoverPage.hidden = false;
    watchlistPage.hidden = true;
    detailsPage.hidden = true;
    discoverNav.classList.add('active');
    watchlistNav.classList.remove('active');
}

// Show the Watchlist page
function showWatchlistPage() {
    discoverPage.hidden = true;
    watchlistPage.hidden = false;
    detailsPage.hidden = true;
    discoverNav.classList.remove('active');
    watchlistNav.classList.add('active');
    renderWatchlist();
}

discoverNav.addEventListener('click', showDiscoverPage);
watchlistNav.addEventListener('click', showWatchlistPage);
backButton.addEventListener('click', showDiscoverPage);

// Create a movie card and its buttons
function createMovieCard(movie, isWatchlist) {
    const card = document.createElement('article');
    card.className = 'movie-card';

    const poster = document.createElement('img');
    poster.className = 'movie-poster';
    poster.alt = movie.poster_path ? movie.title + ' poster' : 'Poster unavailable';

    if (movie.poster_path) {
        poster.src = 'https://image.tmdb.org/t/p/w500' + movie.poster_path;
    }

    const title = document.createElement('h3');
    title.textContent = movie.title || 'Untitled Movie';

    const year = document.createElement('p');
    year.textContent = movie.release_date
        ? 'Year: ' + movie.release_date.slice(0, 4)
        : 'Year: Unavailable';

    const rating = document.createElement('p');
    rating.textContent = 'TMDB Rating: ' +
        Number(movie.vote_average || 0).toFixed(1) + '/10';

    const detailsButton = document.createElement('button');
    detailsButton.textContent = 'View Details';
    detailsButton.addEventListener('click', function() {
        loadMovieDetails(movie.id);
    });

    card.append(poster, title, year, rating);

    if (isWatchlist) {
        const statusLabel = document.createElement('label');
        statusLabel.textContent = 'Watch status';

        const statusSelect = document.createElement('select');
        STATUS_OPTIONS.forEach(function(statusName) {
            const option = document.createElement('option');
            option.value = statusName;
            option.textContent = statusName;
            if ((movie.status || 'Plan to Watch') === statusName) {
                option.selected = true;
            }
            statusSelect.appendChild(option);
        });

        statusSelect.addEventListener('change', function() {
            updateMovieStatus(movie.id, statusSelect.value);
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function() {
            showDeletePopup(movie.id);
    });

        card.append(statusLabel, statusSelect, detailsButton, deleteButton);
    } else {
        const addButton = document.createElement('button');
        addButton.textContent = 'Add to Watchlist';
        addButton.addEventListener('click', function() {
            showAddPopup(movie);
    });

        card.append(detailsButton, addButton);
    }

    return card;
}

// Display a list of movies
function renderMovies(movies, container) {
    container.replaceChildren();

    movies.forEach(function(movie) {
        container.appendChild(createMovieCard(movie, false));
    });
}

// Search movies 
searchForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const query = searchInput.value.trim();
    if (query === '') {
        statusMessage.textContent = 'Please enter a movie title.';
        return;
    }

    statusMessage.textContent = 'Searching for movies...';
    movieResults.replaceChildren();

    searchMovies(query)
        .then(function(data) {
            const movies = data.results || [];

            if (movies.length === 0) {
                statusMessage.textContent = 'No movies found. Try another title.';
                return;
            }

            renderMovies(movies, movieResults);
            statusMessage.textContent = 'Found ' + movies.length + ' movies.';
        })
        .catch(function(error) {
            statusMessage.textContent = 'Unable to search movies. ' + error.message;
        });
});

// Browse movies by genre
genreButton.addEventListener('click', function() {
    const genreId = genreSelect.value;

    if (genreId === '') {
        statusMessage.textContent = 'Please select a genre first.';
        return;
    }

    statusMessage.textContent = 'Loading movies...';
    movieResults.replaceChildren();

    getMoviesByGenre(genreId)
        .then(function(data) {
            const movies = data.results || [];

            if (movies.length === 0) {
                statusMessage.textContent = 'No movies found for this genre.';
                return;
            }

            renderMovies(movies, movieResults);
            const genreName = genreSelect.options[genreSelect.selectedIndex].text;
            statusMessage.textContent = 'Showing ' + movies.length + ' ' + genreName + ' movies.';
        })
        .catch(function(error) {
            statusMessage.textContent = 'Unable to load movies. ' + error.message;
        });
});

recommendButton.addEventListener('click', function() {
    const genreId = genreSelect.value;

    if (genreId === '') {
        statusMessage.textContent = 'Please select a genre first.';
        return;
    }

    statusMessage.textContent = 'Finding recommendations...';
    movieResults.replaceChildren();

    getMoviesByGenre(genreId)
        .then(function(data) {
            const movies = data.results || [];
            const recommendations = [];

            movies.forEach(function(movie) {
                if (
                    movie.genre_ids &&
                    movie.genre_ids.includes(Number(genreId)) &&
                    Number(movie.vote_average || 0) >= 7
                ) {
                    recommendations.push(movie);
                }
            });

            // Save recommendations to Local Storage 
            saveRecommendations(recommendations);

            if (recommendations.length === 0) {
                statusMessage.textContent =
                    'No suitable recommendations found. Try another genre.';
                return;
            }

            renderMovies(recommendations, movieResults);
            statusMessage.textContent =
                recommendations.length + ' recommended movies with a rating of 7/10 or higher.';
        })
        .catch(function(error) {
            statusMessage.textContent = 'Unable to get recommendations. ' + error.message;
        });
});

// Display detailed movie information
function loadMovieDetails(movieId) {
    discoverPage.hidden = true;
    watchlistPage.hidden = true;
    detailsPage.hidden = false;
    discoverNav.classList.remove('active');
    watchlistNav.classList.remove('active');
    movieDetails.replaceChildren();
    detailsStatus.textContent = 'Loading movie details...';

    getMovieDetails(movieId)
        .then(function(movie) {
            const title = document.createElement('h2');
            title.textContent = movie.title || 'Untitled Movie';

            const poster = document.createElement('img');
            poster.className = 'movie-poster detail-poster';
            poster.alt = movie.title ? movie.title + ' poster' : 'Poster unavailable';
            if (movie.poster_path) {
                poster.src = 'https://image.tmdb.org/t/p/w500' + movie.poster_path;
            }

            const release = document.createElement('p');
            release.textContent = 'Release Date: ' + (movie.release_date || 'Unavailable');

            const rating = document.createElement('p');
            rating.textContent = 'TMDB Rating: ' +
                Number(movie.vote_average || 0).toFixed(1) + '/10';

            // convert runtime minutes into hours and minutes
            const runtime = document.createElement('p');
            if (movie.runtime && movie.runtime > 0) {
                const hours = Math.floor(movie.runtime / 60);
                const minutes = movie.runtime % 60;
                runtime.textContent = 'Duration: ' + hours + ' hour(s) ' +
                    minutes + ' minute(s) (' + movie.runtime + ' minutes)';
            } else {
                runtime.textContent = 'Duration: Unavailable';
            }

            const genres = document.createElement('p');
            if (movie.genres && movie.genres.length > 0) {
                const genreNames = movie.genres.map(function(genre) {
                    return genre.name;
                });
                genres.textContent = 'Genre: ' + genreNames.join(', ');
            } else {
                genres.textContent = 'Genre: Unavailable';
            }

            const overviewHeading = document.createElement('h3');
            overviewHeading.textContent = 'Overview';

            const overview = document.createElement('p');
            overview.textContent = movie.overview || 'No overview available.';

            const information = document.createElement('div');
            information.className = 'movie-detail-information';
            information.append(
                title, release, rating, runtime, genres, overviewHeading, overview
            );

            const layout = document.createElement('div');
            layout.className = 'movie-detail-layout';
            layout.append(poster, information);
            movieDetails.appendChild(layout);
            detailsStatus.textContent = '';
        })
        .catch(function(error) {
            detailsStatus.textContent = 'Unable to load movie details. ' + error.message;
        });
}

// Show add confirmation popup
function showAddPopup(movie) {
    const overlay = document.createElement('div');
    overlay.className = 'status-popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'status-popup';

    const heading = document.createElement('h3');
    heading.textContent = 'Add Movie?';

    const description = document.createElement('p');
    description.textContent =
        'Add  ' +
        movie.title + ' to your watchlist?';

    const buttons = document.createElement('div');
    buttons.className = 'status-popup-buttons';

    const addButton = document.createElement('button');
    addButton.textContent = 'Add';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'cancel-button';

    addButton.addEventListener('click', function() {
        addToWatchlist(movie);
        overlay.remove();
    });

    cancelButton.addEventListener('click', function() {
        overlay.remove();
    });

    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    buttons.append(addButton, cancelButton);
    popup.append(heading, description, buttons);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}

// Add a movie to the watchlist
function addToWatchlist(movie) {
    const watchlist = getWatchlist();
    const alreadySaved = watchlist.some(function(item) {
        return item.id === movie.id;
    });

    if (alreadySaved) {
        statusMessage.textContent = movie.title + ' is already in your watchlist.';
        return;
    }

    movie.status = 'Plan to Watch';
    watchlist.push({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count || 0,
        status: 'Plan to Watch'
    });

    saveWatchlist(watchlist);
    statusMessage.textContent = movie.title + ' added to your watchlist.';
}

// Display saved movies and calculate the totals
function renderWatchlist() {
    const watchlistResults = document.getElementById('watchlistResults');
    const watchlist = getWatchlist();
    watchlistResults.replaceChildren();

    if (watchlist.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'Your watchlist is empty.';
        watchlistResults.appendChild(message);
    }

    watchlist.forEach(function(movie) {
        watchlistResults.appendChild(createMovieCard(movie, true));
    });

    updateWatchlistSummary(watchlist);
}

// Count the number of movies in each status
function updateWatchlistSummary(watchlist) {
    document.getElementById('planCount').textContent =
        watchlist.filter(function(movie) {
            return movie.status === 'Plan to Watch';
        }).length;

    document.getElementById('watchingCount').textContent =
        watchlist.filter(function(movie) {
            return movie.status === 'Watching';
        }).length;

    document.getElementById('watchedCount').textContent =
        watchlist.filter(function(movie) {
            return movie.status === 'Watched';
        }).length;

    document.getElementById('totalCount').textContent = watchlist.length;
}

// Change the status of a saved movie
function updateMovieStatus(movieId, newStatus) {
    if (!STATUS_OPTIONS.includes(newStatus)) {
        return;
    }

    const watchlist = getWatchlist();
    const movie = watchlist.find(function(item) {
        return item.id === movieId;
    });

    if (movie) {
        movie.status = newStatus;
        saveWatchlist(watchlist);
        renderWatchlist();
    }
}

// Show delete confirmation popup
function showDeletePopup(movieId) {
    const watchlist = getWatchlist();

    const movie = watchlist.find(function(item) {
        return item.id === movieId;
    });

    if (!movie) {
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'status-popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'status-popup';

    const heading = document.createElement('h3');
    heading.textContent = 'Delete Movie?';

    const description = document.createElement('p');
    description.textContent =
        'Are you sure you want to remove ' +
        movie.title + ' from your watchlist?';

    const buttons = document.createElement('div');
    buttons.className = 'status-popup-buttons';

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'cancel-button';

    deleteButton.addEventListener('click', function() {
        deleteMovie(movieId);
        overlay.remove();
    });

    cancelButton.addEventListener('click', function() {
        overlay.remove();
    });

    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            overlay.remove();
        }
    });

    buttons.append(deleteButton, cancelButton);
    popup.append(heading, description, buttons);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}
// Remove a movie from the watchlist
function deleteMovie(movieId) {
    const watchlist = getWatchlist();
    const updatedWatchlist = watchlist.filter(function(movie) {
        return movie.id !== movieId;
    });

    saveWatchlist(updatedWatchlist);
    renderWatchlist();
}

// Show saved watchlist 
renderWatchlist();
