import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FunctionList from './pages/FunctionList';
import Practice from './pages/Practice';
import PracticeResult from './pages/PracticeResult';
import Stats from './pages/Stats';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/functions" element={<FunctionList />} />
        <Route path="/words" element={<FunctionList />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/practice/result" element={<PracticeResult />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
