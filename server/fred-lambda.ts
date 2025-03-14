import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handlerOnePercent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Construct the API URL with query parameters
        const url = new URL("https://api.stlouisfed.org/fred/series/observations");
        url.searchParams.append("series_id", "WFRBST01134");
        url.searchParams.append("api_key", process.env.FRED_API_KEY || "");
        url.searchParams.append("file_type", "json");

        // Perform the fetch request
        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'max-age=43200'    // 12 hours
            },
            body: JSON.stringify(data)
        };
    } catch (err) {
        console.error("Error fetching data:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data' })
        };
    }
};

// FRED Series IDs
const SERIES = {
    // Mean weekly earnings calculation components
    MEAN_HOURLY: 'CES0500000011', // Average Hourly Earnings of All Employees: Total Private
    WEEKLY_HOURS: 'AWHAETP', // Average Weekly Hours of All Employees: Total Private
    
    // Median weekly earnings
    MEDIAN_WEEKLY: 'LES1252881600Q' // Median Weekly Earnings - Wage and Salary Workers
};

/**
 * Fetches data from FRED API for a specific series
 */
const fetchFREDSeries = async (seriesId: string, startDate: string = '2010-01-01'): Promise<any> => {
    const url = new URL("https://api.stlouisfed.org/fred/series/observations");
    url.searchParams.append("series_id", seriesId);
    url.searchParams.append("api_key", process.env.FRED_API_KEY || "");
    url.searchParams.append("file_type", "json");
    url.searchParams.append("observation_start", startDate);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
        throw new Error(`HTTP error fetching ${seriesId}! Status: ${response.status}`);
    }
    
    return await response.json();
};

export const handlerEarningsGap = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Parse query parameters (optional ones with defaults)
        const queryParams = event.queryStringParameters || {};
        const startDate = queryParams.startDate || '2010-01-01';
        const format = queryParams.format || 'combined'; // 'combined', 'weekly', or 'annual'
        
        // Fetch all three series in parallel
        const [meanHourlyResponse, weeklyHoursResponse, medianWeeklyResponse] = await Promise.all([
            fetchFREDSeries(SERIES.MEAN_HOURLY, startDate),
            fetchFREDSeries(SERIES.WEEKLY_HOURS, startDate),
            fetchFREDSeries(SERIES.MEDIAN_WEEKLY, startDate)
        ]);
        
        // Process the raw data
        
        // 1. Create mapping of date to hours
        const hoursMap: { [key: string]: number } = {};
        weeklyHoursResponse.observations.forEach((item: any) => {
            if (item.value !== '.') {  // FRED uses '.' for missing values
                hoursMap[item.date] = parseFloat(item.value);
            }
        });
        
        // 2. Calculate weekly mean earnings (hourly rate × hours)
        const meanWeeklyMap: { [key: string]: number } = {};
        meanHourlyResponse.observations.forEach((item: any) => {
            if (item.value !== '.' && hoursMap[item.date]) {
                const hourlyRate = parseFloat(item.value);
                const hours = hoursMap[item.date];
                const weeklyPay = hourlyRate * hours;
                
                // Extract year for grouping
                const year = item.date.split('-')[0];
                
                // We'll use the latest value for each year
                meanWeeklyMap[year] = weeklyPay;
            }
        });
        
        // 3. Process median weekly data
        const medianWeeklyMap: { [key: string]: number } = {};
        medianWeeklyResponse.observations.forEach((item: any) => {
            if (item.value !== '.') {
                // Extract year for grouping
                const year = item.date.split('-')[0];
                
                // We'll use the latest value for each year
                medianWeeklyMap[year] = parseFloat(item.value);
            }
        });
        
        // 4. Combine the data into a single array
        const combinedData: any[] = [];
        
        // Get all years that have both mean and median data
        const allYears = [...new Set([
            ...Object.keys(meanWeeklyMap),
            ...Object.keys(medianWeeklyMap)
        ])].sort();
        
        allYears.forEach(year => {
            // Only include years that have both mean and median data
            if (meanWeeklyMap[year] && medianWeeklyMap[year]) {
                const meanWeekly = meanWeeklyMap[year];
                const medianWeekly = medianWeeklyMap[year];
                const weeklyGap = meanWeekly - medianWeekly;
                const weeklyGapPercent = (weeklyGap / medianWeekly) * 100;
                
                combinedData.push({
                    year: parseInt(year),
                    meanWeekly: parseFloat(meanWeekly.toFixed(2)),
                    medianWeekly: parseFloat(medianWeekly.toFixed(2)),
                    weeklyGap: parseFloat(weeklyGap.toFixed(2)),
                    weeklyGapPercent: parseFloat(weeklyGapPercent.toFixed(1)),
                    meanAnnual: parseFloat((meanWeekly * 52).toFixed(2)),
                    medianAnnual: parseFloat((medianWeekly * 52).toFixed(2)),
                    annualGap: parseFloat((weeklyGap * 52).toFixed(2)),
                    annualGapPercent: parseFloat(weeklyGapPercent.toFixed(1))
                });
            }
        });
        
        // 5. Format the response based on the requested format
        let responseData;
        
        switch (format) {
            case 'weekly':
                responseData = combinedData.map(item => ({
                    year: item.year,
                    mean: item.meanWeekly,
                    median: item.medianWeekly,
                    gap: item.weeklyGap,
                    gapPercent: item.weeklyGapPercent
                }));
                break;
            case 'annual':
                responseData = combinedData.map(item => ({
                    year: item.year,
                    mean: item.meanAnnual,
                    median: item.medianAnnual,
                    gap: item.annualGap,
                    gapPercent: item.annualGapPercent
                }));
                break;
            case 'combined':
            default:
                responseData = combinedData;
        }
        
        // 6. Include metadata for reference
        const response = {
            metadata: {
                series: {
                    meanHourly: SERIES.MEAN_HOURLY,
                    weeklyHours: SERIES.WEEKLY_HOURS,
                    medianWeekly: SERIES.MEDIAN_WEEKLY
                },
                description: "Comparison of mean and median earnings in the US",
                format,
                startDate,
                generatedAt: new Date().toISOString()
            },
            data: responseData
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(response)
        };
    } catch (err: any) {
        console.error("Error fetching FRED data:", err);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: 'Failed to fetch earnings data from FRED',
                message: err.message
            })
        };
    }
};