import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard"; // Pura nav system yahan hoga
import Payment from "./components/Payment";
import './App.css';

function App() {
  return (
    <Router>
      <div style={{ fontFamily: "sans-serif", padding: "20px", textAlign: "center", minHeight: "100vh" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pay/:linkId" element={<Payment />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;