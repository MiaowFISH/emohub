# Roadmap: EmoHub

## Overview

EmoHub delivers a personal sticker management system in 4 phases. Starting with project foundation and backend infrastructure, we build image management capabilities, add tagging functionality, and complete with search features and responsive UI. Each phase delivers verifiable user-facing capabilities that build toward the core value: fast tagging and search for 4000+ stickers.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Project Setup & Backend Foundation** - Monorepo structure, database schema, API foundation
- [ ] **Phase 2: Image Management** - Upload, storage, viewing, and optimization
- [ ] **Phase 3: Tag System** - Tagging, tag management, and batch operations
- [ ] **Phase 4: Search & Polish** - Search functionality and responsive UI

## Phase Details

### Phase 1: Project Setup & Backend Foundation
**Goal**: Establish monorepo structure, database schema, and API foundation that all features depend on
**Depends on**: Nothing (first phase)
**Requirements**: None directly (enables all other requirements)
**Success Criteria** (what must be TRUE):
  1. Monorepo workspace structure exists with shared types accessible across packages
  2. Database schema is created with Prisma migrations applied successfully
  3. Fastify API server starts and responds to health check endpoint
  4. File storage directory structure exists and accepts test file writes
**Plans**: TBD

Plans:
- [ ] 01-01: TBD during planning

### Phase 2: Image Management
**Goal**: Users can upload, view, and manage their sticker collection
**Depends on**: Phase 1
**Requirements**: IMG-01, IMG-02, IMG-03, IMG-04, IMG-05, IMG-06, IMG-07, IMG-08
**Success Criteria** (what must be TRUE):
  1. User can drag and drop multiple images to upload them to the system
  2. User can view all uploaded images in a grid layout with smooth scrolling
  3. User can click an image to see full-size preview
  4. User can delete single or multiple selected images
  5. Uploaded images are automatically compressed and thumbnails are generated
  6. System detects and warns about duplicate images during upload
  7. User can convert images to single-frame GIF format
**Plans**: TBD

Plans:
- [ ] 02-01: TBD during planning

### Phase 3: Tag System
**Goal**: Users can organize images with tags and perform batch tagging operations
**Depends on**: Phase 2
**Requirements**: TAG-01, TAG-02, TAG-03, TAG-04
**Success Criteria** (what must be TRUE):
  1. User can add multiple tags to a single image
  2. User can create new tags, rename existing tags, and delete unused tags
  3. User can filter the image grid to show only images with specific tags
  4. User can select multiple images and add or remove tags in batch
**Plans**: TBD

Plans:
- [ ] 03-01: TBD during planning

### Phase 4: Search & Polish
**Goal**: Users can search for images and use the system on different screen sizes
**Depends on**: Phase 3
**Requirements**: SRCH-01, SRCH-02, UX-01
**Success Criteria** (what must be TRUE):
  1. User can search images by typing tag names and see filtered results
  2. User can search images by typing keywords that match filenames or tag names
  3. Web interface adapts to different screen sizes (mobile, tablet, desktop)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Setup & Backend Foundation | 0/TBD | Not started | - |
| 2. Image Management | 0/TBD | Not started | - |
| 3. Tag System | 0/TBD | Not started | - |
| 4. Search & Polish | 0/TBD | Not started | - |
