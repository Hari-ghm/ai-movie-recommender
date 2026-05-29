# TMDB Movie Recommendation System

An intelligent, full-stack movie recommendation platform built with a machine learning content-based filtering backend and a modern, responsive web frontend. 

The application utilizes Natural Language Processing (NLP) techniques, including token stemmers and vectorizers, to calculate mathematical similarities between movies on the fly based on metadata like overviews, genres, cast members, directors, and keywords.

---



## Technology Stack

### Backend (Python Engine)
* **Flask & Flask-CORS**: Lightweight web framework and middleware configured to serve recommendations and search autocomplete catalogs securely to cross-origin consumers.
* **Pandas & NumPy**: Core libraries for dataset manipulation, filtering, handling of missing items, and matrix structure execution.
* **NLTK (Natural Language Toolkit)**: Implements the `PorterStemmer` algorithm to stem movie tags, converting words back to their base morphological form to improve vocabulary match rates.
* **Scikit-learn**:
  * `CountVectorizer`: Converts preprocessed, stemmed tag text into a 5,000-dimensional bag-of-words matrix, stripping standard English stop words in the process.
  * `cosine_similarity`: Computes pairwise cosine similarity coefficients across the vector space to establish distances between movies.
* **Gunicorn**: High-performance production WSGI HTTP server to execute the Flask application.

### Frontend (Next.js Application)
* **Next.js 16 (React 19, App Router)**: High-performance, components-driven web architecture configured for clean user experience with client-side state management.
* **TypeScript**: Type safety for consistent API payload parsing and component prop validation.
* **Tailwind CSS v4**: Utility-first CSS processing for visual components, including dynamic genre gradients, blurred backdrop layout highlights, and micro-interactions.
* **Lucide React**: Modular vector icons for streamlined, consistent web dashboard navigation.

---

## Machine Learning Pipeline & Processing Flow

### 1. Ingestion & Preprocessing
The application loads raw metadata from `tmdb_5000_movies.csv` and `tmdb_5000_credits.csv` and performs an inner merge on the shared column `title`. 

Selected columns include: `movie_id`, `title`, `overview`, `genres`, `keywords`, `cast`, and `crew`. Rows with missing critical identifiers or descriptions are pruned to maintain consistency.

### 2. Feature Extraction & Parsing
* Columns containing JSON array strings (`genres`, `keywords`, `cast`, `crew`) are evaluated using `ast.literal_eval`.
* Extract all genre names and keyword tags.
* Retrieve the top three billed actors from the cast list.
* Locate and extract the Director's name from the crew list.

### 3. Space Collapse Tokenization
To prevent multi-word names or terms from being broken up into independent vector terms by tokenizers, white spaces in genres, cast members, and directors are collapsed:
* `"Science Fiction"` becomes `"ScienceFiction"`
* `"Johnny Depp"` becomes `"JohnnyDepp"`
* `"Christopher Nolan"` becomes `"ChristopherNolan"`

### 4. Text Concat & Stemming
All elements (overview tokens, collapsed genres, keywords, cast names, and director names) are joined into a lowercase tag string. The Porter Stemmer reduces word endings to their root vocabulary:
* `"loved"`, `"loving"`, `"loves"` become `"love"`
* `"action-packed"`, `"actions"`, `"actor"` become `"action"`, `"actor"`

This reduces vocabulary noise and allows semantic matches to align cleanly.

### 5. Vector Representation & Similarity Compute
The corpus of stems is transformed into numeric values using scikit-learn's `CountVectorizer`, which creates a matrix representing the 5,000 most frequent tokens across all movies. Pairwise cosine similarity is evaluated:

$$\text{Cosine Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}$$

A score close to `1.0` denotes that the two movies share highly correlated term combinations in their metadata, while `0.0` denotes completely unrelated content profiles.

---

## Setup & Running Locally

Follow these guidelines to set up and run both the Flask backend engine and the Next.js web application on your local machine.

### Prerequisites
* Python 3.10 or higher installed
* Node.js v18.0 or higher installed

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Hari-ghm/ai-movie-recommender.git
cd ai-movie-recommender
```

---

### Step 2: Configure the Backend (Python)

1. **Create and Activate a Virtual Environment**:
   * On Windows:
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   * On macOS/Linux:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

2. **Install Required Packages**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Obtain the Datasets**:
   Ensure you place the two database CSV files inside the root directory where `app.py` resides:
   * `tmdb_5000_movies.csv`
   * `tmdb_5000_credits.csv`
   
   *(If you need to retrieve these, they are hosted publicly on Kaggle under the [TMDb 5000 Movie Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata) name).*

4. **Run the Flask Backend Server**:
   ```bash
   python app.py
   ```
   The backend initializes, downloads/validates the dataset paths, builds the vector space models, precomputes the similarity matrix, and binds to: `http://127.0.0.1:5000`.

---

### Step 3: Configure the Frontend (Next.js)

1. **Open a New Terminal and Navigate to the Frontend Folder**:
   ```bash
   cd frontend
   ```

2. **Install Dependency Tree**:
   ```bash
   npm install
   ```

3. **Verify API Configuration**:
   The frontend communicates with the local Flask server at `http://127.0.0.1:5000`. Ensure that this matches the target endpoint defined inside [page.tsx](file:///d:/movie_recommender/frontend/src/app/page.tsx#L19).

4. **Launch the Web Development Server**:
   ```bash
   npm run dev
   ```
   The dev server binds to: `http://localhost:3000`.

5. **Interact with the Platform**:
   Open `http://localhost:3000` in your web browser. You will see a dashboard showcasing trending/popular movies. Use the search input box to search for any movie in the TMDb catalog. Selecting a suggestion will trigger live similarity calculation on the Flask backend, displaying the matching recommendation list on-screen immediately.

---

