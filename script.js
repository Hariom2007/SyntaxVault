// --- DOM Elements ---
const downloadBtn = document.getElementById('download-btn');
const snippetList = document.getElementById('snippet-list');
const titleInput = document.getElementById('snippet-title');
const languageSelect = document.getElementById('language-select');
const codeEditor = document.getElementById('code-editor');
const saveBtn = document.getElementById('save-btn');
const addNewBtn = document.getElementById('add-new-btn');
const runBtn = document.getElementById('run-btn');
const previewFrame = document.getElementById('preview-frame');
const copyBtn = document.getElementById('copy-btn'); // Copy button select kiya
const searchInput = document.querySelector('.search-bar input');

// Highlighting Elements
const highlightingContent = document.getElementById('highlighting-content');
const highlightingContainer = document.getElementById('highlighting-container');

// --- State Management ---
let snippets = JSON.parse(localStorage.getItem('syntaxVaultSnippets')) || [];
let currentSnippetId = null;

// --- Initialize App ---
function init() {
    if (snippets.length === 0) {
        createNewSnippet("Modern Button CSS", "css", ".btn {\n  background: #00e676;\n  color: #000;\n  padding: 10px 20px;\n  border-radius: 8px;\n}");
    } else {
        renderSnippetList();
        if (snippets.length > 0) loadSnippet(snippets[0].id);
    }
}

// --- Syntax Highlighting Logic ---
function updateHighlighting() {
    let code = codeEditor.value;
    if (code[code.length - 1] === "\n") {
        code += " ";
    }
    highlightingContent.textContent = code;
    let lang = languageSelect.value;
    highlightingContent.className = `language-${lang}`;
    if (window.Prism) {
        Prism.highlightElement(highlightingContent);
    }
}

codeEditor.addEventListener('scroll', () => {
    highlightingContainer.scrollTop = codeEditor.scrollTop;
    highlightingContainer.scrollLeft = codeEditor.scrollLeft;
});
codeEditor.addEventListener('input', updateHighlighting);
languageSelect.addEventListener('change', updateHighlighting);

// --- Core Functions ---
function createNewSnippet(title = "", language = "html", code = "") {
    const newSnippet = {
        id: Date.now().toString(),
        title: title,
        language: language,
        code: code
    };
    snippets.unshift(newSnippet);
    saveToLocalStorage();
    loadSnippet(newSnippet.id);
    renderSnippetList();
}

function saveCurrentSnippet() {
    if (!currentSnippetId) return;
    const index = snippets.findIndex(s => s.id === currentSnippetId);
    if (index !== -1) {
        snippets[index].title = titleInput.value;
        snippets[index].language = languageSelect.value;
        snippets[index].code = codeEditor.value;

        saveToLocalStorage();
        renderSnippetList();

        const originalContent = saveBtn.innerHTML;
        saveBtn.innerHTML = "<i class='bx bx-check'></i> Saved!";
        saveBtn.style.backgroundColor = "#fff";
        setTimeout(() => {
            saveBtn.innerHTML = originalContent;
            saveBtn.style.backgroundColor = "var(--accent-neon)";
        }, 1500);
    }
}

function renderSnippetList(dataToRender = snippets) {
    snippetList.innerHTML = '';
    dataToRender.forEach(snippet => {
        const li = document.createElement('li');
        li.className = `snippet-item ${snippet.id === currentSnippetId ? 'active' : ''}`;

        li.onclick = () => {
            loadSnippet(snippet.id);
            renderSnippetList(dataToRender); // Taki search filter barkarar rahe
        };

        let tagClass = snippet.language === 'javascript' ? 'js' : snippet.language;
        li.innerHTML = `
            <div class="snippet-info">
                <h4>${snippet.title || "Untitled Snippet"}</h4>
                <span class="tag tag-${tagClass}">${snippet.language.toUpperCase()}</span>
            </div>
            <i class='bx bx-chevron-right arrow-icon'></i>
        `;
        snippetList.appendChild(li);
    });
}

function loadSnippet(id) {
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;

    currentSnippetId = id;
    titleInput.value = snippet.title;
    languageSelect.value = snippet.language;
    codeEditor.value = snippet.code;

    updateHighlighting();
}

