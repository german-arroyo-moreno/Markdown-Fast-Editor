import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  FileText, 
  Download, 
  Upload, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  Github,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  Strikethrough,
  CheckSquare,
  Square,
  Share2,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Users,
  Moon,
  Sun,
  Type,
  Book,
  Zap,
  Cpu,
  Sparkles,
  PenTool,
  Skull,
  Palette,
  Search,
  Replace,
  ReplaceAll,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';

const DEFAULT_MARKDOWN = `# 🚀 Collaborative Markdown Studio Demo

Welcome to the most professional collaborative editor! This demo showcases all the features available.

## 📝 Text Formatting
- **Bold** with \`**\` or __Bold__ with \`__\`
- *Italic* with \`*\` or _Italic_ with \`_\`
- ~~Strikethrough~~ with \`~~\`
- \`Inline Code\` with backticks
- Em-dash replacement: -- becomes —

## 📊 Tables
| Feature | Status | Description |
| :--- | :---: | :--- |
| Real-time | ✅ | Instant sync across clients |
| Offline Mode | 📶 | Edit locally without server |
| History | 🕒 | Undo/Redo support |

## ✅ Task Lists
- [x] Implement WebSockets
- [x] Add Markdown Preview
- [ ] Add AI assistance

## 🔗 Links & Autolinks
- [Google](https://google.com)
- Autolink: <http://www.google.com>

## 💻 Code Highlighting
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet('Collaborator');
\`\`\`

## 🖼️ Images
![Alan Turing](https://upload.wikimedia.org/wikipedia/commons/c/ce/Alan_turing_header.jpg)`;

const HELP_COMMANDS = [
  { label: 'Bold', command: '**text** or __text__', description: 'Makes text bold' },
  { label: 'Italic', command: '*text* or _text_', description: 'Makes text italic' },
  { label: 'Strikethrough', command: '~~text~~', description: 'Strokes through text' },
  { label: 'Heading 1', command: '# Heading', description: 'Creates a large heading' },
  { label: 'Heading 2', command: '## Heading', description: 'Creates a medium heading' },
  { label: 'Heading 3', command: '### Heading', description: 'Creates a small heading' },
  { label: 'Link', command: '[title](url)', description: 'Creates a hyperlink' },
  { label: 'Image', command: '![alt](url)', description: 'Embeds an image' },
  { label: 'List', command: '- item', description: 'Creates a bulleted list' },
  { label: 'Task List', command: '- [ ] item', description: 'Creates a checkbox list' },
  { label: 'Code Block', command: '\`\`\`code\`\`\`', description: 'Creates a code block' },
  { label: 'Blockquote', command: '> quote', description: 'Creates a blockquote' },
];

