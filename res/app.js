const STORAGE_KEY = "hindi_words_v1";
const FLAGGED_KEY = "hindi_flagged_words";
const STATS_KEY = "hindi_stats";
const SEED_KEY = "hindi_current_seed";
let WORDS = [];
let TOTAL_FREQ = 0;
let currentQuiz = [];
let currentSeed = null;
let hintsUsed = 0;
let totalCorrect = 0;
let totalWrong = 0;
let totalHints = 0;
let checkedAnswers = new Set();
let flaggedWords = new Set();

// Simple seeded random number generator
function seededRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Generate a numeric seed from a string seed
function stringToSeed(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// Generate a random 2-letter alphabet seed
function generateRandomSeed() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let seed = '';
    for (let i = 0; i < 2; i++) {
        seed += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return seed;
}

// Increment seed (aa -> ab, az -> ba, zz -> aa)
function incrementSeed(seed) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let first = seed.charAt(0);
    let second = seed.charAt(1);

    if (second === 'z') {
        second = 'a';
        first = first === 'z' ? 'a' : letters.charAt(letters.indexOf(first) + 1);
    } else {
        second = letters.charAt(letters.indexOf(second) + 1);
    }

    return first + second;
}

// Decrement seed (aa -> zz, ab -> aa, ba -> az)
function decrementSeed(seed) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let first = seed.charAt(0);
    let second = seed.charAt(1);

    if (second === 'a') {
        second = 'z';
        first = first === 'a' ? 'z' : letters.charAt(letters.indexOf(first) - 1);
    } else {
        second = letters.charAt(letters.indexOf(second) - 1);
    }

    return first + second;
}

// Save seed to localStorage
function saveSeed(seed) {
    localStorage.setItem(SEED_KEY, seed);
}

// Load seed from localStorage
function loadSeed() {
    return localStorage.getItem(SEED_KEY);
}

// Format frequency number to abbreviated form
function formatFrequency(freq) {
    if (freq >= 1000000) {
        const m = freq / 1000000;
        return (m >= 100 ? m.toFixed(0) : m.toFixed(1)) + 'M';
    } else if (freq >= 1000) {
        const k = freq / 1000;
        return (k >= 100 ? k.toFixed(0) : k.toFixed(1)) + 'k';
    } else if (freq >= 100) {
        const h = freq / 100;
        return h.toFixed(1) + 'h';
    }
    return freq.toString();
}

// Load flagged words from localStorage
function loadFlaggedWords() {
    const flagged = localStorage.getItem(FLAGGED_KEY);
    if (flagged) {
        flaggedWords = new Set(JSON.parse(flagged));
    }
    updateFlaggedCount();
}

// Save flagged words to localStorage
function saveFlaggedWords() {
    localStorage.setItem(FLAGGED_KEY, JSON.stringify([...flaggedWords]));
    updateFlaggedCount();
}

// Load stats from localStorage
function loadStats() {
    const stats = localStorage.getItem(STATS_KEY);
    if (stats) {
        const parsedStats = JSON.parse(stats);
        totalCorrect = parsedStats.correct || 0;
        totalWrong = parsedStats.wrong || 0;
        totalHints = parsedStats.hints || 0;
        updateResultDisplay();
    }
}

// Save stats to localStorage
function saveStats() {
    const stats = {
        correct: totalCorrect,
        wrong: totalWrong,
        hints: totalHints
    };
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

// Update flagged count display
function updateFlaggedCount() {
    const flaggedCount = document.getElementById("flagged-count");
    if (flaggedCount) flaggedCount.textContent = flaggedWords.size;
}

// Toggle flag on a word
function toggleFlag(word) {
    if (flaggedWords.has(word)) {
        flaggedWords.delete(word);
    } else {
        flaggedWords.add(word);
    }
    saveFlaggedWords();
}

// Check if a word is flagged
function isFlagged(word) {
    return flaggedWords.has(word);
}

// Load CSV once and cache
async function loadWords() {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
        WORDS = JSON.parse(cached);
        TOTAL_FREQ = WORDS.reduce((s, w) => s + w.freq, 0);
        console.log("Loaded from LocalStorage:", WORDS.length);
    } else {
        const response = await fetch("res/words.csv");
        const text = await response.text();
        WORDS = parseCSV(text);
        TOTAL_FREQ = WORDS.reduce((s, w) => s + w.freq, 0);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(WORDS));
        console.log("Fetched CSV and cached:", WORDS.length);
    }

    // Load flagged words and stats
    loadFlaggedWords();
    loadStats();

    // Auto-generate quiz on load with saved seed or random
    const savedSeed = loadSeed();
    const seed = savedSeed || generateRandomSeed();
    loadQuizForSeed(seed);
}

