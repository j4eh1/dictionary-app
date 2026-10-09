// Dictionary App - API Integration
// API: FreeDictionaryAPI.com (Wiktionary data) - https://freedictionaryapi.com/
const API_URL = "https://freedictionaryapi.com/api/v1/entries/en/";

const form = document.getElementById("search-form");
const input = document.getElementById("word-input");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  searchWord(input.value);
});

async function searchWord(rawWord) {
  const word = rawWord.trim().toLowerCase();

  // User input validation
  if (!word) return showError("Please type a word first.");
  if (!/^[a-z'-]+$/.test(word)) return showError("Please enter a single English word (letters only).");

  showLoading();

  try {
    const response = await fetch(API_URL + encodeURIComponent(word));

    if (response.status === 404) {
      return showError(`No definition found for "${word}". Check the spelling and try again.`);
    }
    if (!response.ok) throw new Error("Request failed: " + response.status);

    const data = await response.json();

    // Some APIs return 200 with an empty list when the word is unknown
    if (!data.entries || data.entries.length === 0) {
      return showError(`No definition found for "${word}". Check the spelling and try again.`);
    }
    renderResult(data);
  } catch (err) {
    // Network failure, server error, or bad JSON
    console.error(err);
    showError("Could not fetch data. Please try again.");
  }
}

function renderResult(data) {
  resultEl.innerHTML = "";
  statusEl.textContent = "";
  statusEl.className = "";

  const title = document.createElement("h2");
  title.textContent = data.word;
  resultEl.appendChild(title);

  // First pronunciation (IPA) found in any entry
  for (const entry of data.entries) {
    if (entry.pronunciations && entry.pronunciations.length) {
      const p = document.createElement("p");
      p.className = "phonetic";
      p.textContent = entry.pronunciations[0].text;
      resultEl.appendChild(p);
      break;
    }
  }

  // One section per part of speech
  data.entries.forEach((entry) => {
    const section = document.createElement("section");

    const pos = document.createElement("h3");
    pos.textContent = entry.partOfSpeech;
    section.appendChild(pos);

    const list = document.createElement("ol");
    (entry.senses || []).slice(0, 3).forEach((sense) => {
      const li = document.createElement("li");
      li.textContent = sense.definition;

      if (sense.examples && sense.examples.length) {
        const ex = document.createElement("p");
        ex.className = "example";
        ex.textContent = `"${sense.examples[0]}"`;
        li.appendChild(ex);
      }
      list.appendChild(li);
    });
    section.appendChild(list);

    if (entry.synonyms && entry.synonyms.length) {
      const syn = document.createElement("p");
      syn.className = "synonyms";
      syn.textContent = "Synonyms: " + entry.synonyms.slice(0, 5).join(", ");
      section.appendChild(syn);
    }
    resultEl.appendChild(section);
  });

  // Credit the data source (Wiktionary, CC BY-SA 4.0)
  if (data.source && data.source.url) {
    const credit = document.createElement("p");
    credit.className = "example";
    credit.textContent = "Source: ";
    const link = document.createElement("a");
    link.href = data.source.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Wiktionary (CC BY-SA 4.0)";
    credit.appendChild(link);
    resultEl.appendChild(credit);
  }
}

function showLoading() {
  resultEl.innerHTML = "";
  statusEl.className = "";
  statusEl.textContent = "Searching...";
}

function showError(message) {
  resultEl.innerHTML = "";
  statusEl.className = "error";
  statusEl.textContent = message;
}
