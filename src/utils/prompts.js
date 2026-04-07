// ═══════════════════════════════════════
// FSAI – Quick Prompt Templates
// ═══════════════════════════════════════

export const QUICK_PROMPTS = [
  {
    category: 'Common Errors',
    icon: '⚠️',
    items: [
      { label: 'Stack Trace',     icon: '📋', text: 'Analyze this stack trace:\n\n' },
      { label: 'CORS Error',      icon: '🌐', text: 'I am getting a CORS error. My frontend is on port 3000, backend on 8080. Here is the error:\n\n' },
      { label: 'JWT / Auth Fail', icon: '🔐', text: 'Getting 401 Unauthorized on my API even with a valid JWT token. Middleware:\n\n' },
      { label: 'Memory Leak',     icon: '📈', text: 'My server has a memory leak — CPU/RAM keeps increasing. Here is the code:\n\n' },
    ],
  },
  {
    category: 'Frontend',
    icon: '⚛️',
    items: [
      { label: 'React Bug',        icon: '⚛️',  text: 'I have a React bug causing infinite re-renders. Here is my component:\n\n' },
      { label: 'Next.js SSR',      icon: '▲',   text: 'Next.js hydration mismatch error:\nText content does not match server-rendered HTML.\nComponent:\n\n' },
      { label: 'useEffect Bug',    icon: '🪝',  text: 'My useEffect runs infinitely or behaves unexpectedly. Here is the component:\n\n' },
      { label: 'Redux State Bug',  icon: '🔄',  text: 'My Redux/Zustand state is stale or not updating correctly. Here is the code:\n\n' },
    ],
  },
  {
    category: 'Backend',
    icon: '🖥️',
    items: [
      { label: 'Spring Boot',      icon: '☕',  text: 'Spring Boot error:\norg.hibernate.LazyInitializationException: failed to lazily initialize a collection\n\n' },
      { label: 'Node.js Crash',    icon: '🟢',  text: 'My Node.js/Express app crashes in production. Error log:\n\n' },
      { label: 'Python FastAPI',   icon: '🐍',  text: 'FastAPI/Django error in production. Stack trace:\n\n' },
      { label: 'Go Goroutine',     icon: '🔵',  text: 'My Go goroutine is leaking — memory keeps growing. Here is the code:\n\n' },
    ],
  },
  {
    category: 'Database',
    icon: '🗄️',
    items: [
      { label: 'Slow SQL Query',   icon: '🐢',  text: 'My SQL query is very slow. Here is the query and EXPLAIN output:\n\n' },
      { label: 'ORM N+1 Problem',  icon: '🔗',  text: 'I have an N+1 query problem with my ORM. Here is my resolver/code:\n\n' },
      { label: 'MongoDB Perf',     icon: '🍃',  text: 'MongoDB query is slow even with indexes. Collection has 10M+ documents. Query:\n\n' },
      { label: 'Migration Fail',   icon: '🔀',  text: 'Database migration is failing in production. Migration file and error:\n\n' },
    ],
  },
];

export const WELCOME_CHIPS = [
  { text: 'TypeError: Cannot read properties of undefined (reading .map) in React component',      label: 'React crash' },
  { text: 'PostgreSQL query taking 30 seconds. EXPLAIN shows sequential scan on 5M row table.',    label: 'Slow SQL' },
  { text: 'Getting 401 Unauthorized on JWT middleware even with a valid token from login endpoint', label: 'JWT auth' },
  { text: 'org.hibernate.LazyInitializationException: failed to lazily initialize a collection',   label: 'Hibernate' },
  { text: 'Next.js: Hydration failed because the initial UI does not match server-rendered HTML',  label: 'SSR mismatch' },
  { text: 'Go goroutine leak — pprof shows 10,000+ goroutines growing over time',                  label: 'Goroutine leak' },
  { text: 'MongoDB aggregation pipeline is extremely slow despite compound index on queried fields', label: 'MongoDB perf' },
  { text: 'Laravel Eloquent N+1 query problem: 200 queries per page load on relationship',         label: 'Laravel N+1' },
];
