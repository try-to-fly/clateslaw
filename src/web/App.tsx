import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DrivePage from './pages/DrivePage';
import ChargePage from './pages/ChargePage';
import DailyPage from './pages/DailyPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/drive" element={<DrivePage />} />
        <Route path="/charge" element={<ChargePage />} />
        <Route path="/daily" element={<DailyPage />} />
      </Routes>
    </BrowserRouter>
  );
}