// CSV parser (headers: hindi,english,freq)
function parseCSV(text) {
    const lines = text.trim().split("\n");
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const [hindi, english, freq] = lines[i].split(",");
        data.push({
            hindi: hindi.trim(),
            english: english.trim(),
            freq: Number(freq)
        });
    }
    return data;
}

// Generate quiz words based on a seed
function generateQuizForSeed(seed, count = 100) {
    const seedValue = stringToSeed(seed);
    const selected = new Set();
    let randomSeed = seedValue;

    // Select words for the quiz
    while (selected.size < count) {
        // Use seeded random
        let r = seededRandom(randomSeed) * TOTAL_FREQ;
        randomSeed++;

        for (const w of WORDS) {
            r -= w.freq;
            if (r <= 0) {
                selected.add(w);
                break;
            }
        }
    }

    return Array.from(selected);
}

// Get all unique English words for dropdown options
function getAllEnglishOptions(quizWords) {
    // Get unique English words (in case multiple Hindi words have same English translation)
    const uniqueEnglish = new Map();
    quizWords.forEach(word => {
        uniqueEnglish.set(word.english, word);
    });
    return Array.from(uniqueEnglish.values());
}

// Load quiz for a specific seed
function loadQuizForSeed(seed) {
    // Validate seed - only 2 letters allowed
    const validatedSeed = seed.toLowerCase().replace(/[^a-z]/g, '').substring(0, 2);
    const finalSeed = validatedSeed || generateRandomSeed();

    currentSeed = finalSeed;
    document.getElementById("quiz-seed").value = finalSeed;
    saveSeed(finalSeed);

    currentQuiz = generateQuizForSeed(finalSeed, 100);
    hintsUsed = 0;
    checkedAnswers.clear();
    renderQuiz();
    updateResultDisplay();
}

