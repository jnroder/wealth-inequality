// src/components/CensusChart.tsx
import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL;
const CENSUS_ENDPOINT = `${API_URL}/census-data`;

interface CensusDataPoint {
    year: string;
    medianIncome: number;
    aggregateIncome: number;
    giniIndex: number;
}

function CensusChart(): JSX.Element {
    const [data, setData] = useState<CensusDataPoint[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async (): Promise<void> => {
            try {
                // Skip 2020 due to COVID-19 impact on data collection
                const years = ['2017', '2018', '2019', '2021'].join(',');

                const response = await fetch(
                    `${CENSUS_ENDPOINT}?years=${years}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const jsonData = await response.json();
                setData(jsonData);
            } catch (error) {
                console.error('Error fetching Census data:', error);
                setError(error instanceof Error ? error.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;

    const formatTooltipValue = (value: number | string, name: string) => {
        if (name === 'Gini Index') {
            return Number(value).toFixed(3);
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(Number(value));
    };

    return (
        <div className="w-full h-[600px]">
            <h2 className="text-2xl font-bold mb-4">Census: Income Distribution Metrics</h2>
            <LineChart width={800} height={500} data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis
                    yAxisId="income"
                    label={{ value: 'Income ($)', angle: -90 }}
                />
                <YAxis
                    yAxisId="gini"
                    orientation="right"
                    label={{ value: 'Gini Index', angle: 90 }}
                />
                <Tooltip formatter={formatTooltipValue} />
                <Legend />
                <Line
                    yAxisId="income"
                    type="monotone"
                    dataKey="medianIncome"
                    stroke="#2563eb"
                    name="Median Income"
                />
                <Line
                    yAxisId="income"
                    type="monotone"
                    dataKey="aggregateIncome"
                    stroke="#16a34a"
                    name="Aggregate Income"
                />
                <Line
                    yAxisId="gini"
                    type="monotone"
                    dataKey="giniIndex"
                    stroke="#dc2626"
                    name="Gini Index"
                />
            </LineChart>
        </div>
    );
}

export default CensusChart;