import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('orbit.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    duration TEXT,
    description TEXT,
    priority TEXT,
    recurrence TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    due_date TEXT,
    priority TEXT,
    status TEXT DEFAULT 'pending'
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging Middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  
  // Events
  app.get('/api/events', (req, res) => {
    const stmt = db.prepare('SELECT * FROM events ORDER BY date, time');
    const events = stmt.all();
    res.json(events);
  });

  app.post('/api/events', (req, res) => {
    const { title, date, time, duration, description, priority, recurrence } = req.body;
    
    // Default date to today if missing, to prevent NOT NULL constraint error
    const safeDate = date || new Date().toISOString().split('T')[0];
    
    const stmt = db.prepare(`
      INSERT INTO events (title, date, time, duration, description, priority, recurrence)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(title, safeDate, time, duration, description, priority, recurrence);
    res.json({ id: info.lastInsertRowid, ...req.body, date: safeDate });
  });

  app.put('/api/events/:id', (req, res) => {
    const { id } = req.params;
    const { title, date, time, duration, description, priority, recurrence } = req.body;
    const stmt = db.prepare(`
      UPDATE events SET 
        title = COALESCE(?, title), 
        date = COALESCE(?, date), 
        time = COALESCE(?, time), 
        duration = COALESCE(?, duration), 
        description = COALESCE(?, description), 
        priority = COALESCE(?, priority), 
        recurrence = COALESCE(?, recurrence)
      WHERE id = ?
    `);
    stmt.run(title, date, time, duration, description, priority, recurrence, id);
    
    // Fetch updated record to return
    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.json(updated);
  });

  app.delete('/api/events/:id', (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  });

  // Tasks
  app.get('/api/tasks', (req, res) => {
    const stmt = db.prepare('SELECT * FROM tasks ORDER BY status DESC, due_date');
    const tasks = stmt.all();
    res.json(tasks);
  });

  app.post('/api/tasks', (req, res) => {
    const { title, due_date, priority } = req.body;
    const stmt = db.prepare('INSERT INTO tasks (title, due_date, priority) VALUES (?, ?, ?)');
    const info = stmt.run(title, due_date, priority);
    res.json({ id: info.lastInsertRowid, ...req.body, status: 'pending' });
  });

  app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, due_date, priority, status } = req.body;
    const stmt = db.prepare(`
      UPDATE tasks SET 
        title = COALESCE(?, title), 
        due_date = COALESCE(?, due_date), 
        priority = COALESCE(?, priority), 
        status = COALESCE(?, status)
      WHERE id = ?
    `);
    stmt.run(title, due_date, priority, status, id);
    
    // Fetch updated record to return
    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(updated);
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving (if built)
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  // Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