function saveToLocalStorage() {
    localStorage.setItem('syntaxVaultSnippets', JSON.stringify(snippets));
}

// --- Copy to Clipboard Logic ---
function copyToClipboard() {
    const code = codeEditor.value;
    if (!code.trim()) return;

    navigator.clipboard.writeText(code).then(() => {
        const originalIcon = copyBtn.innerHTML;
        // Icon badal kar checkmark lagana
        copyBtn.innerHTML = "<i class='bx bx-check'></i>";
        copyBtn.style.color = "var(--accent-neon)";
        copyBtn.style.transform = "scale(1.2)";

        // 1.5 second baad wapas normal icon
        setTimeout(() => {
            copyBtn.innerHTML = originalIcon;
            copyBtn.style.color = "var(--text-muted)";
            copyBtn.style.transform = "scale(1)";
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// --- Live Preview Logic ---
function runLivePreview() {
    const code = codeEditor.value;
    const language = languageSelect.value;
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;

    iframeDoc.open();
    if (language === 'html') {
        iframeDoc.write(code);
    } else if (language === 'css') {
        iframeDoc.write(`
            <style>${code}</style>
            <div style="font-family: sans-serif; padding: 20px; text-align: center;">
                <h2>CSS Preview Mode</h2>
                <button style="padding: 10px 20px; border-radius: 8px; border:none;" class="btn">Sample Button</button>
            </div>
        `);
    } else if (language === 'javascript') {
        iframeDoc.write(`
            <div style="font-family: sans-serif; padding: 20px;">
                <h3>JS Output (Check Console)</h3>
            </div>
            <script>${code}<\/script>
        `);
    }
    iframeDoc.close();
}

// --- Event Listeners ---
addNewBtn.addEventListener('click', () => createNewSnippet());
saveBtn.addEventListener('click', saveCurrentSnippet);
runBtn.addEventListener('click', runLivePreview);
if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadSnippet);
}
// --- Search Bar Logic ---
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        // Snippets ko filter karo (Title ya Language ke base par)
        const filteredSnippets = snippets.filter(snippet =>
            snippet.title.toLowerCase().includes(searchTerm) ||
            snippet.language.toLowerCase().includes(searchTerm)
        );

        // Sirf matching snippets ko screen par dikhao
        renderSnippetList(filteredSnippets);
    });
}

// Copy button par click listener
if (copyBtn) {
    copyBtn.addEventListener('click', copyToClipboard);
}

// Start app
init();

// --- Mobile Menu Logic ---
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.querySelector('.sidebar');

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');

        // Icon ko Menu (☰) se Close (✖) mein badalna
        const icon = menuBtn.querySelector('i');
        if (sidebar.classList.contains('open')) {
            icon.className = 'bx bx-x';
            icon.style.color = "var(--accent-neon)";
        } else {
            icon.className = 'bx bx-menu';
            icon.style.color = "var(--text-muted)";
        }
    });
}

// Sidebar se koi snippet select karne par Menu apne aap band ho jaye
snippetList.addEventListener('click', (e) => {
    // Check karo ki click list item par hua hai aur screen mobile hai
    if (e.target.closest('.snippet-item') && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        const icon = menuBtn.querySelector('i');
        if (icon) {
            icon.className = 'bx bx-menu';
            icon.style.color = "var(--text-muted)";
        }
    }
});

// --- Download to File Logic ---
function downloadSnippet() {
    const code = codeEditor.value;
    const language = languageSelect.value;

    // Agar code khali hai, toh download na kare
    if (!code.trim()) {
        alert("Editor is empty! Please write some code first.");
        return;
    }

    // Title se safe filename banana (spaces ko '_' se replace karna)
    let rawTitle = titleInput.value.trim() || "untitled_snippet";
    let safeFilename = rawTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Language ke hisaab se file extension set karna
    let extension = ".txt";
    if (language === "html") extension = ".html";
    else if (language === "css") extension = ".css";
    else if (language === "javascript") extension = ".js";

    let finalFilename = safeFilename + extension;

    // Blob API se file generate karna
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Ek temporary <a> tag banakar automatic click karwana
    const a = document.createElement("a");
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();

    // Memory clean karna
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}