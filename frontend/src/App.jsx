import { Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import Home from './pages/Home'
import ServiceIntroPage from './pages/ServiceIntroPage'
import ScrollToTop from './components/ScrollToTop'

function App() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/intro" element={<ServiceIntroPage />} />
      </Routes>

      <Footer />
    </div>
  )
}

export default App
