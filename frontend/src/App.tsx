import MainLayout from "@/layouts/main-layout";
import Login from "@/screens/login";

export default function App() {
  return     <div className="relative flex h-auto min-h-screen w-full flex-col bg-slate-50 group/design-root overflow-x-hidden">
    <MainLayout>
      <Login />
    </MainLayout>
  </div>
}


// import { useState, useEffect } from 'react'
// import axios from 'axios'
// import './App.css'

// interface User {
//   username: string;
//   token?: string;
// }

// interface ApiData {
//   id: number;
//   name: string;
//   value: number;
// }

// const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

// function App() {
//   const [user, setUser] = useState<User | null>(null)
//   const [username, setUsername] = useState('')
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState('')
//   const [data, setData] = useState<ApiData[]>([])
//   const [loading, setLoading] = useState(false)
//   const [apiHealth, setApiHealth] = useState<any>(null)

//   // Check API health on mount
//   useEffect(() => {
//     checkApiHealth()
//   }, [])

//   // Load user from localStorage on mount
//   useEffect(() => {
//     const savedUser = localStorage.getItem('user')
//     if (savedUser) {
//       setUser(JSON.parse(savedUser))
//     }
//   }, [])

//   const checkApiHealth = async () => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/health`)
//       setApiHealth(response.data)
//     } catch (error) {
//       console.error('API health check failed:', error)
//     }
//   }

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setError('')
//     setLoading(true)

//     try {
//       const response = await axios.post(`${API_BASE_URL}/auth/login`, {
//         username,
//         password
//       })

//       const userData = {
//         username: response.data.user.username,
//         token: response.data.token
//       }

//       setUser(userData)
//       localStorage.setItem('user', JSON.stringify(userData))
//       setUsername('')
//       setPassword('')
//     } catch (error: any) {
//       setError(error.response?.data?.error || 'Login failed')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleLogout = () => {
//     setUser(null)
//     setData([])
//     localStorage.removeItem('user')
//   }

//   const fetchProtectedData = async () => {
//     if (!user?.token) return

//     setLoading(true)
//     setError('')

//     try {
//       const response = await axios.get(`${API_BASE_URL}/data`, {
//         headers: {
//           'Authorization': `Bearer ${user.token}`
//         }
//       })

//       setData(response.data.data)
//     } catch (error: any) {
//       setError(error.response?.data?.error || 'Failed to fetch data')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="app">
//       <header className="header">
//         <div className="container">
//           <h1>🚀 MindX Week 1</h1>
//           <p>Full Stack Application - Azure AKS Deployment</p>
//         </div>
//       </header>

//       <main className="main">
//         <div className="container">
//           {/* API Health Status */}
//           <div className="card health-card">
//             <h2>📡 API Health Status</h2>
//             {apiHealth ? (
//               <div className="health-info">
//                 <div className="status-badge success">✅ Connected</div>
//                 <div className="health-details">
//                   <p><strong>Status:</strong> {apiHealth.status}</p>
//                   <p><strong>Environment:</strong> {apiHealth.environment}</p>
//                   <p><strong>Uptime:</strong> {Math.floor(apiHealth.uptime)}s</p>
//                 </div>
//               </div>
//             ) : (
//               <div className="status-badge error">❌ Disconnected</div>
//             )}
//           </div>

//           {/* Authentication Section */}
//           {!user ? (
//             <div className="card auth-card">
//               <h2>🔐 Login</h2>
//               <form onSubmit={handleLogin}>
//                 <div className="form-group">
//                   <label htmlFor="username">Username:</label>
//                   <input
//                     type="text"
//                     id="username"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                     placeholder="Enter username"
//                     required
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label htmlFor="password">Password:</label>
//                   <input
//                     type="password"
//                     id="password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     placeholder="Enter 'demo' as password"
//                     required
//                   />
//                 </div>
//                 {error && <div className="error-message">{error}</div>}
//                 <button type="submit" disabled={loading}>
//                   {loading ? 'Logging in...' : 'Login'}
//                 </button>
//                 <p className="hint">💡 Hint: Use any username and password "demo"</p>
//               </form>
//             </div>
//           ) : (
//             <>
//               <div className="card user-card">
//                 <h2>👤 Welcome, {user.username}!</h2>
//                 <button onClick={handleLogout} className="logout-btn">
//                   Logout
//                 </button>
//               </div>

//               <div className="card data-card">
//                 <h2>📊 Protected Data</h2>
//                 <button onClick={fetchProtectedData} disabled={loading}>
//                   {loading ? 'Loading...' : 'Fetch Data'}
//                 </button>
//                 {error && <div className="error-message">{error}</div>}
//                 {data.length > 0 && (
//                   <div className="data-list">
//                     {data.map((item) => (
//                       <div key={item.id} className="data-item">
//                         <span className="data-name">{item.name}</span>
//                         <span className="data-value">{item.value}</span>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </>
//           )}

//           {/* Deployment Info */}
//           <div className="card info-card">
//             <h2>ℹ️ Deployment Information</h2>
//             <div className="info-list">
//               <p><strong>Frontend:</strong> React + TypeScript + Vite</p>
//               <p><strong>Backend:</strong> Node.js + Express + TypeScript</p>
//               <p><strong>Infrastructure:</strong> Azure Kubernetes Service (AKS)</p>
//               <p><strong>Container Registry:</strong> Azure Container Registry (ACR)</p>
//               <p><strong>Ingress:</strong> Nginx Ingress Controller</p>
//               <p><strong>SSL:</strong> Let's Encrypt (cert-manager)</p>
//             </div>
//           </div>
//         </div>
//       </main>

//       <footer className="footer">
//         <div className="container">
//           <p>MindX Engineer Onboarding Program - Week 1 © 2024</p>
//         </div>
//       </footer>
//     </div>
//   )
// }

// export default App
