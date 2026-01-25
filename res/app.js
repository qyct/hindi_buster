const STORAGE_KEY = "hindi_words_v1";
let WORDS = [];
let TOTAL_FREQ = 0;
let currentQuiz = [];
let currentEnglishOptions = [];
let selectedEnglish = null;
let userAnswers = {};
let usedEnglish = new Set(); // Track used English words
let hintsUsed = 0; // Track hint usage
let totalCorrect = 0;
let totalWrong = 0;
let totalHints = 0;
let checkedAnswers = new Set(); // Track which answers have been checked

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

    // Auto-generate quiz on load
    const quizData = generateQuiz(10, 10);
    currentQuiz = quizData.quizWords;
    currentEnglishOptions = quizData.allWords;
    renderQuiz();
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

// Weighted random selection (unique words)
function generateQuiz(count = 10, extraCount = 10) {
    const selected = new Set();

    // Select words for the quiz
    while (selected.size < count) {
        let r = Math.random() * TOTAL_FREQ;
        for (const w of WORDS) {
            r -= w.freq;
            if (r <= 0) {
                selected.add(w);
                break;
            }
        }
    }

    const quizWords = Array.from(selected);

    // Add extra distractor words
    const distractors = new Set();
    while (distractors.size < extraCount) {
        let r = Math.random() * TOTAL_FREQ;
        for (const w of WORDS) {
            r -= w.freq;
            if (r <= 0 && !selected.has(w)) {
                distractors.add(w);
                break;
            }
        }
    }

    return {
        quizWords: quizWords,
        allWords: [...quizWords, ...Array.from(distractors)]
    };
}

// Shuffle array
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Render quiz
function renderQuiz() {
    const quizContainer = document.getElementById("quiz");
    const hindiContainer = document.getElementById("hindi-words");
    const englishContainer = document.getElementById("english-options");

    // Clear previous
    hindiContainer.innerHTML = "";
    englishContainer.innerHTML = "";
    userAnswers = {};
    selectedEnglish = null;
    usedEnglish.clear();
    hintsUsed = 0;
    checkedAnswers.clear();

    // Clear any previous hints
    document.querySelectorAll(".english-option").forEach(b => b.classList.remove("hint-highlight"));

    // Create Hindi words list
    currentQuiz.forEach((word, index) => {
        const row = document.createElement("div");
        row.className = "hindi-row";
        row.innerHTML = `
            <span class="hindi-word">${word.hindi}</span>
            <span class="answer-slot" data-index="${index}">${userAnswers[index] || ""}</span>
            <button class="hint-btn" data-index="${index}" title="Show hint">!</button>
        `;
        hindiContainer.appendChild(row);

        // Add drop handlers to answer slot
        const slot = row.querySelector(".answer-slot");
        slot.addEventListener("dragover", handleDragOver);
        slot.addEventListener("dragleave", handleDragLeave);
        slot.addEventListener("drop", (e) => handleDrop(e, slot, index));
    });

    // Create shuffled English options (20 total: 10 correct + 10 distractors)
    const shuffled = shuffle(currentEnglishOptions);
    shuffled.forEach((word, index) => {
        const btn = document.createElement("button");
        btn.className = "english-option";
        btn.textContent = word.english;
        btn.dataset.english = word.english;
        btn.draggable = true;
        btn.addEventListener("click", (e) => {
            if (!usedEnglish.has(word.english)) {
                selectEnglish(word.english, btn);
            }
        });
        btn.addEventListener("dragstart", (e) => {
            if (!usedEnglish.has(word.english)) {
                handleDragStart(e, word.english);
            } else {
                e.preventDefault();
            }
        });
        btn.addEventListener("dragend", handleDragEnd);
        englishContainer.appendChild(btn);
    });

    // Add click handlers to answer slots
    document.querySelectorAll(".answer-slot").forEach(slot => {
        slot.addEventListener("click", () => placeAnswer(slot));
    });

    // Add click handlers to hint buttons
    document.querySelectorAll(".hint-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            showHint(btn.dataset.index);
        });
    });

    // Add click-outside handler to deselect English words
    document.addEventListener("click", (e) => {
        // Check if click is on an English option button, answer slot, or hint button
        const clickedOnEnglishOption = e.target.classList.contains("english-option");
        const clickedOnAnswerSlot = e.target.classList.contains("answer-slot");
        const clickedOnHintBtn = e.target.classList.contains("hint-btn");

        // Deselect if clicking outside these interactive elements
        if (!clickedOnEnglishOption && !clickedOnAnswerSlot && !clickedOnHintBtn) {
            deselectEnglish();
        }
    });
}

// Select English word
function selectEnglish(english, btn) {
    // Don't allow selection if word is already used
    if (usedEnglish.has(english)) {
        return;
    }
    selectedEnglish = english;
    document.querySelectorAll(".english-option").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
}

// Deselect English word
function deselectEnglish() {
    selectedEnglish = null;
    document.querySelectorAll(".english-option").forEach(b => b.classList.remove("selected"));
}

