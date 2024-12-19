import axios from 'axios';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const CENSUS_API_BASE_URL = 'https://api.census.gov/data';
const CENSUS_API_KEY = process.env.CENSUS_API_KEY;

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        const yearArray = ['2019', '2021', '2022'];
        console.log('Starting to fetch data for years:', yearArray);

        const promises = yearArray.map(async (year) => {
            const requestUrl = `${CENSUS_API_BASE_URL}/${year}/acs/acs1?get=NAME,B19013_001E,B19025_001E,B19083_001E&for=state:*&key=${CENSUS_API_KEY}`;

            try {
                const response = await axios.get(requestUrl);
                const [headers, ...dataRows] = response.data;

                // Filter out Puerto Rico and DC
                const stateData = dataRows.filter(row =>
                    !row[0].includes('Puerto Rico') &&
                    !row[0].includes('District of Columbia')
                );

                // Calculate national metrics
                let totalPopulationWeight = 0;
                let weightedGini = 0;
                const medianIncomeIdx = headers.indexOf('B19013_001E');
                const aggregateIncomeIdx = headers.indexOf('B19025_001E');
                const giniIdx = headers.indexOf('B19083_001E');

                // Calculate total aggregate income and weighted Gini
                const totalAggregateIncome = stateData.reduce((sum, row) => {
                    const aggregateIncome = parseFloat(row[aggregateIncomeIdx]);
                    const gini = parseFloat(row[giniIdx]);
                    if (!isNaN(aggregateIncome)) {
                        totalPopulationWeight += aggregateIncome;
                        weightedGini += gini * aggregateIncome;
                    }
                    return sum + (isNaN(aggregateIncome) ? 0 : aggregateIncome);
                }, 0);

                // Calculate national median (using simple average of state medians as approximation)
                const nationalMedian = stateData.reduce((sum, row) => {
                    const median = parseFloat(row[medianIncomeIdx]);
                    return sum + (isNaN(median) ? 0 : median);
                }, 0) / stateData.length;

                // Calculate national Gini coefficient (weighted by aggregate income)
                const nationalGini = weightedGini / totalPopulationWeight;

                const result = {
                    year,
                    medianIncome: Math.round(nationalMedian),
                    aggregateIncome: Math.round(totalAggregateIncome),
                    giniIndex: nationalGini
                };

                console.log(`Processed result for ${year}:`, result);
                return result;

            } catch (error) {
                console.error(`Error fetching data for year ${year}:`, error);
                if (axios.isAxiosError(error)) {
                    console.error('Error details:', {
                        status: error.response?.status,
                        data: error.response?.data,
                        url: error.config?.url
                    });
                }
                return null;
            }
        });

        const results = await Promise.all(promises);
        const filteredResults = results.filter(result => result !== null);
        console.log('Final results:', filteredResults);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(filteredResults),
        };
    } catch (error) {
        console.error('Error fetching Census data:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Failed to fetch Census data',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
        };
    }
};