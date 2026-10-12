# AlgoMotion — Architecture

> Pattern-first, animation-driven DSA learning. Pick a data structure → a pattern → a
> problem; watch the solution **animate**, then reveal it as **pseudocode** and finally as
> **code in your language** — all synchronized. 100% frontend, offline, no backend.

Repo: `DSA-animation/dsa` · Stack: Angular 22 (zoneless, signal-first, standalone), SCSS, Vitest.

---

## 1. Product vision

A learner moves through a funnel and then a teaching sequence:

```
Data Structure  →  Pattern  →  Problem
      │
      ▼
 ① ANIMATION   watch the algorithm run on the data structure
 ② PSEUDOCODE  the same run, in language-agnostic steps
 ③ pick a language
 ④ CODE        the same steps, as concrete code (JavaScript first)
```

The insight that makes it *teach* (not just display): ①–④ are **one solution at four levels of
concreteness** — picture → words → code — linked step-for-step. Seeing the same highlighted
"moment" move across all four is what builds pattern intuition.

## 2. Market wedge

From a scan of the landscape (Oct 2026):

| Tool | What it does | Gap |
|---|---|---|
| VisuAlgo | Broad DS/algo coverage, pseudocode beside visuals | Academic, organized by *algorithm*, not interview *pattern* |
| algorithm-visualizer.org | Instruments & **runs** real code to trace it | Needs a backend; general-purpose; not pattern-taught |
| Python Tutor | Step-through with line highlighting, many languages | **Runs** code (backend); not DSA-pattern oriented |
| NeetCode / LeetCode | Pattern taxonomy + problems | No animation; no synced multi-language reveal |

**No tool is pattern-first + animated + synced pseudocode→multi-language code + fully offline.**
That intersection is AlgoMotion's wedge.

## 3. Core principle — three decoupled layers

The whole system is a clean separation first introduced in Phase 1 (tree render) and now
generalized so **every** data structure reuses the same machinery:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────────────┐
│  CONTENT    │ ──▶ │   TRACE      │ ──▶ │   VIEW                   │
│ authored    │     │ DS-agnostic  │     │ per-DS renderer + player │
│ problems    │     │ list of Steps│     │ (reads currentStep)      │
└─────────────┘     └──────────────┘     └──────────────────────────┘
```

- **Content** — problems/patterns/DS types authored as lazy-loaded modules (JSON/TS).
- **Trace** — a solution emits an ordered `Step[]`. Produced by running an **instrumented TS
  reference solution**, so the trace is correct by construction (single source of truth).
- **View** — per-DS renderers + one shared player that steps through the trace and drives
  highlighting, the call stack, the variables panel, and the synced pseudocode/code lines.

Why this matters: adding a new data structure = a new **renderer** + authored content. The trace
model and the player never change.

## 4. The synchronized model (how picture → words → code works)

Each problem authors ONE canonical algorithm with three representations linked by a shared
`pseudoLine` / step id. "Conversion" is **progressive reveal of pre-linked layers**, never runtime
generation (which is why it needs no backend and is never wrong).

```ts
// A single moment in the algorithm's execution.
interface Step {
  id: number;
  kind: 'enter' | 'compare' | 'visit' | 'recurse' | 'return' | 'assign' | 'push' | 'pop' | 'mark' | 'done';
  focus: ElementRef[];                 // DS elements to highlight this step
  pointers?: Record<string, ElementRef>; // named pointers: i, j, slow, fast, cur…
  callStack?: Frame[];                 // for recursion visualization
  vars?: Record<string, string | number>; // watch panel
  pseudoLine: number;                  // ← links to a pseudocode line
  note?: string;                       // human caption: "9 is a leaf → depth 1"
}

// Identifies an element generically across data structures.
type ElementRef =
  | { ds: 'tree'; id: number }
  | { ds: 'array'; index: number }
  | { ds: 'list'; id: number }
  | { ds: 'graph'; nodeId: string }
  | { ds: 'grid'; row: number; col: number };

