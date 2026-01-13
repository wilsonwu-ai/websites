import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AuditProgress from './pages/AuditProgress';
import AuditReport from './pages/AuditReport';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/audit/:id" element={<AuditProgress />} />
        <Route path="/report/:id" element={<AuditReport />} />
      </Routes>
    </div>
  );
}

export default App;
