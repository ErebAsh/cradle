import { initTheme, toggleTheme } from "./scripts/theme.js";

const projectsGrid = document.getElementById("projects-grid");
const searchInput = document.getElementById("search");
const categoriesContainer = document.getElementById("categories");
const projectCount = document.getElementById("project-count");
const clearFiltersBtn = document.getElementById("clear-filters");

let allProjects = [];
let selectedCategory = "all";

let filterWorker;
if (window.Worker) {
  filterWorker = new Worker("./scripts/worker.js");
  filterWorker.onmessage = function (e) {
    renderProjects(e.data);
  };
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("CradleDB", 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("projectsStore")) {
        db.createObjectStore("projectsStore", {
          keyPath: "id",
        });
      }
    };
  });
}

function getCachedProjects(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["projectsStore"], "readonly");
    const store = transaction.objectStore("projectsStore");
    const request = store.get("projects");

    request.onerror = () => reject(request.error);

    request.onsuccess = () =>
      resolve(request.result ? request.result.data : null);
  });
}

async function fetchAndCacheProjects(db) {
  const response = await fetch("./data/projects.json");

  if (!response.ok) {
    throw new Error("Failed to load projects");
  }

  const data = await response.json();
  allProjects = data;

  if (db) {
    const transaction = db.transaction(["projectsStore"], "readwrite");
    const store = transaction.objectStore("projectsStore");

    store.put({
      id: "projects",
      data: data,
    });
  }

  return data;
}

async function loadProjects() {
  try {
    let db;

    try {
      db = await openDB();

      const cachedProjects = await getCachedProjects(db);

      if (cachedProjects && cachedProjects.length > 0) {
        allProjects = cachedProjects;

        renderCategories();
        renderProjects(allProjects);

        // Background update
        fetchAndCacheProjects(db)
          .then(() => {
            renderCategories();
            applyFilters();
          })
          .catch(console.error);

        return;
      }
    } catch (e) {
      console.warn("IndexedDB error:", e);
    }

    await fetchAndCacheProjects(db);

    renderCategories();
    renderProjects(allProjects);
  } catch (error) {
    console.error(error);
    projectsGrid.innerHTML = "<p>Failed to load projects.</p>";
  }
}

function renderCategories() {
  const categories = [
    "all",
    ...new Set(allProjects.map((project) => project.category)),
  ];

  categoriesContainer.innerHTML = "";

  categories.forEach((category) => {
    const btn = document.createElement("button");

    btn.className =
      category === selectedCategory
        ? "category-btn active"
        : "category-btn";

    btn.textContent = category.toUpperCase().replace("-", " ");

    btn.onclick = () => {
      selectedCategory = category;
      applyFilters();
      renderCategories();
    };

    categoriesContainer.appendChild(btn);
  });
}

function renderProjects(projects) {
  projectCount.textContent = `${projects.length} projects`;

  if (!projects.length) {
    projectsGrid.innerHTML = "<p>No projects found.</p>";
    return;
  }

  projectsGrid.innerHTML = projects
    .map(
      (project) => `
      <article class="project-card">
        <div class="project-category">
          ${project.category}
        </div>

        <h3 class="project-title">
          ${project.title}
        </h3>

        <p class="project-path">
          ${project.path}
        </p>

        <a
          class="project-link"
          href="${project.path}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Project →
        </a>
      </article>
    `
    )
    .join("");
}

function applyFilters() {
  const query = searchInput.value.toLowerCase().trim();

  if (filterWorker) {
    filterWorker.postMessage({
      allProjects,
      selectedCategory,
      query,
    });
  } else {
    const filtered = allProjects.filter(
      (project) =>
        (selectedCategory === "all" ||
          project.category === selectedCategory) &&
        project.title.toLowerCase().includes(query)
    );

    renderProjects(filtered);
  }

  updateClearButtonVisibility(query);
}

function updateClearButtonVisibility(query) {
  const hasActiveFilters =
    query !== "" || selectedCategory !== "all";

  if (clearFiltersBtn) {
    clearFiltersBtn.hidden = !hasActiveFilters;
  }
}

function clearFilters() {
  searchInput.value = "";
  selectedCategory = "all";

  applyFilters();
  renderCategories();
}

searchInput.addEventListener("input", applyFilters);

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", clearFilters);
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadProjects();
});

window.toggleTheme = toggleTheme;