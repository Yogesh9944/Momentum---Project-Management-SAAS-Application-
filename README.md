# 🚀 Momentum — Ship Projects Faster

> A full-stack MERN project management application that helps teams organize tasks, track progress, and stay productive with a clean and responsive interface.


## 🌐 Live Demo

**👉 [https://momentum-project-management-saas-ap.vercel.app/](https://momentum-project-management-saas-ap.vercel.app/)**

---

## ✨ Features

- 🔐 **User Authentication** — Secure register & login with JWT
- 📁 **Project Management** — Create, update, and delete projects
- ✅ **Task Tracking** — Organize tasks with status (To Do / In Progress / Done)
- 👥 **Team Collaboration** — Assign tasks to team members
- 📊 **Dashboard** — Overview of all projects and task progress
- 📱 **Responsive UI** — Works seamlessly on mobile and desktop

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| Deployment | Vercel (Frontend), Render (Backend) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 14.x
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/Yogesh9944/Momentum---Project-Management-SAAS-Application-.git

# Go into the project directory
cd Momentum---Project-Management-SAAS-Application-

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in the `/server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Run the App

```bash
# Run backend
cd server
npm run dev

# Run frontend (in a new terminal)
cd client
npm start
```

App will be running at `http://localhost:3000`

---

## 📁 Project Structure

```
Momentum/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # Auth & global state
│   │   └── App.js
├── server/                 # Node/Express backend
│   ├── controllers/        # Route logic
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   └── server.js
└── README.md
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create new project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/:id` | Update task status |

---

## 👨‍💻 Author

**Yogesh Sanjay Pande**



---

## 📄 License

This project is licensed under the MIT License.

---

⭐ **If you found this project helpful, please give it a star!**
