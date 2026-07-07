# cradle ⟵⁠(⁠o⁠_⁠O⁠)

A personal collection of small ideas, experiments, and geeky projects I'm exploring and building.

## What this repository contains

Projectz is a repository for my small ideas, experiments and lightweight prototypes. It contains runnable demos, maybe eventually some short technical notes and utility scripts intended for rapid iteration and learning.

## Each project folder would include:
- a short `README.md` describing the goal and how to run or test it,  
- minimal dependency manifest (`requirements.txt`, `package.json` etc.)
- example usage or quick demo scripts if possible.

## Project Structure 

```bash
Cradle/
│
├── data/
│   └── projects.json
│
├── projects/
│   ├── ai-ml/
│   ├── devtools/
│   ├── games/
│   └── productivity/...
│
├── scripts/
│   └── generate-projects.js
│
├── README.md
├── index.html
├── script.js
└── style.css
```

## Getting started
1. Clone the repo after forking
```bash
git clone https://github.com/<yourusername>/cradle.git
```
2. Open the local repository
```bash
cd cradle
```
3. Open the Landing page
- Simply just open the `index.html` on your browser... OR
- Use a local server using Python(recomended by me)
```bash
python -m http.server 8000
```
Then visit
```bash
http://localhost:8000
```
4. For Individual projects
   - Open their `index.html` directly on browser 

## 🤝 Contributing

Contributions are welcome! Whether you're fixing bugs, improving documentation, or adding new ideas and experiments, your help is greatly appreciated.

Before getting started, please read our [Contributing Guide](CONTRIBUTING.md) for information about the development workflow, coding standards, and pull request process.

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.