// Render quiz with dropdowns
function renderQuiz() {
    const hindiContainer = document.getElementById("hindi-words");
    const englishOptions = getAllEnglishOptions(currentQuiz);

    // Sort English options alphabetically for better UX in dropdown
    englishOptions.sort((a, b) => a.english.localeCompare(b.english));

    // Clear previous
    hindiContainer.innerHTML = "";
    checkedAnswers.clear();

    // Remove any existing datalist
    const existingDatalist = document.getElementById("english-options-list");
    if (existingDatalist) {
        existingDatalist.remove();
    }

    // Create datalist for all English options
    const datalist = document.createElement("datalist");
    datalist.id = "english-options-list";
    englishOptions.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt.english;
        datalist.appendChild(option);
    });
    document.body.appendChild(datalist);

    // Create Hindi words list with dropdowns
    currentQuiz.forEach((word, index) => {
        const row = document.createElement("div");
        row.className = "hindi-row";
        if (isFlagged(word.english)) {
            row.classList.add("flagged");
        }
        const formattedFreq = formatFrequency(word.freq);

        // Create input element with datalist for searchable dropdown
        const input = document.createElement("input");
        input.className = "english-dropdown";
        input.type = "text";
        input.id = `english-input-${index}`;
        input.name = `english-answer-${index}`;
        input.dataset.index = index;
        input.dataset.correctAnswer = word.english;
        input.dataset.hindiWord = word.hindi;
        input.setAttribute("list", "english-options-list");
        input.autocomplete = "off";

        // Hint button
        const hintBtn = document.createElement("button");
        hintBtn.className = "hint-btn";
        hintBtn.textContent = "!";
        hintBtn.title = "Show hint";
        hintBtn.dataset.index = index;

        // Flag button
        const flagBtn = document.createElement("button");
        flagBtn.className = "flag-btn";
        flagBtn.textContent = isFlagged(word.english) ? "⚑" : "⚐";
        flagBtn.title = isFlagged(word.english) ? "Unflag word" : "Flag word";
        flagBtn.dataset.word = word.english;
        flagBtn.dataset.rowIndex = index;
        if (isFlagged(word.english)) {
            flagBtn.classList.add("flagged");
        }

        row.innerHTML = `
            <span class="hindi-word">${word.hindi}</span>
        `;
        row.appendChild(input);

        // Create frequency badge as element (not innerHTML) to preserve event listeners
        const freqBadge = document.createElement("span");
        freqBadge.className = "freq-badge";
        freqBadge.title = `Frequency: ${word.freq}`;
        freqBadge.textContent = formattedFreq;
        row.appendChild(freqBadge);

        row.appendChild(flagBtn);
        row.appendChild(hintBtn);

        hindiContainer.appendChild(row);

        // Track evaluation state to prevent double counting
        let lastEvaluatedValue = "";

        // Helper to check and evaluate answer
        const checkAndEvaluate = () => {
            setTimeout(() => {
                const value = input.value.trim();
                if (!value) {
                    input.classList.remove("correct", "incorrect", "hint-highlight");
                    lastEvaluatedValue = "";
                    return;
                }

                // Prevent double evaluation for the same value
                if (value === lastEvaluatedValue) {
                    return;
                }

                const matchingOption = englishOptions.find(opt =>
                    opt.english.toLowerCase() === value.toLowerCase()
                );

                if (matchingOption) {
                    input.value = matchingOption.english; // Normalize case
                    if (matchingOption.english !== lastEvaluatedValue) {
                        lastEvaluatedValue = matchingOption.english;
                        evaluateAnswer(input, index, matchingOption.english);
                    }
                }
            }, 10);
        };

        // Fires when input loses focus (after selecting from dropdown)
        input.addEventListener("blur", () => {
            checkAndEvaluate();
        });

        // Fires on Enter key
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                checkAndEvaluate();
                input.blur();
            }
        });

        // Fires when input value changes (typing OR dropdown selection)
        input.addEventListener("input", () => {
            checkAndEvaluate();
        });

        // Add click event to hint button
        hintBtn.addEventListener("click", () => {
            showHint(input, index);
        });

        // Add click event to flag button
        flagBtn.addEventListener("click", () => {
            toggleFlag(word.english);
            // Update button appearance
            const isNowFlagged = isFlagged(word.english);
            flagBtn.textContent = isNowFlagged ? "⚑" : "⚐";
            flagBtn.title = isNowFlagged ? "Unflag word" : "Flag word";
            flagBtn.classList.toggle("flagged", isNowFlagged);
            // Update row appearance
            row.classList.toggle("flagged", isNowFlagged);
        });
    });
}

// Show hint - highlight correct answer in dropdown
function showHint(input, index) {
    const correctAnswer = currentQuiz[index].english;

    // Find the correct option and highlight it temporarily
    input.classList.add("hint-highlight");
    input.value = correctAnswer;

    // Increment hint counters
    totalHints++;
    updateResultDisplay();

    // Remove highlight after 2 seconds
    setTimeout(() => {
        input.classList.remove("hint-highlight");
        // Don't reset the value - let the user keep the answer if they want
    }, 2000);
}

// Evaluate a single answer
function evaluateAnswer(input, index, userAnswer) {
    const correctAnswer = currentQuiz[index].english;

    console.log(`Evaluating: index=${index}, user="${userAnswer}", correct="${correctAnswer}"`);

    if (!userAnswer) {
        // No answer selected
        input.classList.remove("correct", "incorrect", "hint-highlight");
        return;
    }

    // Clear previous styling
    input.classList.remove("correct", "incorrect", "hint-highlight");

    // Track if this index was already answered correctly
    const wasCorrect = checkedAnswers.has(`${currentSeed}_${index}_correct`);

    if (userAnswer === correctAnswer) {
        input.classList.add("correct");
        input.disabled = true;  // Freeze correct answers
        // Only count if not already counted as correct
        if (!wasCorrect) {
            totalCorrect++;
            console.log(`✓ Correct! Total correct: ${totalCorrect}`);
        }
        checkedAnswers.add(`${currentSeed}_${index}_correct`);
    } else {
        input.classList.add("incorrect");
        // Only count if not already correct
        if (!wasCorrect) {
            totalWrong++;
            console.log(`✗ Wrong! Total wrong: ${totalWrong}`);
        }
        // Don't mark as checked - allow retry, keep wrong answer visible
    }

    updateResultDisplay();
}

