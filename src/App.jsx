import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TestReport from './TestReport'
import ConfirmBenchmarkTest from './ConfirmBenchmarkTest'
import './App.css'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/test-report" element={<TestReport />} />
        <Route path="/confirm-benchmark-test" element={<ConfirmBenchmarkTest />} />
        <Route path="/" element={<Navigate to="/test-report" replace />} />
      </Routes>
    </div>
  )
}

export default App