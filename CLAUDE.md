# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EasyProject** is a single-file enterprise web application for project lifecycle management at BYG Soluciones (construction/reform company). The entire application lives in `index.html` (~8,300 lines).

## No Build System

There is no build process, package manager, or compilation step. The app is a plain HTML file served directly. All dependencies are loaded via CDN:
- Supabase JS client (auth, database, storage)
- XLSX (Excel parsing)
- PDF.js (PDF parsing)
- jsPDF (PDF generation)
- Mammoth.js (DOCX parsing)

To run locally, open `index.html` in a browser or serve it with any static file server (e.g., `python -m http.server`).

## Architecture

The file is structured in three sequential sections:
1. **CSS** (lines ~12–336): Inline `<style>` block; all component styles, color-coded by department, responsive at 768px breakpoint
2. **HTML markup** (lines ~337–800): Panel `<div>`s representing each screen—hidden/shown via `showPanel()`
3. **JavaScript** (lines ~800–end): All application logic in one `<script>` block

### Panel-Based Navigation

The UI is built as ~20 named panels (e.g., `panel-dashboard`, `panel-jefe-obra`, `panel-evaluacion`, `panel-analisis`, `panel-proyecto-detalle`). Navigation is handled by `showPanel(panelId)` which toggles `display: none/block`.

### Role-Based Access

Two globals control the session: `currentUser` and `currentDept`. Six department roles exist: Técnico, Dirección, Comercial, PRL, Admin, Jefe Obra. Each department has a themed color and access to specific panels.

### Data Layer

All persistence goes through the Supabase client stored in the `db` global. All CRUD uses async/await Supabase queries. File uploads go to the `project-attachments` Supabase Storage bucket.

### AI / Automation Integration

AI document analysis and certification comparison are triggered via n8n webhook calls. Functions like `analizarDocumentosIA()` and `compararCertificacionIA()` POST to n8n endpoints and display results in the UI.

### Project Lifecycle Workflow

Projects move through states: **Solicited → Analysis → Quote → Awarded → Execution**. The evaluation step (`panel-evaluacion`) requires simultaneous approval from three departments (Technical, Commercial, Management) before a project advances.

## Key Functions to Know

| Function | Purpose |
|---|---|
| `doLogin()` / `doLogout()` | Authentication |
| `showPanel(id)` | Panel navigation |
| `abrirProyecto()`, `abrirAnalisis()`, `abrirEvaluacion()` | Open project detail views |
| `analizarDocumentosIA()` | Send docs to n8n for AI analysis |
| `compararCertificacionIA()` | AI comparison of certification docs |
| `generarPdfInforme()` | Generate and upload PDF report |
| `registrarEvaluación()` | Record multi-department approval |
| `guardarCliente()`, `guardarProveedor()`, `guardarEmpleado()` | Master data CRUD |

## Conventions

- UI text and variable names are in **Spanish**
- State is held in DOM attributes and JavaScript globals (no state management library)
- Event handlers are a mix of inline `onclick` attributes and `addEventListener` calls
- Responsive layout uses CSS Grid with a single 768px breakpoint and a hamburger menu for mobile