export default function App() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [history, setHistory] = useState<string[]>([DEFAULT_MARKDOWN]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [splitPosition, setSplitPosition] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [collaboratorCount, setCollaboratorCount] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchMatches, setSearchMatches] = useState<Array<{ index: number, length: number }>>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const markdownRef = useRef(markdown);

  const THEMES = [
    { id: 'dark', label: 'Dark', icon: <Moon size={14} /> },
    { id: 'light', label: 'Light', icon: <Sun size={14} /> },
    { id: 'typewriter', label: 'Typewriter', icon: <Type size={14} /> },
    { id: 'fantasy', label: 'Fantasy', icon: <Book size={14} /> },
    { id: 'sci-fi', label: 'Sci-Fi', icon: <Zap size={14} /> },
    { id: 'cyberpunk', label: 'Cyberpunk', icon: <Cpu size={14} /> },
    { id: 'anime', label: 'Anime', icon: <Sparkles size={14} /> },
    { id: 'writer', label: 'Writer', icon: <PenTool size={14} /> },
    { id: 'terror', label: 'Terror', icon: <Skull size={14} /> },
  ];

  // Keep ref in sync for socket handlers
  useEffect(() => {
    markdownRef.current = markdown;
  }, [markdown]);

  // WebSocket Setup
  useEffect(() => {
    if (isOffline) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      setCollaboratorCount(1);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      console.log('Connected to server');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init' || data.type === 'update') {
        if (data.content !== markdownRef.current) {
          setMarkdown(data.content);
          setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            if (newHistory[newHistory.length - 1] === data.content) return prev;
            return [...newHistory, data.content].slice(-50);
          });
          setHistoryIndex(prev => Math.min(prev + 1, 49));
        }
      } else if (data.type === 'presence') {
        setCollaboratorCount(data.count);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    };

    return () => {
      socket.close();
    };
  }, [isOffline]); // Only reconnect when toggling offline mode

  const addToHistory = (newContent: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      if (newHistory[newHistory.length - 1] === newContent) return prev;
      return [...newHistory, newContent].slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  };

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setMarkdown(newContent);
    addToHistory(newContent);
    if (!isOffline && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'update', content: newContent }));
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevContent = history[newIndex];
      setHistoryIndex(newIndex);
      setMarkdown(prevContent);
      if (!isOffline && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'update', content: prevContent }));
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextContent = history[newIndex];
      setHistoryIndex(newIndex);
      setMarkdown(nextContent);
      if (!isOffline && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'update', content: nextContent }));
      }
    }
  };

  const handleSearch = (query: string, caseSensitive: boolean = isCaseSensitive, regex: boolean = isRegex) => {
    setSearchQuery(query);
    if (!query) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const matches: Array<{ index: number, length: number }> = [];
    try {
      if (regex) {
        const flags = caseSensitive ? 'g' : 'gi';
        const re = new RegExp(query, flags);
        let match;
        while ((match = re.exec(markdown)) !== null) {
          matches.push({ index: match.index, length: match[0].length });
          if (match[0].length === 0) re.lastIndex++; // Avoid infinite loop for empty matches
        }
      } else {
        const searchStr = caseSensitive ? query : query.toLowerCase();
        const contentStr = caseSensitive ? markdown : markdown.toLowerCase();
        let pos = contentStr.indexOf(searchStr);
        while (pos !== -1) {
          matches.push({ index: pos, length: query.length });
          pos = contentStr.indexOf(searchStr, pos + 1);
        }
      }
    } catch (e) {
      // Invalid regex
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    setSearchMatches(matches);
    setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
    
    if (matches.length > 0 && textareaRef.current) {
      const firstMatch = matches[0];
      // Do not focus the textarea while typing in the search bar
      textareaRef.current.setSelectionRange(firstMatch.index, firstMatch.index + firstMatch.length);
      
      // Scroll to the match
      const lineHeight = 24; // Approximate
      const linesBefore = markdown.substring(0, firstMatch.index).split('\n').length - 1;
      textareaRef.current.scrollTop = linesBefore * lineHeight - 100;
    }
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIndex);
    const match = searchMatches[nextIndex];
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(match.index, match.index + match.length);
      
      const lineHeight = 24;
      const linesBefore = markdown.substring(0, match.index).split('\n').length - 1;
      textareaRef.current.scrollTop = linesBefore * lineHeight - 100;
    }
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIndex);
    const match = searchMatches[prevIndex];
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(match.index, match.index + match.length);
      
      const lineHeight = 24;
      const linesBefore = markdown.substring(0, match.index).split('\n').length - 1;
      textareaRef.current.scrollTop = linesBefore * lineHeight - 100;
    }
  };

  const handleReplace = () => {
    if (currentMatchIndex === -1 || !searchQuery) return;
    const match = searchMatches[currentMatchIndex];
    const newContent = markdown.substring(0, match.index) + replaceText + markdown.substring(match.index + match.length);
    setMarkdown(newContent);
    addToHistory(newContent);
    
    // Broadcast change
    if (!isOffline && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'update', content: newContent }));
    }
    
    // Re-search to update matches
    handleSearch(searchQuery, isCaseSensitive, isRegex);
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    let newContent = markdown;
    try {
      if (isRegex) {
        const flags = isCaseSensitive ? 'g' : 'gi';
        const re = new RegExp(searchQuery, flags);
        newContent = markdown.replace(re, replaceText);
      } else {
        const flags = isCaseSensitive ? 'g' : 'gi';
        // Escape special characters for literal search if using regex replace
        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escapedQuery, flags);
        newContent = markdown.replace(re, replaceText);
      }
    } catch (e) {
      return;
    }

    setMarkdown(newContent);
    addToHistory(newContent);
    
    // Broadcast change
    if (!isOffline && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'update', content: newContent }));
    }
    
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
  };

  // Split Pane Logic
  const handleMouseDown = () => setIsDragging(true);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constraints
    if (newPosition > 10 && newPosition < 90) {
      setSplitPosition(newPosition);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // File Operations
  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setMarkdown(content);
      addToHistory(content);
      if (!isOffline && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'update', content }));
      }
    };
    reader.readAsText(file);
  };

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    
    setMarkdown(newText);
    addToHistory(newText);
    if (!isOffline && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'update', content: newText }));
    }
    
    // Focus back and set cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + before.length, end + before.length);
      }
    }, 0);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  // Custom Markdown Components
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const highlighterStyle = currentTheme === 'light' || currentTheme === 'typewriter' || currentTheme === 'writer' || currentTheme === 'anime' ? prism : vscDarkPlus;
      
      return !inline && match ? (
        <SyntaxHighlighter
          style={highlighterStyle}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    input({ checked, type }: any) {
      if (type === 'checkbox') {
        return (
          <span className="inline-flex items-center mr-2 mt-1 flex-shrink-0">
            {checked ? (
              <div className="relative w-4 h-4 border border-[var(--accent)] bg-[var(--accent)]/20 rounded flex items-center justify-center">
                <X className="w-3 h-3 text-[var(--accent)] stroke-[3]" />
              </div>
            ) : (
              <div className="w-4 h-4 border border-[var(--text-muted)] rounded" />
            )}
          </span>
        );
      }
      return <input type={type} checked={checked} readOnly />;
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-screen overflow-hidden transition-colors duration-300",
      `theme-${currentTheme}`,
      "bg-[var(--bg-app)] text-[var(--text-main)]"
    )}>
      {/* Header */}
      <header className="h-14 border-b border-[var(--border-main)] flex items-center justify-between px-4 bg-[var(--bg-header)] z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--accent)] rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold text-lg hidden sm:block text-[var(--text-header)]">Markdown Fast Editor</h1>
          
          <div className="flex items-center gap-2 ml-4">
            <button 
              onClick={() => setIsOffline(!isOffline)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                isOffline 
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              )}
            >
              {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              {isOffline ? 'Offline Mode' : 'Online Mode'}
            </button>
            
            {!isOffline && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                <Users className="w-3 h-3" />
                <span>{collaboratorCount} {collaboratorCount === 1 ? 'Collaborator' : 'Collaborators'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-toolbar)] border border-[var(--border-main)] rounded-lg text-xs font-medium text-[var(--text-main)] hover:border-[var(--accent)] transition-all"
            >
              <Palette size={14} className="text-[var(--accent)]" />
              <span className="hidden md:inline">{THEMES.find(t => t.id === currentTheme)?.label}</span>
            </button>
            
            <AnimatePresence>
              {showThemeMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowThemeMenu(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-[var(--bg-header)] border border-[var(--border-main)] rounded-xl shadow-2xl z-50 overflow-hidden py-1"
                  >
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          setCurrentTheme(theme.id);
                          setShowThemeMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                          currentTheme === theme.id 
                            ? "bg-[var(--accent)] text-white" 
                            : "text-[var(--text-main)] hover:bg-[var(--bg-toolbar)]"
                        )}
                      >
                        {theme.icon}
                        {theme.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleCopyShareLink}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-[var(--accent)]/20"
          >
            {isLinkCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isLinkCopied ? 'Link Copied!' : 'Share Link'}</span>
          </button>

          <div className="h-6 w-px bg-[var(--border-main)] mx-2" />

          <button 
            onClick={() => setShowHelp(true)}
            className="p-2 hover:bg-[var(--bg-toolbar)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-header)]"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleDownload}
            className="p-2 hover:bg-[var(--bg-toolbar)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-header)]"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <label className="p-2 hover:bg-[var(--bg-toolbar)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-header)] cursor-pointer" title="Upload">
            <Upload className="w-5 h-5" />
            <input type="file" accept=".md" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </header>
      
      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-[var(--border-main)] bg-[var(--bg-header)] overflow-hidden"
          >
            <div className="p-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[var(--bg-toolbar)] border border-[var(--border-main)] rounded-lg px-2 py-1 focus-within:border-[var(--accent)] transition-all">
                <Search size={14} className="text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  placeholder="Find..." 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value, isCaseSensitive, isRegex)}
                  className="bg-transparent border-none outline-none text-sm text-[var(--text-main)] w-32 md:w-48"
                />
                {searchMatches.length > 0 && (
                  <span className="text-[10px] font-mono text-[var(--text-muted)] ml-2">
                    {currentMatchIndex + 1}/{searchMatches.length}
                  </span>
                )}
                <div className="flex items-center gap-1 ml-2">
                  <button 
                    onClick={handlePrevMatch}
                    className="p-1 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)]"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button 
                    onClick={handleNextMatch}
                    className="p-1 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)]"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer group" title="Match Case">
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                    isCaseSensitive ? "bg-[var(--accent)] border-[var(--accent)]" : "border-[var(--border-main)] group-hover:border-[var(--text-muted)]"
                  )}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isCaseSensitive}
                      onChange={(e) => {
                        setIsCaseSensitive(e.target.checked);
                        handleSearch(searchQuery, e.target.checked, isRegex);
                      }}
                    />
                    {isCaseSensitive && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-[11px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">Aa</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer group" title="Use Regular Expression">
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                    isRegex ? "bg-[var(--accent)] border-[var(--accent)]" : "border-[var(--border-main)] group-hover:border-[var(--text-muted)]"
                  )}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isRegex}
                      onChange={(e) => {
                        setIsRegex(e.target.checked);
                        handleSearch(searchQuery, isCaseSensitive, e.target.checked);
                      }}
                    />
                    {isRegex && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-[11px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">.*</span>
                </label>
              </div>

              <div className="flex items-center gap-2 bg-[var(--bg-toolbar)] border border-[var(--border-main)] rounded-lg px-2 py-1 focus-within:border-[var(--accent)] transition-all">
                <Replace size={14} className="text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  placeholder="Replace with..." 
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-[var(--text-main)] w-32 md:w-48"
                />
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleReplace}
                  className="px-3 py-1 bg-[var(--bg-toolbar)] border border-[var(--border-main)] rounded-lg text-xs font-medium text-[var(--text-main)] hover:border-[var(--accent)] transition-all flex items-center gap-2"
                >
                  <Replace size={12} />
                  Replace
                </button>
                <button 
                  onClick={handleReplaceAll}
                  className="px-3 py-1 bg-[var(--bg-toolbar)] border border-[var(--border-main)] rounded-lg text-xs font-medium text-[var(--text-main)] hover:border-[var(--accent)] transition-all flex items-center gap-2"
                >
                  <ReplaceAll size={12} />
                  Replace All
                </button>
              </div>

              <button 
                onClick={() => setShowSearch(false)}
                className="ml-auto p-1 hover:bg-[var(--bg-toolbar)] rounded text-[var(--text-muted)]"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="h-10 border-b border-[var(--border-main)] bg-[var(--bg-toolbar)] flex items-center px-2 gap-1 overflow-x-auto no-scrollbar">
        <button 
          onClick={handleUndo} 
          disabled={historyIndex === 0}
          className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)] disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button 
          onClick={handleRedo} 
          disabled={historyIndex === history.length - 1}
          className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)] disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-[var(--border-main)] mx-1" />

        <button 
          onClick={() => setShowSearch(!showSearch)} 
          className={cn(
            "p-1.5 rounded transition-all",
            showSearch 
              ? "bg-[var(--accent)] text-white" 
              : "hover:bg-[var(--bg-header)] text-[var(--text-muted)] hover:text-[var(--text-header)]"
          )}
          title="Search & Replace"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-[var(--border-main)] mx-1" />
        <button onClick={() => insertText('# ')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]"><Heading1 className="w-4 h-4" /></button>
        <button onClick={() => insertText('## ')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]"><Heading2 className="w-4 h-4" /></button>
        <button onClick={() => insertText('### ')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]"><Heading3 className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-[var(--border-main)] mx-1" />
        <button onClick={() => insertText('**', '**')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]" title="Bold (**)">
          <Bold className="w-4 h-4" />
        </button>
        <button onClick={() => insertText('__', '__')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)] text-[10px] font-bold" title="Bold (__)">
          __
        </button>
        <button onClick={() => insertText('*', '*')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]" title="Italic (*)">
          <Italic className="w-4 h-4" />
        </button>
        <button onClick={() => insertText('_', '_')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)] text-[10px] font-bold" title="Italic (_)">
          _
        </button>
        <button onClick={() => insertText('~~', '~~')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]" title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-[var(--border-main)] mx-1" />
        <button onClick={() => insertText('- ')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]"><List className="w-4 h-4" /></button>
        <button onClick={() => insertText('- [ ] ')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]"><CheckSquare className="w-4 h-4" /></button>
        <button onClick={() => insertText('[', '](url)')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]"><LinkIcon className="w-4 h-4" /></button>
        <button onClick={() => insertText('![alt](', ')')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]"><ImageIcon className="w-4 h-4" /></button>
        <button onClick={() => insertText('```\n', '\n```')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]"><Code className="w-4 h-4" /></button>
        <button onClick={() => insertText('> ')} className="p-1.5 hover:bg-[var(--bg-header)] rounded text-[var(--text-muted)] hover:text-[var(--text-header)]"><Quote className="w-4 h-4" /></button>
        
        <div className="flex-1" />
        
        <button 
          onClick={handleCopyMarkdown}
          className="flex items-center gap-2 px-3 py-1 hover:bg-[var(--bg-header)] rounded text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-header)] transition-colors"
        >
          {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {isCopied ? 'Copied!' : 'Copy Markdown'}
        </button>
      </div>

      {/* Main Editor Area */}
      <main ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* Editor Side */}
        <div 
          style={{ width: `${splitPosition}%` }}
          className="h-full flex flex-col bg-[var(--bg-editor)]"
        >
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={handleMarkdownChange}
            className="flex-1 w-full p-6 bg-transparent outline-none resize-none text-sm leading-relaxed text-[var(--text-main)] selection:bg-[var(--accent)]/30"
            style={{ fontFamily: 'var(--font-editor)' }}
            placeholder="Write your markdown here..."
            spellCheck={false}
          />
        </div>

        {/* Resizer */}
        <div 
          onMouseDown={handleMouseDown}
          className={cn(
            "w-1 h-full cursor-col-resize hover:bg-[var(--accent)]/50 transition-colors z-10 flex items-center justify-center group",
            isDragging ? "bg-[var(--accent)]" : "bg-[var(--border-main)]"
          )}
        >
          <div className="w-4 h-8 bg-[var(--bg-header)] border border-[var(--border-main)] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-0.5 h-3 bg-[var(--text-muted)] rounded-full mx-px" />
            <div className="w-0.5 h-3 bg-[var(--text-muted)] rounded-full mx-px" />
          </div>
        </div>

        {/* Preview Side */}
        <div 
          style={{ width: `${100 - splitPosition}%` }}
          className="h-full bg-[var(--bg-preview)] overflow-y-auto"
        >
          <div className="p-8 prose max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={components}
            >
              {markdown.replace(/(?<!-)--(?!-)/g, '—')}
            </ReactMarkdown>
          </div>
        </div>

        {/* Drag Overlay */}
        {isDragging && <div className="absolute inset-0 z-20 cursor-col-resize" />}
      </main>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--bg-header)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-main)] bg-[var(--bg-toolbar)]">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--text-header)]">
                  <HelpCircle className="w-5 h-5 text-[var(--accent)]" />
                  Markdown Guide
                </h2>
                <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-[var(--bg-toolbar)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--text-header)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {HELP_COMMANDS.map((cmd) => (
                    <div key={cmd.label} className="p-4 bg-[var(--bg-toolbar)] border border-[var(--border-main)] rounded-xl hover:border-[var(--accent)]/50 transition-colors group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[var(--text-muted)]">{cmd.label}</span>
                        <code className="text-xs px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded border border-[var(--accent)]/20">
                          {cmd.command}
                        </code>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{cmd.description}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-4 bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-xl">
                  <h3 className="text-sm font-semibold text-[var(--accent)] mb-2">Pro Tip</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    This is a real-time collaborative editor. Any changes you make are instantly visible to everyone else viewing this page. You can drag the center divider to adjust your local view.
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-toolbar)] flex justify-end">
                <button 
                  onClick={() => setShowHelp(false)}
                  className="px-6 py-2 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg font-medium transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Status Bar */}
      <footer className="h-6 border-t border-[var(--border-main)] bg-[var(--bg-toolbar)] flex items-center justify-between px-4 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
        <div className="flex items-center gap-4">
          <span>Markdown UTF-8</span>
          <span>{markdown.length} characters</span>
          <span>{markdown.split(/\s+/).filter(Boolean).length} words</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>{isOffline ? 'Local Mode' : 'Collaboration Active'}</span>
            <div className={cn("w-1.5 h-1.5 rounded-full", isOffline ? "bg-amber-500" : "bg-emerald-500")} />
          </div>
          <div className="flex items-center gap-2">
            <span>Theme: {THEMES.find(t => t.id === currentTheme)?.label}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
