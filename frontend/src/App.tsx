import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { Dashboard, Keywords, Hotspots } from './pages';
import { WebSocketProvider } from './contexts/WebSocketContext';

function App() {
  return (
    <BrowserRouter>
      <WebSocketProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/keywords" element={<Keywords />} />
            <Route path="/hotspots" element={<Hotspots />} />
          </Routes>
        </Layout>
      </WebSocketProvider>
    </BrowserRouter>
  );
}

export default App;