// Update result display
function updateResultDisplay() {
    const correctCount = document.getElementById("correct-count");
    const wrongCount = document.getElementById("wrong-count");
    const hintCount = document.getElementById("hint-count");

    if (correctCount) correctCount.textContent = totalCorrect;
    if (wrongCount) wrongCount.textContent = totalWrong;
    if (hintCount) hintCount.textContent = totalHints;

    // Save stats to localStorage
    saveStats();
}

// Copy flagged words to clipboard
document.getElementById("copy-flagged").addEventListener("click", async () => {
    console.log("Flagged words Set:", Array.from(flaggedWords));

    if (flaggedWords.size === 0) {
        showToast("No flagged words to copy!");
        return;
    }

    // Look up flagged words from the full WORDS array, not just currentQuiz
    const flaggedWordsList = WORDS.filter(w => {
        const isFlagged = flaggedWords.has(w.english);
        console.log(`Checking word: "${w.english}" - flagged: ${isFlagged}`);
        return isFlagged;
    });

    console.log("Found flagged words:", flaggedWordsList);

    const flaggedWordsDetails = flaggedWordsList
        .map(w => `${w.hindi} - ${w.english}`)
        .join(", ");

    console.log("Text to copy:", flaggedWordsDetails);

    try {
        await navigator.clipboard.writeText(flaggedWordsDetails);
        showToast(`Copied ${flaggedWords.size} flagged words to clipboard!`);
    } catch (err) {
        console.error("Failed to copy:", err);
        showToast("Failed to copy to clipboard. Please try again.");
    }
});

// Clear all flagged words and stats
document.getElementById("clear-all").addEventListener("click", () => {
    const flaggedCount = flaggedWords.size;
    const hasStats = totalCorrect > 0 || totalWrong > 0 || totalHints > 0;

    if (flaggedCount === 0 && !hasStats) {
        showToast("Nothing to clear!");
        return;
    }

    // Clear flagged words
    flaggedWords.clear();
    saveFlaggedWords();

    // Clear stats
    totalCorrect = 0;
    totalWrong = 0;
    totalHints = 0;
    updateResultDisplay();

    // Re-render quiz to update flag buttons
    renderQuiz();

    // Show what was cleared
    let message = [];
    if (flaggedCount > 0) message.push(`${flaggedCount} flagged words`);
    if (hasStats) message.push("stats");
    showToast(`Cleared ${message.join(" and ")}!`);
});

// UI - Next button loads quiz for next seed
document.getElementById("next").addEventListener("click", () => {
    const seedInput = document.getElementById("quiz-seed");
    let seed = seedInput.value.trim().toLowerCase() || generateRandomSeed();
    // Only keep letters, max 2
    seed = seed.replace(/[^a-z]/g, '').substring(0, 2);
    // Increment the seed
    const nextSeed = incrementSeed(seed || generateRandomSeed());
    loadQuizForSeed(nextSeed);
});

// UI - Previous button loads quiz for previous seed
document.getElementById("prev").addEventListener("click", () => {
    const seedInput = document.getElementById("quiz-seed");
    let seed = seedInput.value.trim().toLowerCase() || generateRandomSeed();
    // Only keep letters, max 2
    seed = seed.replace(/[^a-z]/g, '').substring(0, 2);
    // Decrement the seed
    const prevSeed = decrementSeed(seed || generateRandomSeed());
    loadQuizForSeed(prevSeed);
});

// Auto-format seed input to only accept letters (max 2)
document.getElementById("quiz-seed").addEventListener("input", (e) => {
    let value = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
    e.target.value = value.substring(0, 2);
});

// Allow Enter key in the seed input
document.getElementById("quiz-seed").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        document.getElementById("next").click();
    }
});

// Show toast notification
function showToast(message, duration = 2000) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}

// Init
loadWords();
