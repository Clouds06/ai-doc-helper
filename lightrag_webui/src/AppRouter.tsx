import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'

export default function AppRouter() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </Router>
  )
}
