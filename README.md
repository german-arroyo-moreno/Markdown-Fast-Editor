# Markdown Fast Editor 🚀

A high-performance, real-time collaborative Markdown editor built with React, Tailwind CSS, and WebSockets.

![Markdown Fast Editor](https://picsum.photos/seed/markdown/1200/600)

## ✨ Features

- **Real-time Collaboration**: Edit documents together with multiple users simultaneously via WebSockets.
- **Live Preview**: See your Markdown rendered in real-time as you type.
- **Advanced Search & Replace**:
  - Case-sensitive search toggle.
  - Regular Expression (Regex) support.
  - Find next/previous match navigation.
  - Global replace and replace all.
- **Customizable Themes**: Choose from multiple themes (Dark, Light, Cyberpunk, Sepia, etc.).
- **Split-Pane Layout**: Resizable editor and preview panes for a flexible workflow.
- **Offline Mode**: Toggle offline mode to work locally without synchronization.
- **File Management**:
  - Download documents as `.md` files.
  - Upload and edit existing Markdown files.
- **History Management**: Undo/Redo support for your editing sessions.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Express (for WebSocket signaling and static serving)
- **Real-time**: WebSockets

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd markdown-fast-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## 📖 Usage

- **Editing**: Type your Markdown in the left pane; the right pane updates instantly.
- **Searching**: Press the search icon in the toolbar or use `Ctrl+F` (if implemented) to open the advanced search bar.
- **Sharing**: Click "Share Link" to copy a collaborative URL to your clipboard.
- **Themes**: Use the palette icon in the header to switch between visual styles.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ using Google AI Studio Build.
