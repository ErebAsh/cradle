# Contributing

First of all, thank you for your interest in contributing to **Cradle**! 🎉

Cradle is a collection of small ideas, experiments, lightweight prototypes, and geeky projects built for learning, exploration, and sharing. Whether you're fixing a bug, improving documentation, adding a new project, or enhancing an existing one, every contribution is appreciated.

Please take a few minutes to read these guidelines before getting started.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Before You Start](#before-you-start)
- [Adding a New Project](#adding-a-new-project)
- [Coding Guidelines](#coding-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Branch Naming Guidelines](#branch-naming-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing](#testing)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Need Help?](#need-help)
- [Thank You](#thank-you)


## Ways to Contribute

You can contribute in many ways, including:

- 🐞 Fixing bugs
- ✨ Adding new projects or experiments
- 📖 Improving documentation
- 🎨 Enhancing UI/UX
- ⚡ Performance improvements
- 🛠️ Refactoring existing code
- 💡 Suggesting new ideas and features

Every contribution, no matter how small, is valuable.

---

## Before You Start

Before working on an issue:

- Search existing issues to avoid duplicate work.
- Read the project documentation before starting.
- Wait until an issue has been assigned to you (if required by the maintainers).
- Work on only **one issue per Pull Request**.
- Keep your Pull Request focused on a **single feature or bug fix**.
- For major features or architectural changes, open an issue first to discuss your proposal.

---

## Adding a New Project

If you're contributing a new project, follow the repository's existing structure and keep the addition focused and self-contained.

### Where to place it

Create a new folder under the appropriate category in the `projects/` directory. Categories already include:

- `projects/aiml/`
- `projects/dev-tools/`
- `projects/games/`
- `projects/misc/`
- `projects/productivity/`

Each new project should live in its own subfolder under one of those categories.

Example:

```text
projects/games/your-project-name/
```

### Recommended project structure

A new project should usually live in its own folder with only the files it needs. A simple structure might look like this:

```text
project-name/
├── index.html
├── style.css
├── script.js
├── README.md
├── preview.png
└── assets/
    ├── images/
    ├── icons/
    └── other-assets/
```

Use this as a guideline rather than a strict requirement:

- `index.html` — the entry point for browser-based projects.
- `style.css` — project-specific styling where applicable.
- `script.js` — project behavior and logic where applicable.
- `README.md` — short documentation covering what the project does, how to use it, and any relevant controls or credits.
- `preview.png` — a preview image when it helps the project feel complete and easier to recognize.
- `assets/` — project-specific images, icons, fonts, or other supporting resources.

Keep the project self-contained whenever possible. Avoid adding unrelated global files unless the change truly belongs to the project.

### Naming conventions

- Use lowercase folder names with hyphens when possible.
- Use descriptive, readable names that match the project purpose.
- Prefer names that are easy to understand when browsing the repository.

### Documentation requirements

Every new project should include a `README.md` inside its own folder.

A useful README usually includes:

- A short description of the project
- Key features or gameplay
- How to open or run it locally
- Controls or interaction details if relevant
- Any credits or dependencies used

### Assets and static files

- Store project-specific assets inside the project's own folder.
- Keep the asset layout simple and predictable.
- Avoid referencing remote assets unless they are already used elsewhere in the repository and are appropriate for the project.

### Code organization

- Keep the project-specific code isolated within its own folder.
- Use clear and descriptive file names.
- Keep the implementation readable and maintainable.
- Avoid unnecessary global styles or scripts that affect other projects.
- Add comments for non-obvious logic when helpful.

### New Project Checklist

Before opening a Pull Request, review the following checklist:

- [ ] The project is placed in the correct category directory.
- [ ] The project folder has a clear and descriptive name.
- [ ] Project-specific files are organized within the project folder.
- [ ] Assets are stored in an appropriate location.
- [ ] README documentation has been added where appropriate.
- [ ] The project works correctly locally.
- [ ] Existing projects and unrelated files were not unnecessarily modified.
- [ ] The project follows the repository's contribution guidelines.

---

## Coding Guidelines

Please follow the existing coding style throughout the repository.

- Write clean, readable, and maintainable code.
- Use meaningful variable and file names.
- Keep code modular whenever possible.
- Avoid unrelated changes in the same Pull Request.
- Remove unused code before submitting.
- Update documentation whenever your changes affect functionality.

---

## Documentation Guidelines

Documentation is just as important as code.

You can contribute by:

- Improving explanations
- Fixing grammar or spelling
- Updating outdated information
- Adding missing documentation
- Providing examples where helpful

---

## Branch Naming Guidelines

Create a new branch for every contribution.

Use descriptive branch names following this format:

```text
feature/short-description
fix/short-description
docs/short-description
refactor/short-description
style/short-description
chore/short-description
```

Examples:

```text
feature/add-weather-widget
feature/new-project-showcase
fix/project-card-alignment
docs/update-contributing-guide
refactor/simplify-project-filter
```

Avoid generic branch names such as:

```text
update
changes
test
branch1
new
```

---

## Commit Message Guidelines

Clear and descriptive commit messages make it easier to review changes and understand project history.

Following the Conventional Commits format is recommended.

Examples:

```text
feat: add portfolio project card
fix: resolve mobile navigation issue
docs: update contributing guidelines
style: improve landing page spacing
refactor: simplify project filtering logic
```

Avoid commit messages like:

```text
update
changes
fix
misc
```

---

## Testing

Before submitting your Pull Request:

- Verify that your changes work as expected.
- Ensure existing functionality is not broken.
- Test responsive layouts if you modified the UI.
- Check that documentation and links render correctly.

---

## Pull Request Guidelines

Before opening a Pull Request, make sure:

- Your branch is up to date.
- Your Pull Request addresses only one issue or feature.
- Documentation has been updated when necessary.
- The project runs successfully after your changes.
- Link the related issue using:

```text
Fixes #<issue_number>
```

If your Pull Request includes UI changes, please attach screenshots.

---

## Reporting Bugs

When reporting a bug, please include:

- A clear description of the issue.
- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Browser and operating system.
- Screenshots or console logs, if applicable.

Providing detailed information helps maintainers reproduce and resolve issues efficiently.

---

## Suggesting Features

Feature suggestions are always welcome.

Please include:

- The problem your feature solves.
- Your proposed solution.
- Possible alternatives.
- Additional context or examples.

---

## Need Help?

If you have any questions before contributing, feel free to open an issue or start a discussion.

The maintainers and community are happy to help.

---

## Thank You

Thank you for taking the time to contribute to **Cradle**.

Your contributions help make this repository a better place for learning, experimentation, and collaboration.

Happy Coding! 🚀