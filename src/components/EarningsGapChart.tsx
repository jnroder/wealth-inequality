import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Label,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL;
const API_ENDPOINT = `${API_URL}/earnings-gap`;

const EarningsGapChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayMode, setDisplayMode] = useState("weekly"); // 'weekly' or 'annual'
  const [displayMetric, setDisplayMetric] = useState("absolute"); // 'absolute' or 'percent'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Replace with your API Gateway endpoint that invokes your Lambda
        const response = await fetch(API_ENDPOINT);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        setData(result.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching earnings data:", err);
        setError("Failed to load earnings data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format data based on display options
  const getFormattedData = () => {
    if (!data || data.length === 0) return [];

    return data.map((item) => {
      if (displayMode === "weekly") {
        return {
          year: item.year,
          mean: item.meanWeekly,
          median: item.medianWeekly,
          gap:
            displayMetric === "absolute"
              ? item.weeklyGap
              : item.weeklyGapPercent,
        };
      } else {
        return {
          year: item.year,
          mean: item.meanAnnual,
          median: item.medianAnnual,
          gap:
            displayMetric === "absolute"
              ? item.annualGap
              : item.annualGapPercent,
        };
      }
    });
  };

  const chartData = getFormattedData();

  // Get the most recent year's data for the summary cards
  const getCurrentData = () => {
    if (!data || data.length === 0) return null;
    return data[data.length - 1];
  };

  const currentData = getCurrentData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">
          U.S. Mean vs. Median Earnings Gap
        </h2>
        <p className="text-gray-600 mb-4">
          Comparing mean and median earnings shows the impact of income
          inequality. When the mean (average) exceeds the median (middle value),
          it indicates that high earners are pulling the average upward, while
          most workers earn less than the "average" suggests.
        </p>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="space-x-2">
            <button
              onClick={() => setDisplayMode("weekly")}
              className={`px-3 py-1 rounded ${
                displayMode === "weekly"
                  ? "bg-blue-600 text-gray-400"
                  : "bg-gray-200"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setDisplayMode("annual")}
              className={`px-3 py-1 rounded ${
                displayMode === "annual"
                  ? "bg-blue-600 text-gray-400"
                  : "bg-gray-200"
              }`}
            >
              Annual
            </button>
          </div>

          <div className="px-2">
            <button
              onClick={() => setDisplayMetric("absolute")}
              className={`px-3 py-1 rounded ${
                displayMetric === "absolute"
                  ? "bg-green-600 text-gray-400"
                  : "bg-gray-200"
              }`}
            >
              Dollar Gap
            </button>
            <button
              onClick={() => setDisplayMetric("percent")}
              className={`px-3 py-1 rounded ${
                displayMetric === "percent"
                  ? "bg-green-600 text-gray-400"
                  : "bg-gray-200"
              }`}
            >
              Percent Gap
            </button>
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />

              <YAxis
                yAxisId="earnings"
                orientation="left"
                domain={["dataMin - 100", "dataMax + 100"]}
                tickFormatter={(value) =>
                  displayMode === "weekly"
                    ? `$${value}`
                    : `$${(value / 1000).toFixed(0)}k`
                }
              >
                <Label
                  value={
                    displayMode === "weekly"
                      ? "Weekly Earnings"
                      : "Annual Earnings"
                  }
                  angle={-90}
                  position="insideLeft"
                />
              </YAxis>

              <YAxis
                yAxisId="gap"
                orientation="right"
                domain={
                  displayMetric === "percent" ? [0, 15] : ["auto", "auto"]
                }
                tickFormatter={(value) =>
                  displayMetric === "percent"
                    ? `${value}%`
                    : displayMode === "weekly"
                    ? `$${value}`
                    : `$${(value / 1000).toFixed(0)}k`
                }
              >
                <Label
                  value={displayMetric === "percent" ? "Gap (%)" : "Gap ($)"}
                  angle={-90}
                  position="insideRight"
                />
              </YAxis>

              <Tooltip
                formatter={(value, name) => {
                  if (name === "gap") {
                    return displayMetric === "percent"
                      ? [`${value.toFixed(1)}%`, "Difference"]
                      : [`$${value.toLocaleString()}`, "Difference"];
                  }
                  return [
                    `$${value.toLocaleString()}`,
                    name === "mean" ? "Mean" : "Median",
                  ];
                }}
                labelFormatter={(year) => `Year: ${year}`}
              />

              <Legend
                payload={[
                  { value: "Mean", type: "line", color: "#8884d8" },
                  { value: "Median", type: "line", color: "#82ca9d" },
                  {
                    value: displayMetric === "percent" ? "Gap (%)" : "Gap ($)",
                    type: "bar",
                    color: "#ffc658",
                  },
                ]}
              />

              <Line
                yAxisId="earnings"
                type="monotone"
                dataKey="mean"
                stroke="#8884d8"
                name="Mean"
                strokeWidth={2}
              />

              <Line
                yAxisId="earnings"
                type="monotone"
                dataKey="median"
                stroke="#82ca9d"
                name="Median"
                strokeWidth={2}
              />

              <Bar
                yAxisId="gap"
                dataKey="gap"
                fill="#ffc658"
                name="Gap"
                barSize={20}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {currentData && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Key Insights</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">Current Gap</h3>
              <p className="text-3xl font-bold text-blue-600">
                {displayMode === "weekly"
                  ? `$${Math.round(
                      displayMetric === "absolute"
                        ? currentData.weeklyGap
                        : currentData.weeklyGapPercent
                    ).toLocaleString()}`
                  : `$${Math.round(
                      displayMetric === "absolute"
                        ? currentData.annualGap
                        : currentData.annualGapPercent
                    ).toLocaleString()}`}
                {displayMetric === "percent" && "%"}
              </p>
              <p className="text-gray-600 mt-1">
                {displayMode === "weekly" ? "Weekly" : "Annual"} difference
                between mean and median earnings
              </p>
            </div>

            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">
                Annualized Earnings ({currentData.year})
              </h3>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Mean</p>
                  <p className="text-xl font-bold">
                    ${Math.round(currentData.meanAnnual).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Median</p>
                  <p className="text-xl font-bold">
                    ${Math.round(currentData.medianAnnual).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">What This Means</h3>
            <p className="text-gray-700">
              The gap between mean and median earnings reveals how national
              "average" statistics can mask economic reality. When the mean
              exceeds the median by {currentData.annualGapPercent.toFixed(1)}%,
              it shows that a small number of high earners significantly skew
              the average upward.
            </p>
            <p className="text-gray-700 mt-2">
              This visualization helps explain why many Americans don't identify
              with reported "average" income figures - because the typical
              (median) worker earns substantially less than these averages
              suggest.
            </p>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500">
        <p>Source: Federal Reserve Economic Data (FRED)</p>
        <p>
          Mean earnings calculated from Average Hourly Earnings (CES0500000011)
          × Average Weekly Hours (AWHAETP)
        </p>
        <p>
          Median earnings from Median Weekly Earnings series (LES1252881600Q)
        </p>
      </div>
    </div>
  );
};

export default EarningsGapChart;