// Place answer in slot
function placeAnswer(slot) {
    if (!selectedEnglish) return;

    const index = slot.dataset.index;

    // If this slot already has an answer, remove it from used set
    if (userAnswers[index]) {
        usedEnglish.delete(userAnswers[index]);
    }

    // If the selected English is already used, don't allow
    if (usedEnglish.has(selectedEnglish)) {
        return;
    }

    userAnswers[index] = selectedEnglish;
    usedEnglish.add(selectedEnglish);
    slot.textContent = selectedEnglish;
    slot.classList.add("filled");

    // Mark the English option as used and deselect
    document.querySelectorAll(".english-option").forEach(btn => {
        if (btn.dataset.english === selectedEnglish) {
            btn.classList.add("used");
            btn.classList.remove("selected");
        }
    });

    // Clear selection
    selectedEnglish = null;
}

// Drag and drop handlers
function handleDragStart(e, english) {
    e.dataTransfer.setData("text/plain", english);
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("dragging");
}

function handleDragEnd(e) {
    e.target.classList.remove("dragging");
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.target.classList.add("drag-over");
}

function handleDragLeave(e) {
    e.target.classList.remove("drag-over");
}

function handleDrop(e, slot, index) {
    e.preventDefault();
    slot.classList.remove("drag-over");

    const english = e.dataTransfer.getData("text/plain");
    if (!english) return;

    // If this slot already has an answer, remove it from used set
    if (userAnswers[index]) {
        usedEnglish.delete(userAnswers[index]);
        // Remove used class from old English option
        document.querySelectorAll(".english-option").forEach(btn => {
            if (btn.dataset.english === userAnswers[index]) {
                btn.classList.remove("used");
            }
        });
    }

    // If the English word is already used elsewhere, don't allow
    if (usedEnglish.has(english)) {
        return;
    }

    userAnswers[index] = english;
    usedEnglish.add(english);
    slot.textContent = english;
    slot.classList.add("filled");

    // Mark the English option as used
    document.querySelectorAll(".english-option").forEach(btn => {
        if (btn.dataset.english === english) {
            btn.classList.add("used");
        }
    });
}

// Show hint - highlight correct answer
function showHint(index) {
    const correctAnswer = currentQuiz[index].english;

    // Remove previous highlights
    document.querySelectorAll(".english-option").forEach(b => b.classList.remove("hint-highlight"));

    // Find and highlight the correct English option
    document.querySelectorAll(".english-option").forEach(btn => {
        if (btn.dataset.english === correctAnswer) {
            btn.classList.add("hint-highlight");
            btn.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    });

    // Increment hint counters
    hintsUsed++;
    totalHints++;
    updateResultDisplay();
}

// Clear answers
function clearAnswers() {
    userAnswers = {};
    selectedEnglish = null;
    usedEnglish.clear();
    hintsUsed = 0;
    // Don't clear checkedAnswers - we don't want to recount the same answers
    document.querySelectorAll(".answer-slot").forEach(slot => {
        slot.textContent = "";
        slot.classList.remove("filled", "correct", "incorrect");
    });
    document.querySelectorAll(".english-option").forEach(b => {
        b.classList.remove("selected", "hint-highlight", "used");
    });
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
}

// Check answers
function checkAnswers() {
    let correct = 0;
    let wrong = 0;

    document.querySelectorAll(".hindi-row").forEach(row => {
        const slot = row.querySelector(".answer-slot");
        const index = slot.dataset.index;
        const userAnswer = userAnswers[index];
        const correctAnswer = currentQuiz[index].english;

        // Clear previous styling
        slot.classList.remove("correct", "incorrect");

        // Only count if answer hasn't been checked before
        const answerKey = `${index}_${userAnswer}`;

        if (userAnswer === correctAnswer) {
            slot.classList.add("correct");
            // Only count if this specific answer hasn't been counted yet
            if (!checkedAnswers.has(answerKey)) {
                correct++;
                checkedAnswers.add(answerKey);
            }
        } else if (userAnswer) {
            slot.classList.add("incorrect");
            // Only count if this specific answer hasn't been counted yet
            if (!checkedAnswers.has(answerKey)) {
                wrong++;
                checkedAnswers.add(answerKey);
            }
        }
    });

    // Update totals with new results
    totalCorrect += correct;
    totalWrong += wrong;
    updateResultDisplay();
}

// UI
document.getElementById("generate").addEventListener("click", () => {
    const quizData = generateQuiz(10, 10);
    currentQuiz = quizData.quizWords;
    currentEnglishOptions = quizData.allWords;
    checkedAnswers.clear(); // Only clear checkedAnswers when generating a new quiz
    renderQuiz();
    updateResultDisplay();
});

document.getElementById("check").addEventListener("click", checkAnswers);

document.getElementById("clear").addEventListener("click", clearAnswers);

// Init
loadWords();
