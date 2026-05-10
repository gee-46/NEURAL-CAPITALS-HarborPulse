import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HarborMasterDashboard from './components/HarborMasterDashboard'
import VesselStatus from './components/VesselStatus'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HarborMasterDashboard />} />
        <Route path="/status/:vesselId" element={<VesselStatus />} />
      </Routes>
    </Router>
  )
}

export default App
