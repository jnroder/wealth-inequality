// App.tsx
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
const API_URL = import.meta.env.VITE_API_URL

interface Observation {
  date: string
  value: string
}

interface FredResponse {
  observations: Observation[]
}

interface ChartDataPoint {
  date: number
  value: number
}

const FRED_ENDPOINT = `${API_URL}/wealth-data`

function App(): JSX.Element {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const response = await fetch(FRED_ENDPOINT)
        const json: FredResponse = await response.json()
        const formattedData: ChartDataPoint[] = json.observations.map(obs => ({
          date: new Date(obs.date).getFullYear(),
          value: parseFloat(obs.value)
        }))
        setData(formattedData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">US Wealth Inequality Over Time</h1>
      <div className="w-full h-[600px]">
        <LineChart width={800} height={500} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: 'Share of Wealth (%)', angle: -90 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#2563eb" />
        </LineChart>
      </div>
    </div>
  )
}

export default App