import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import axios from 'axios'

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const response = await axios.get(`https://api.stlouisfed.org/fred/series/observations`, {
            params: {
                series_id: 'WFRBST01134',
                api_key: process.env.FRED_API_KEY,
                file_type: 'json'
            }
        })

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(response.data)
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data' })
        }
    }
}