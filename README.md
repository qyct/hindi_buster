# Hindi Buster

A single-page web application for learning Hindi vocabulary through interactive matching quizzes.

## Features

- **Weighted Random Selection**: High-frequency words appear more often in quizzes
- **10 Hindi Words**: Each quiz displays 10 Hindi words to translate
- **20 English Options**: Includes 10 correct answers + 10 distractor words for added challenge
- **Two Input Methods**:
  - Click to select, then click to place
  - Drag and drop English words into answer slots
- **One Word Per Slot**: Each English word can only be used once
- **Hint System**: Click "!" button to highlight the correct answer
- **Persistent Statistics**: Tracks Correct, Wrong, and Hints across sessions (localStorage)
- **Single Page Layout**: Everything fits on screen without scrolling

## File Structure

```
hindi_buster/
├── index.html          # Main HTML file
├── README.md           # This file
└── res/
    ├── app.js          # Application logic
    ├── style.css       # Styling
    └── words.csv       # Hindi-English word database with frequency
```

## Setup Instructions

1. Open `index.html` in a web browser
2. The quiz auto-generates on first load
3. Data is cached in localStorage after first fetch

## How to Play

1. **Match Words**: Click or drag English words to match with Hindi words
2. **Get Hints**: Click the "!" button next to any Hindi word to highlight the correct answer
3. **Check Answers**: Click "Check" to see your score
4. **Clear**: Click "Clear" to reset the current quiz (keeps statistics)
5. **Generate**: Click "Generate" for a new set of words (keeps statistics)

## Statistics

- **Correct**: Total correct answers across all sessions
- **Wrong**: Total wrong answers across all sessions
- **Hints**: Total hints used across all sessions

Statistics persist in localStorage and only reset when:
- Browser cache is cleared
- localStorage is manually cleared

## Technical Details

### Data Format (words.csv)

```csv
hindi,english,freq
नमस्ते,Hello,100
धन्यवाद,Thank you,95
...
```

- `hindi`: Hindi word
- `english`: English translation
- `freq`: Frequency weight (higher = more likely to appear)

### Storage Keys

- `hindi_words_v1`: Cached word database
- `hindi_buster_stats`: User statistics (correct, wrong, hints)

### Key Design Decisions

1. **20 English Options for 10 Hindi Words**: Increases difficulty by adding distractor words
2. **One-to-One Matching**: Each English word can only be used once per quiz
3. **Persistent Stats**: Statistics accumulate across sessions to track long-term progress
4. **Weighted Random**: Common words appear more frequently for better learning
5. **Single Page**: No scrolling required - everything fits in viewport
6. **LocalStorage Caching**: CSV data loads once and caches for instant subsequent loads

### Browser Compatibility

- Modern browsers with ES6+ support
- LocalStorage support required
- Drag and drop API support

## Customization

### Change Quiz Size

Edit `res/app.js`:
```javascript
// Line 29: Change quiz word count
const quizData = generateQuiz(10, 10); // (quiz words, distractor words)

// Example: 15 Hindi words with 10 distractors
const quizData = generateQuiz(15, 10);
```

### Change Word Selection Algorithm

Edit `generateQuiz()` function in `res/app.js` to modify how words are selected.

### Adjust Styling

Edit `res/style.css` to customize colors, fonts, and layout.
