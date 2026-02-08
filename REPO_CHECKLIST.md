# Repo Polishing Checklist

Following REPO_STANDARDS.md workflow

## 1️⃣ Basics
- [x] Project title clearly identifies purpose
- [x] Short description of what the project does
- [ ] Relevant **topics/tags** added to the repo

## 2️⃣ README Essentials
- [x] **Project Summary / What & Why**
- [x] **Tech Stack** (languages, frameworks)
- [x] **Installation / Setup** instructions
- [x] **Usage examples**
- [ ] **Screenshots or demo links**
- [x] **Contributing section** with *how to help* instructions
- [x] **License section** showing how this project can be used

## 3️⃣ Documentation & Files
- [x] `LICENSE` added (MIT, year 2026, Om Surushe)
- [x] `.gitignore` present
- [x] `CONTRIBUTING.md` (how to contribute)
- [ ] `CODE_OF_CONDUCT.md` (community expectations)
- [ ] Issue & PR templates

## 4️⃣ CI / Automation
- [ ] CI workflow (e.g., GitHub Actions) that builds/tests code
- [x] **Badges** at top of README (partial - license, TypeScript, Bun)

## 5️⃣ Testing
- [x] Meaningful **unit tests** exist (time utilities tested)
- [ ] Tests **pass in CI**
- [ ] Code coverage reported

## 6️⃣ Code Quality
- [x] Linter / formatter configured (ESLint + Prettier)
- [x] Code style consistent
- [x] Logical folder & file structure

## 7️⃣ Versioning & Releases
- [ ] Semantic version tags (e.g., `v0.1.0`)
- [x] **CHANGELOG.md** describing releases

## 8️⃣ Community Signals
- [ ] Meaningful **issue labels**
- [ ] PR templates
- [x] Link to repo owner's profile

---

## 🛠 TODOs (Before Publishing)

- [ ] Add GitHub topics/tags (mcp, ticktick, task-management, llm, ai-assistant, productivity, bun, typescript)
- [ ] Add demo GIF/video showing MCP in action
- [ ] Create CODE_OF_CONDUCT.md
- [ ] Add GitHub issue templates (.github/ISSUE_TEMPLATE/)
- [ ] Add PR template (.github/PULL_REQUEST_TEMPLATE.md)
- [ ] Set up GitHub Actions CI workflow
  - [ ] Run tests on push
  - [ ] Type checking
  - [ ] Linting
  - [ ] Build verification
- [ ] Add build status badge once CI is set up
- [ ] Add test coverage badge
- [ ] Test actual MCP server with OpenClaw/Claude Desktop
- [ ] Create initial git tag v0.1.0
- [ ] Publish to npm
- [ ] Submit to MCP registry / Smithery / ClawhHub

---

**Status:** 🟡 MVP Complete - Ready for testing, not yet published
