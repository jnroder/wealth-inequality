// src/components/FredChart.tsx
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL;
const FRED_ENDPOINT = `${API_URL}/wealth-data`;

interface Observation {
  date: string;
  value: string;
}

interface FredResponse {
  observations: Observation[];
}

interface ChartDataPoint {
  date: number;
  value: number;
}

interface FredChartProps {
  endpoint: string;
}

function FredChart(props: FredChartProps): JSX.Element {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const endpoint = `${API_URL}/${props.endpoint}`;
  console.log("FRED endpoint:", endpoint);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const response = await fetch(endpoint || FRED_ENDPOINT);
        const json: FredResponse = await response.json();
        const formattedData: ChartDataPoint[] = json.observations.map(
          (obs) => ({
            date: new Date(obs.date).getFullYear(),
            value: parseFloat(obs.value),
          })
        );
        setData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="w-full h-[600px]">
      <h2 className="text-2xl font-bold mb-4">
        FRED: Share of Total Net Worth Held by the Top 1%
      </h2>
      <LineChart width={800} height={500} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis label={{ value: "Share of Wealth (%)", angle: -90 }} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#2563eb" />
      </LineChart>
    </div>
  );
}

export default FredChart;
