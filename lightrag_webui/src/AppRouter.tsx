import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'

export default function AppRouter() {
  return (
    <Router basename='/webui'>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </Router>
  )
}
