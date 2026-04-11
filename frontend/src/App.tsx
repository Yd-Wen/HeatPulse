import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { Dashboard, Keywords, Hotspots } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/keywords" element={<Keywords />} />
          <Route path="/hotspots" element={<Hotspots />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
