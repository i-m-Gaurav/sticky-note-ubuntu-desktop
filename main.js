const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const notesDir = path.join(__dirname, 'notes');

// Create notes directory if it doesn't exist
if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    minWidth: 400,
    minHeight: 500,
    frame: false, // Remove default menu bar
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hidden',
    backgroundColor: '#f5f5f5'
  });

  mainWindow.loadFile('index.html');
  
  // Set empty menu to remove default menu bar
  Menu.setApplicationMenu(null);
}

function createStickyNote() {
  const stickyWindow = new BrowserWindow({
    width: 300,
    height: 400,
    minWidth: 250,
    minHeight: 300,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#fffacd',
    alwaysOnTop: true,
    resizable: true
  });

  stickyWindow.loadFile('sticky-note.html');
  return stickyWindow;
}

// IPC handlers
ipcMain.handle('get-notes', () => {
  try {
    const files = fs.readdirSync(notesDir);
    const notes = [];
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(notesDir, file);
        const noteData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        notes.push(noteData);
      }
    });
    
    return notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Error reading notes:', error);
    return [];
  }
});

ipcMain.handle('save-note', (event, noteData) => {
  try {
    const timestamp = new Date().toISOString();
    const noteId = noteData.id || Date.now().toString();
    const note = {
      id: noteId,
      title: noteData.title || 'Untitled',
      content: noteData.content,
      timestamp: timestamp,
      color: noteData.color || '#fffacd'
    };
    
    const filePath = path.join(notesDir, `${noteId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(note, null, 2));
    
    return note;
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
});

ipcMain.handle('delete-note', (event, noteId) => {
  try {
    const filePath = path.join(notesDir, `${noteId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
});

ipcMain.handle('create-sticky-note', () => {
  createStickyNote();
});

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('close-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.close();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
