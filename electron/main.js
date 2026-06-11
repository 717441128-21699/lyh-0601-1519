const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')

const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development'

function checkDevServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5173', (res) => {
      resolve(res.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(2000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: '智慧体育俱乐部管理系统',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  const devServerAvailable = await checkDevServer()
  
  if (isDev || devServerAvailable) {
    win.loadURL('http://localhost:5173')
    if (isDev) {
      win.webContents.openDevTools()
    }
  } else {
    const distPath = path.join(__dirname, '../dist/index.html')
    if (fs.existsSync(distPath)) {
      win.loadFile(distPath)
    } else {
      win.loadURL('http://localhost:5173')
    }
  }

  win.setMenuBarVisibility(false)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
