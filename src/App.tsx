// src/App.tsx
import FredChart from './components/FredChart'
import CensusChart from './components/CensusChart'

function App(): JSX.Element {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">US Wealth Inequality Over Time</h1>
      <div className="space-y-8">
        <FredChart />
        <CensusChart />
      </div>
    </div>
  )
}

export default App