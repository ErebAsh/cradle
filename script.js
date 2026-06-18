const projectsGrid = document.getElementById("projects-grid");
const searchInput = document.getElementById("search");
const categoriesContainer = document.getElementById("categories");
const projectCount = document.getElementById("project-count");

let allProjects = [];
let selectedCategory = "all";

async function loadProjects() {
  try {
    const response = await fetch("./data/projects.json");

    if (!response.ok) {
      throw new Error("Failed to load projects");
    }

    allProjects = await response.json();

    renderCategories();
    renderProjects(allProjects);
  } catch (error) {
    console.error(error);

    projectsGrid.innerHTML = `
      <p>Failed to load projects.</p>
    `;
  }
}

function renderCategories() {
  const categories = [
    "all",
    ...new Set(
      allProjects.map(project => project.category)
    )
  ];

  categoriesContainer.innerHTML = "";

  categories.forEach(category => {
    const button = document.createElement("button");

    button.className =
      category === selectedCategory
        ? "category-btn active"
        : "category-btn";

    button.textContent = category;

    button.addEventListener("click", () => {
      selectedCategory = category;

      document
        .querySelectorAll(".category-btn")
        .forEach(btn =>
          btn.classList.remove("active")
        );

      button.classList.add("active");

      applyFilters();
    });

    categoriesContainer.appendChild(button);
  });
}

function renderProjects(projects) {
  projectCount.textContent =
    `${projects.length} project${projects.length !== 1 ? "s" : ""}`;

  projectsGrid.innerHTML = projects
    .map(project => {
      return `
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
      `;
    })
    .join("");

  if (projects.length === 0) {
    projectsGrid.innerHTML = `
      <p>No projects found.</p>
    `;
  }
}

function applyFilters() {
  const query = searchInput.value
    .trim()
    .toLowerCase();

  const filteredProjects = allProjects.filter(
    project => {
      const matchesSearch =
        project.title
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        selectedCategory === "all" ||
        project.category === selectedCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    }
  );

  renderProjects(filteredProjects);
}

searchInput.addEventListener(
  "input",
  applyFilters
);

loadProjects();
