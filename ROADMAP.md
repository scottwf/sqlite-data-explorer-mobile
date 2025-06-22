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

## Ideas & Potential Enhancements

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