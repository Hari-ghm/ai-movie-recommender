"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Film, 
  Star, 
  Clock, 
  Calendar, 
  TrendingUp, 
  X, 
  Sparkles, 
  User, 
  Award,
  RotateCcw,
  ChevronRight
} from "lucide-react";

interface Movie {
  id: number;
  title: string;
  overview: string;
  genres: string[];
  cast: string[];
  director: string;
  release_date: string;
  vote_average: number;
  popularity: number;
  runtime: number;
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and selection
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  
  // Dynamic recommendations from Flask backend
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load movies database from Flask Backend API
  useEffect(() => {
    const loadMovies = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/movies");
        if (!response.ok) {
          throw new Error("Failed to load movie database");
        }
        const data: Movie[] = await response.json();
        setMovies(data);
        setError(null);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError("Failed to connect to the movie recommendation engine. Please make sure the Python Flask backend is running on http://127.0.0.1:5000.");
        setLoading(false);
      }
    };
    
    loadMovies();
  }, []);

  // Handle click outside suggestions to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update suggestions on search query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = movies
      .filter(movie => movie.title.toLowerCase().includes(query))
      .slice(0, 8); // Top 8 suggestions
      
    setSuggestions(filtered);
  }, [searchQuery, movies]);

  // Genre aesthetic gradients mapped to beautiful hex palettes
  const getGenreGradient = (genres: string[]) => {
    if (!genres || genres.length === 0) return "from-purple-900/60 via-zinc-900 to-zinc-950";
    const primary = genres[0].toLowerCase();
    if (primary.includes("action")) return "from-red-950/60 via-zinc-900/90 to-zinc-950";
    if (primary.includes("adventure")) return "from-amber-950/60 via-zinc-900/90 to-zinc-950";
    if (primary.includes("fantasy")) return "from-violet-950/60 via-zinc-900/90 to-zinc-950";
    if (primary.includes("science") || primary.includes("sci")) return "from-indigo-950/60 via-zinc-900/90 to-zinc-950";
    if (primary.includes("crime")) return "from-zinc-800/60 via-zinc-900/90 to-zinc-950";
    if (primary.includes("drama")) return "from-blue-950/60 via-zinc-900/90 to-zinc-950";
    if (primary.includes("thriller")) return "from-orange-950/60 via-zinc-900/90 to-zinc-950";
    if (primary.includes("comedy")) return "from-yellow-950/40 via-zinc-900/90 to-zinc-950";
    if (primary.includes("romance")) return "from-rose-950/60 via-zinc-900/90 to-zinc-950";
    if (primary.includes("horror")) return "from-stone-900 via-stone-950 to-black";
    if (primary.includes("mystery")) return "from-teal-950/60 via-zinc-900/90 to-zinc-950";
    return "from-purple-950/60 via-zinc-900/90 to-zinc-950";
  };

  const getGenreBadgeColor = (genre: string) => {
    const g = genre.toLowerCase();
    if (g.includes("action")) return "bg-red-500/10 text-red-400 border-red-500/20";
    if (g.includes("adventure")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (g.includes("fantasy")) return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (g.includes("science") || g.includes("sci")) return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    if (g.includes("drama")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (g.includes("comedy")) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    if (g.includes("thriller")) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    if (g.includes("romance")) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  };

  const handleSelectMovie = async (movie: Movie) => {
    setSelectedMovie(movie);
    setSearchQuery("");
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    
    // Fetch live similarity recommendations from Flask backend on-the-fly
    setLoadingRecommendations(true);
    setRecommendedMovies([]);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/recommend?id=${movie.id}`);
      if (!response.ok) {
        throw new Error("Failed to compute recommendations");
      }
      const data = await response.json();
      setRecommendedMovies(data.recommendations);
    } catch (err) {
      console.error("Error fetching live recommendations:", err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Default featured movies (top 8 by popularity score in the loaded dataset)
  const featuredMovies = movies
    .slice()
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 8);

  return (
    <main className="min-h-screen relative grid-bg flex flex-col items-center pb-16 px-4 md:px-8 select-none">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-100px] left-[5%] w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
      
      {/* Navbar */}
      <header className="w-full max-w-7xl flex items-center justify-between py-6 z-10 border-b border-white/5 mb-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedMovie(null)}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center glow-button-primary">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent tracking-tight">
            Movie<span className="text-cyan-400 font-semibold">Match</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-7xl flex flex-col items-center z-10">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <p className="text-zinc-400 text-sm animate-pulse">Initializing intelligent recommendation server connection...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="w-full max-w-2xl glass-panel p-8 rounded-2xl border-red-500/20 text-center flex flex-col items-center gap-4 my-16">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
              <X className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Backend Connection Error</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* 1. Global Search Block */}
            <div className="w-full max-w-2xl flex flex-col items-center mb-12 text-center">
              {!selectedMovie && (
                <div className="mb-6 animate-fade-in">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/5 text-violet-400 text-[11px] font-semibold border border-violet-500/10 mb-4 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Live Python Machine Learning API
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                    Find Movies You'll <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent glow-text-primary">Love</span>
                  </h1>
                  <p className="text-zinc-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                    Type a movie title you enjoy. Our live CountVectorizer and Cosine Similarity model calculates mathematically matching recommendations on the fly.
                  </p>
                </div>
              )}

              {/* Search Box */}
              <div className="w-full relative" ref={suggestionsRef}>
                <div className="w-full h-14 rounded-2xl glass-panel flex items-center px-4 gap-3 glow-border-primary border border-white/10 shadow-xl transition-all">
                  <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Enter movie title (e.g. Avatar, The Dark Knight, Inception)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-transparent border-none outline-none text-white placeholder-zinc-500 text-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="text-zinc-400 hover:text-white transition p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-[60px] left-0 w-full glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-30 max-h-72 overflow-y-auto">
                    {suggestions.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => handleSelectMovie(movie)}
                        className="w-full px-5 py-3.5 hover:bg-white/5 text-left text-zinc-300 hover:text-white cursor-pointer transition flex items-center justify-between border-b border-white/5"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{movie.title}</span>
                          <span className="text-[11px] text-zinc-500 mt-0.5">
                            {movie.genres.join(" • ")} {movie.release_date ? `| ${movie.release_date.split("-")[0]}` : ""}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                )}

                {showSuggestions && searchQuery.trim() && suggestions.length === 0 && (
                  <div className="absolute top-[60px] left-0 w-full glass-panel rounded-2xl border border-white/10 p-5 text-zinc-500 text-sm z-30">
                    No matching movies found in database
                  </div>
                )}
              </div>
            </div>

            {/* 2. Selected Movie Detail Page */}
            {selectedMovie && (
              <div className="w-full animate-fade-in">
                {/* Back Button */}
                <button 
                  onClick={() => setSelectedMovie(null)}
                  className="mb-6 flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Back to Dashboard
                </button>

                {/* Hero Profile Block */}
                <div 
                  className={`w-full rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl relative mb-12 bg-gradient-to-br ${getGenreGradient(selectedMovie.genres)}`}
                >
                  <div className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row gap-8 items-stretch">
                    {/* Stylized Movie Ticket / Info Widget */}
                    <div className="w-full md:w-56 shrink-0 rounded-2xl overflow-hidden glass-card border border-white/10 p-6 flex flex-col items-center justify-between shadow-lg relative bg-black/40 min-h-[260px]">
                      {/* Decorative border ticket dashes */}
                      <div className="absolute left-[-8px] top-[50%] -translate-y-1/2 w-4 h-8 rounded-full bg-zinc-950 border-r border-white/10 animate-pulse" />
                      <div className="absolute right-[-8px] top-[50%] -translate-y-1/2 w-4 h-8 rounded-full bg-zinc-950 border-l border-white/10 animate-pulse" />
                      
                      <div className="flex flex-col items-center gap-3 w-full">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-violet-500/20 to-cyan-500/20 flex items-center justify-center border border-violet-500/30 glow-button-primary">
                          <Film className="w-7 h-7 text-violet-400" />
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Database ID</div>
                          <div className="text-sm font-mono text-zinc-300 font-bold">#{selectedMovie.id}</div>
                        </div>
                      </div>

                      <div className="w-full border-t border-dashed border-white/10 my-4" />

                      <div className="flex flex-col items-center justify-center w-full gap-2">
                        {/* Circular Rating Meter */}
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-zinc-800"
                              strokeWidth="2.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-violet-500"
                              strokeDasharray={`${selectedMovie.vote_average * 10}, 100`}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute text-sm font-black text-white">{selectedMovie.vote_average.toFixed(1)}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Rating Score</span>
                      </div>
                    </div>

                    {/* Metadata Detail */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {selectedMovie.genres.map(genre => (
                            <span 
                              key={genre}
                              className={`px-3 py-1 rounded-full border text-[10px] font-bold ${getGenreBadgeColor(genre)}`}
                            >
                              {genre}
                            </span>
                          ))}
                        </div>

                        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                          {selectedMovie.title}
                        </h2>

                        {/* Info bar */}
                        <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs text-zinc-400 font-medium mb-6">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-violet-400" />
                            <span>{selectedMovie.release_date ? selectedMovie.release_date.split("-")[0] : "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-violet-400" />
                            <span>{selectedMovie.runtime > 0 ? `${selectedMovie.runtime} min` : "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-violet-400" />
                            <span>Pop: {Math.round(selectedMovie.popularity)}</span>
                          </div>
                        </div>

                        <p className="text-zinc-300 text-sm leading-relaxed mb-8 max-w-3xl">
                          {selectedMovie.overview}
                        </p>
                      </div>

                      {/* Director & Cast Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-6 text-xs mt-auto">
                        {selectedMovie.director && (
                          <div className="flex gap-2.5 items-center">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 border border-white/5">
                              <Award className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Director</div>
                              <div className="text-white font-medium">{selectedMovie.director}</div>
                            </div>
                          </div>
                        )}
                        {selectedMovie.cast.length > 0 && (
                          <div className="flex gap-2.5 items-center">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 border border-white/5">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Top Cast</div>
                              <div className="text-white font-medium">{selectedMovie.cast.join(", ")}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations Grid Title */}
                <div className="mb-6 flex items-center gap-2">
                  <div className="w-2 h-5 rounded bg-violet-600 animate-pulse" />
                  <h3 className="text-xl font-extrabold text-white">Recommended For You</h3>
                  <span className="text-[10px] bg-violet-600/15 border border-violet-500/20 text-violet-400 font-bold px-2 py-0.5 rounded-full ml-2">ML Content Matches</span>
                </div>

                {/* Recommendations Loading State */}
                {loadingRecommendations && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                    <p className="text-zinc-500 text-xs animate-pulse">Running PorterStemmer and computing similarity vectors live...</p>
                  </div>
                )}

                {/* Cards row */}
                {!loadingRecommendations && recommendedMovies.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {recommendedMovies.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => handleSelectMovie(movie)}
                        className="group cursor-pointer rounded-2xl overflow-hidden glass-card glass-card-hoverable flex flex-col h-full border border-white/5 p-5 hover:scale-[1.02] transform transition"
                      >
                        {/* Card header: Rating and Genre */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${getGenreBadgeColor(movie.genres[0])}`}>
                            {movie.genres[0]}
                          </span>
                          
                          <div className="px-2 py-0.5 rounded-md bg-zinc-950/80 border border-white/10 text-[9px] font-black text-white flex items-center gap-0.5 shrink-0">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span>{movie.vote_average.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-base font-extrabold text-white group-hover:text-violet-300 transition line-clamp-1 leading-snug mb-2">
                          {movie.title}
                        </h4>

                        {/* Snippet overview */}
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-5">
                          {movie.overview}
                        </p>

                        {/* Footer metadata */}
                        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            {movie.release_date ? movie.release_date.split("-")[0] : "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {movie.runtime > 0 ? `${movie.runtime} min` : "N/A"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Initial Popular Showcase Dashboard */}
            {!selectedMovie && (
              <div className="w-full mt-8 animate-fade-in">
                <div className="mb-6 flex items-center gap-2">
                  <div className="w-2 h-5 rounded bg-cyan-500 animate-pulse" />
                  <h3 className="text-xl font-extrabold text-white">Popular Movies</h3>
                  <span className="text-[10px] bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 font-bold px-2 py-0.5 rounded-full ml-2">Trending</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredMovies.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => handleSelectMovie(movie)}
                      className="group cursor-pointer rounded-2xl overflow-hidden glass-card glass-card-hoverable flex flex-row items-center border border-white/5 p-4 hover:scale-[1.01] transform transition duration-300 h-28"
                    >
                      {/* Left Styled Genre/Index Emblem */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/10 to-violet-500/10 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-cyan-500/30 transition">
                        <Sparkles className="w-5 h-5 text-cyan-400 group-hover:text-violet-400 transition" />
                      </div>

                      {/* Right Text Detail */}
                      <div className="flex-1 pl-4 h-full flex flex-col justify-center min-w-0">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider line-clamp-1 mb-0.5">
                          {movie.genres.slice(0, 2).join(" • ")}
                        </span>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition line-clamp-1 leading-snug">
                          {movie.title}
                        </h4>
                        
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500 font-medium">
                          <span className="flex items-center gap-0.5 text-zinc-400 font-bold">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
                            {movie.vote_average.toFixed(1)}
                          </span>
                          <span>{movie.release_date ? movie.release_date.split("-")[0] : "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
