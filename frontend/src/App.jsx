import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import EncoderDecoder from './pages/EncoderDecoder';
import LearnEncode from './pages/LearnEncode';
import LearnDecode from './pages/LearnDecode';

function NotFound() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title-row">Page not found</h1>
        <p className="page-subtitle">That page doesn't exist. <Link className="feature-link" to="/">Back to home →</Link></p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              {/* key forces a fresh workspace when switching between modes */}
              <Route path="/encode" element={<EncoderDecoder key="encode" mode="encode" />} />
              <Route path="/decode" element={<EncoderDecoder key="decode" mode="decode" />} />
              <Route path="/learn-encode" element={<LearnEncode />} />
              <Route path="/learn-decode" element={<LearnDecode />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
