import os
import ast
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from nltk.stem.porter import PorterStemmer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)  # Enable CORS for all cross-origin requests

# Global variables to store memory-cached datasets and vectors
movies_df = None
similarity_matrix = None
movies_catalog = []  # Compact representation for frontend search autocomplete
movies_map = {}      # Fast lookup for movie ID -> index

def load_and_build_model():
    global movies_df, similarity_matrix, movies_catalog, movies_map
    
    print("Loading dataset from Kaggle...")

    #loading datasets
    movies_path = "tmdb_5000_movies.csv"
    credits_path = "tmdb_5000_credits.csv"

    if not os.path.exists(movies_path):
        raise FileNotFoundError(f"Movies dataset not found at: {movies_path}")
    if not os.path.exists(credits_path):
        raise FileNotFoundError(f"Credits dataset not found at: {credits_path}")

    movies = pd.read_csv(movies_path)
    credits = pd.read_csv(credits_path)

    print("Merging datasets...")
    movies = movies.merge(credits, on="title")
    
    # 2. Select key columns
    movies_clean = movies[[
        'movie_id', 'title', 'overview', 'genres', 'keywords', 
        'cast', 'crew', 'release_date', 'vote_average', 'popularity', 'runtime'
    ]].copy()
    
    movies_clean.dropna(subset=['overview', 'title', 'movie_id'], inplace=True)
    movies_clean.reset_index(drop=True, inplace=True)

    # 3. Parsing helper functions
    def convert_genres_keywords(obj):
        if pd.isna(obj):
            return []
        try:
            return [i['name'] for i in ast.literal_eval(obj)]
        except Exception:
            return []

    def convert_cast(obj):
        if pd.isna(obj):
            return []
        try:
            lst = []
            for a, i in enumerate(ast.literal_eval(obj)):
                if a < 3:
                    lst.append(i['name'])
                else:
                    break
            return lst
        except Exception:
            return []

    def fetch_director(obj):
        if pd.isna(obj):
            return ""
        try:
            for i in ast.literal_eval(obj):
                if i['job'] == 'Director':
                    return i['name']
            return ""
        except Exception:
            return ""

    # Apply parsing conversions
    movies_clean['genres_list'] = movies_clean['genres'].apply(convert_genres_keywords)
    movies_clean['keywords_list'] = movies_clean['keywords'].apply(convert_genres_keywords)
    movies_clean['cast_list'] = movies_clean['cast'].apply(convert_cast)
    movies_clean['director'] = movies_clean['crew'].apply(fetch_director)

    # 4. Generate joint tags for vector space
    def collapse(L):
        return [i.replace(" ", "") for i in L] if L else []

    genres_collapsed = movies_clean['genres_list'].apply(collapse)
    keywords_collapsed = movies_clean['keywords_list'].apply(collapse)
    cast_collapsed = movies_clean['cast_list'].apply(collapse)
    director_collapsed = movies_clean['director'].apply(lambda x: [x.replace(" ", "")] if x else [])
    overview_words = movies_clean['overview'].apply(lambda x: str(x).split())

    movies_clean['tags'] = overview_words + genres_collapsed + keywords_collapsed + cast_collapsed + director_collapsed
    movies_clean['tags_str'] = movies_clean['tags'].apply(lambda x: " ".join(x)).apply(lambda x: x.lower())

    # 5. Porter Stemmer
    ps = PorterStemmer()
    def stem(text):
        return " ".join([ps.stem(i) for i in text.split()])

    movies_clean['tags_stemmed'] = movies_clean['tags_str'].apply(stem)

    # 6. Fit Vectorizer and precompute Cosine Similarity Matrix
    print("Vectorizing tags and computing similarity matrix...")
    cv = CountVectorizer(max_features=5000, stop_words="english")
    vectors = cv.fit_transform(movies_clean['tags_stemmed']).toarray()
    similarity_matrix = cosine_similarity(vectors)

    # 7. Extract the dataset for fast memory accesses
    movies_df = movies_clean
    movies_catalog = []
    movies_map = {}

    for idx, row in enumerate(movies_clean.itertuples()):
        movie_id = int(row.movie_id)
        movies_map[movie_id] = idx
        
        movies_catalog.append({
            'id': movie_id,
            'title': str(row.title),
            'overview': str(row.overview),
            'genres': row.genres_list,
            'cast': row.cast_list,
            'director': str(row.director),
            'release_date': str(row.release_date) if not pd.isna(row.release_date) else "N/A",
            'vote_average': float(row.vote_average) if not pd.isna(row.vote_average) else 0.0,
            'popularity': float(row.popularity) if not pd.isna(row.popularity) else 0.0,
            'runtime': float(row.runtime) if not pd.isna(row.runtime) else 0.0
        })
        
    print(f"Model successfully built. Loaded {len(movies_catalog)} movies.")

# Load model upon startup
try:
    load_and_build_model()
except Exception as e:
    print(f"Error loading model on startup: {e}")

@app.route('/api/movies', methods=['GET'])
def get_movies():
    """
    Returns lightweight list of movies for search suggestions
    """
    if not movies_catalog:
        return jsonify({"error": "Model not loaded"}), 500
        
    return jsonify(movies_catalog)

@app.route('/api/recommend', methods=['GET'])
def recommend():
    """
    Dynamic endpoint to retrieve recommendations for a given movie ID on the fly
    """
    if similarity_matrix is None or movies_df is None:
        return jsonify({"error": "Model not loaded"}), 500
        
    movie_id_str = request.args.get('id')
    if not movie_id_str:
        return jsonify({"error": "Missing parameter 'id'"}), 400
        
    try:
        movie_id = int(movie_id_str)
    except ValueError:
        return jsonify({"error": "Parameter 'id' must be an integer"}), 400

    if movie_id not in movies_map:
        return jsonify({"error": f"Movie ID {movie_id} not found in database"}), 404

    # Calculate recommendations
    idx = movies_map[movie_id]
    distances = similarity_matrix[idx]
    
    # Sort distances and get top 9 similar movies (excluding self which is index 0 in distances list)
    recommended_indices = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:10]
    
    recs = []
    for r_idx, score in recommended_indices:
        recs.append(movies_catalog[r_idx])
        
    selected_movie = movies_catalog[idx]
    
    return jsonify({
        "movie": selected_movie,
        "recommendations": recs
    })

if __name__ == "__main__":
    # Standard Flask port
    app.run(host="127.0.0.1", port=5000, debug=True)
