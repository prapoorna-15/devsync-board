
# 🎨 DevSync Board

A real-time collaborative whiteboard web application built with **Node.js**, **Express**, **Socket.IO**, and the **HTML5 Canvas API**. Multiple users can draw, interact, and sync canvas states instantly across browsers.

---

## ✨ Features

- 🖌️ **Drawing Tools:** Pencil, Line, Rectangle, Circle, Ellipse, and Text insertion.
- ⚡ **Real-Time Synchronization:** Live drawing sync across all connected clients via Socket.IO.
- 📜 **Canvas History (Catch-Up):** New users instantly receive previous drawing history upon joining.
- 🗑️ **Global Board Reset:** Synchronized "Clear All" action clears the canvas for all connected users simultaneously.
- 👥 **Active User Counter:** Real-time online user count badge.
- 🌓 **Theme Toggle:** Switch between Light and Dark themes.
- 📥 **Export Board:** Download the current board state as a PNG image.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5 Canvas, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Real-Time Engine:** Socket.IO

---

## 🚀 Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/prapoorna-15/devsync-board.git](https://github.com/prapoorna-15/devsync-board.git)
   cd devsync-board

   ## 🌐 Live Demo

Check out the live application here: [DevSync Board Live](https://devsync-board.onrender.com)