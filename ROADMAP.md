# Project Roadmap

## Features Implemented

- Upload SQLite database files (.db, .sqlite, .sqlite3) via drag-and-drop or file picker
- All processing happens locally in the browser (no server upload)
- Database schema browser: view tables, columns, types, PK, etc.
- Table data viewer: search, sort, paginate, and view all rows
- Add, edit, and delete rows with dialogs and validation
- Full cell content overlay for truncated/large cell values
- Pretty-print and scrollable overlay for JSON cell content
- AI Query Generator: generate SQL from natural language using Ollama (URL configurable and persistent)
- Execute custom SQL queries and view results
- Toast notifications for user feedback and errors
- Responsive/mobile-friendly UI
- Modern design with shadcn-ui and Tailwind CSS

## Phase 1: Remote Database Connection Infrastructure (In Progress)
- [x] Create RemoteDatabaseManager component to handle Flask server connections
- [x] Add connection configuration UI with URL input and validation
- [x] Implement connection testing for Flask endpoints (Actual fetch to /ping implemented)
- [x] Create database connection switcher (Local vs Remote)
- [x] Add persistent storage for connection configurations (localStorage for URL)

## Phase 2: Remote Database Loading & API Integration
- [ ] Create HTTP client for fetching SQLite files from Flask servers
- [ ] Implement database download with progress indicators
- [ ] Add caching mechanism for remote databases
- [ ] Handle CORS and authentication if needed
- [ ] Modify existing DatabaseUpload component to support remote sources

## Phase 3: Enhanced Database Operations
- [ ] Update CRUD operations to work with remote databases
- [ ] Implement proper error handling for network operations
- [ ] Add conflict detection for concurrent modifications
- [ ] Create database synchronization capabilities
- [ ] Enable real-time CRUD operations on remote databases

## Phase 4: UI/UX Improvements
- [x] Add connection status indicators throughout the interface (Basic status bar added)
- [ ] Create database connection management panel (Partially done with Settings modal)
- [ ] Implement automatic discovery of Flask servers (if following patterns)
- [ ] Add loading states and better error messages
- [ ] Enable quick switching between multiple remote databases

## Phase 5: Advanced Features & Polish
- [ ] Add database change detection and refresh capabilities
- [ ] Implement offline mode with cached databases
- [ ] Add connection health monitoring
- [ ] Create export/import of connection configurations
- [ ] Add comprehensive error recovery mechanisms

## General Ideas & Potential Enhancements (Existing)

- Export table/query results to CSV/JSON
- Import/merge data from CSV/JSON
- Copy cell/row/table to clipboard
- Syntax highlighting for SQL and JSON
- Table/column/row filtering and advanced search
- Table relationships/foreign key visualization
- Save and manage custom queries
- User settings (theme, page size, etc.)
- Dark mode toggle
- Database versioning/history/undo
- Integration with other AI models or APIs
- Share database snapshots or queries
- Multi-database support
- Performance optimizations for very large databases
- Accessibility improvements
- More granular permissions/roles for collaborative use 