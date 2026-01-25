# Hindi Buster

A single-page web application for learning Hindi vocabulary through interactive matching quizzes.

## Features

- **Weighted Random Selection**: High-frequency words appear more often in quizzes
- **10 Hindi Words**: Each quiz displays 10 Hindi words to translate
- **10 English Options**: 10 correct answers to match with 10 Hindi words
- **Full Width Layout**: App spans entire screen width for optimal space usage
- **Normal Page Scroll**: All sections scroll naturally as part of the page
- **Two Input Methods**:
  - Click to select, then click to place
  - Drag and drop English words into answer slots
- **One Word Per Slot**: Each English word can only be used once per quiz
- **Hint System**: Click "!" button to highlight the correct answer
- **Frequency Badges**: Shows word frequency (e.g., 125k, 1.5M) for learning priority
- **Session Statistics**: Tracks Correct, Wrong, and Hints (resets on page refresh)
- **Single Column Layout**: 10 Hindi words stacked vertically
- **Compact Design**: Optimized font sizes and spacing for readability on all screens
- **Mobile-First Design**: Single column layout optimized for all devices
- **Fixed Stats Bar**: Statistics always visible at bottom, quiz scrolls independently

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
3. **Check Answers**: Click ✓ to see your score
4. **Clear**: Click ✕ to reset the current quiz (statistics preserved)
5. **Generate**: Click ↻ for a new set of words (statistics preserved)

### UI Icons

- **↻** (Generate) - Load a new set of random words
- **✕** (Clear) - Clear all answers in current quiz
- **✓** (Check) - Check your answers and update statistics
- **!** (Hint) - Highlight the correct answer for a word

### Frequency Badges

Each Hindi word has a frequency badge showing its usage:
- **M** = Millions (e.g., 2.5M, 150M)
- **k** = Thousands (e.g., 125k, 50.3k)
- **h** = Hundreds (e.g., 7.5h)
- Higher frequency = more common word = appears more often in quizzes

## Statistics

Statistics are displayed at the bottom of the page:

- **Correct**: Total correct answers (green)
- **Wrong**: Total wrong answers (red)
- **Hints**: Total hints used (orange)

**Statistics Behavior:**
- Persist across Generate and Clear button clicks
- Reset to 0 on page refresh
- Each unique answer is only counted once per quiz session
- Prevents double-counting when checking the same answer multiple times

## Layout

- **Mobile-First Design**: Single column layout with 10 words stacked vertically
- **Full Width**: App spans entire screen width with no max-width constraints
- **Consistent Experience**: Same layout on mobile, tablet, and desktop
- **Flat Structure**: Header, Hindi words, English options, and Stats all at same level
- **Normal Page Scroll**: All sections scroll naturally as part of the document
- **Centered English Options**: English words centered and wrap on multiple lines
- **Compact Design**: Reduced padding and font sizes for efficient use of space
- **Simplified CSS**: Clean, straightforward styling without complexity
- **Minimal Nesting**: HTML structure optimized with no unnecessary divs

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

- `hindi_words_v1`: Cached word database (persists across sessions)

### Key Design Decisions

1. **10 English Options for 10 Hindi Words**: Direct matching without distractors for focused learning
2. **One-to-One Matching**: Each English word can only be used once per quiz
3. **Session-Only Stats**: Statistics reset on page refresh for clean slate each session
4. **Weighted Random**: Common words appear more frequently for better learning
5. **Mobile-First Design**: Single column layout works identically on all devices without media queries
6. **Full Width Layout**: No max-width constraints, app uses entire screen width
7. **Normal Page Scrolling**: All sections flow naturally in document with standard scroll
8. **Flat HTML Structure**: Minimal nesting, all main sections at same level
9. **Wrapped English Options**: Words wrap naturally on multiple lines
10. **Simplified CSS**: Clean, minimal styling without complex animations
11. **LocalStorage Caching**: CSV data loads once and caches for instant subsequent loads
12. **Unicode Icons**: Standard Unicode symbols for buttons (lightweight, scalable)
13. **Frequency Badges**: Shows relative word importance with abbreviated format
14. **Click Outside to Deselect**: Clicking outside interactive elements clears selection
15. **Compact UI**: Minimal padding and font sizes for efficient space usage

### Interaction Details

- Used English words become grayed out and cannot be selected again
- Clicking outside answer slots deselects selected English words
- Hints show pulsing animation on the correct answer
- Drag and drop support for English words into answer slots
- English options wrap naturally and are centered on screen
- All sections scroll together as normal page content

### Browser Compatibility

- Modern browsers with ES6+ support
- LocalStorage support required
- Drag and drop API support
- CSS Grid and Flexbox support

## Customization

### Change Quiz Size

Edit `res/app.js`:
```javascript
// Change quiz word count (first parameter)
const quizData = generateQuiz(10, 0); // (quiz words, extra words)

// Example: 15 Hindi words with 5 extra options
const quizData = generateQuiz(15, 5);
```

### Change Word Selection Algorithm

Edit `generateQuiz()` function in `res/app.js` to modify how words are selected.

### Adjust Styling

Edit `res/style.css` to customize:
- Colors (search for color codes like `#4CAF50`, `#ff9800`)
- Fonts (modify `font-family` in `body`)
- Spacing (modify `gap`, `padding` values)
- Layout is full-width by default, can add max-width if needed

### Change Frequency Badge Formatting

Edit `formatFrequency()` function in `res/app.js` to change how frequencies are displayed.