interface Frame { label: string; vars?: Record<string, string | number>; }
```

- **Pseudocode**: numbered lines; `Step.pseudoLine` points at the active line.
- **Code (per language)**: each line/region tagged with the same pseudo-line id, so choosing a
  language just swaps which text the *same* highlight drives.

Playing step N → highlight DS elements (`focus`/`pointers`) **and** the active pseudocode line
**and** (if a language is chosen) the active code line, in lockstep.

## 5. Per-DS renderers (the visual vocabulary)

A common `Visualizer` contract; each DS implements it and consumes the same `Step`. Lazy-loaded, so
a learner studying trees never downloads the graph renderer.

| Data structure | Rendering |
|---|---|
| Tree / BST | nodes + edges (✅ Phase 1) |
| Array / String | cells + index ruler + pointer arrows |
| Linked List | nodes + `next` arrows |
| Stack / Queue | stacked cells + top/front marker |
| Graph | layered/force layout, nodes + edges |
| Heap | tree + backing-array dual view |
| DP table | grid with fill order + dependency arrows |
| Hash map | buckets |

## 6. Angular architecture

- **Routing** (lazy per DS): `/` landing → `/learn/:ds` patterns → `/learn/:ds/:pattern` problems
  → `/learn/:ds/:pattern/:problem` the player. Each DS feature is a lazy route (code-split
  renderers).
- **State** (SignalStore):
  - `catalogStore` — the DS → pattern → problem index, lazily loaded.
  - `playerStore` — current problem, trace, step index, isPlaying, speed, chosen language. Plain
    signals + `computed` for derived values (`currentStep`, active lines).
- **Content loading** — each problem is a lazily-imported module exporting a `ProblemModule`
  (below). Keeps the initial bundle tiny; problems load on demand.
- **Rendering** — zoneless, `OnPush`, signal inputs; SVG renderers; animation via CSS
  transitions / the Web Animations API driven by `currentStep` changes.
- **Player UI** — canvas (DS renderer) + call-stack panel + variables panel + pseudocode panel +
  (after language pick) code panel, all reading one `currentStep` signal.

## 7. Content schema & authoring pipeline

```ts
interface ProblemModule {
  meta: {
    id: string; title: string; ds: DsKind; pattern: string;
    difficulty: 'easy' | 'medium' | 'hard';
    statement: string; examples: Example[];
    complexity: { time: string; space: string };
  };
  buildTrace(input: unknown): Step[];          // instrumented reference solution
  pseudocode: PseudoLine[];                     // numbered, step-linked
  code: Record<Language, CodeBlock>;            // per-language, line↔pseudoLine tagged
  patternNote: string;                          // why this problem belongs to the pattern
}
```

**Authoring a problem** = (1) write the instrumented TS solution that emits `Step[]` (correctness
source of truth), (2) author pseudocode with step tags, (3) author per-language code with the same
tags. Existing notes (the tree-problem PDFs) seed the content.

**First language: JavaScript** (aligns with the frontend/fullstack interview audience; others added
later — the animation + pseudocode are language-agnostic, so adding a language is only authoring one
more `CodeBlock`).

## 8. Monetization seams (business-ready; not built yet)

- Free: a few patterns/problems per DS. Paid: full catalog, all languages, "pattern courses".
- SSR / prerender the catalog + problem pages for SEO (the growth funnel).
- Client-side gating now; a payment provider + accounts later (the only thing that would introduce
  infra, and only when revenue justifies it).

## 9. Roadmap

| Phase | Outcome | Status |
|---|---|---|
| P0 | Scaffold (zoneless Angular 22, SCSS, repo) | ✅ |
| P1 | Tree renders as SVG (first DS renderer) | ✅ PR #1 |
| P2 | DS-agnostic **trace engine + step player** (instrument `maxDepth`) + pseudocode sync | next |
| P3 | Language **code panel** + synced highlighting (picture→words→code for one problem) | |
| P4 | The **funnel UX** (DS → pattern → problem) + catalog | |
| P5 | Author all **10 tree problems** (the 3 flavors) | |
| P6 | **Second DS** (Arrays / Two Pointers) to prove generality | |
| P7 | Landing + **SSR** + polish (Reingold–Tilford layout, themes) | |
| P8 | Monetization seams + **deploy** | |

## 10. Decisions log

- **Name:** AlgoMotion (TreeTrace retired — scope is all of DSA).
- **Code generation:** authored + synchronized, **not** live AI generation — forced by the
  no-backend constraint, and better for a *teaching* tool (always correct). AI is a possible future
  enhancement once infra exists.
- **First language:** JavaScript.
- **Git flow:** feature branch + PR per phase.
- **Layout:** simple in-order now; Reingold–Tilford at polish (P7).
