import axios from "axios";

// Use relative URL so Vite dev server proxy (configured for '/api') forwards requests to FastAPI
const API_URL = "/forecast";
const BACKEND_DIRECT = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '') + '/forecast';

/**
 * Calls the backend forecast API with latitude and longitude and returns hourly forecast.
 * @param {Object} data - The input features for prediction.
 * @param {number} data.latitude
 * @param {number} data.longitude
 * @returns {Promise<Object[]>} - Array of hourly forecast objects
 */
export async function getWeatherPrediction(data) {
  try {
    try {
      const response = await axios.post(API_URL, data);
      return response.data;
    } catch (err) {
      const shouldRetry = !err.response || err.response.status === 404 || err.response.status === 405;
      if (shouldRetry) {
        try {
          const response2 = await axios.post(BACKEND_DIRECT, data);
          return response2.data;
        } catch (err2) {
          throw err2;
        }
      }
      throw err;
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      const body = error.response.data || null;
      const msg = `Weather Prediction API error: ${status} ${statusText}` + (body ? ` - ${JSON.stringify(body)}` : '');
      const err = new Error(msg);
      err.status = status;
      err.body = body;
      throw err;
    } else if (error.request) {
      const err = new Error('No response from weather prediction API. Is the backend running?');
      err.request = true;
      throw err;
    } else {
      throw new Error('Weather Prediction API call failed: ' + error.message);
    }
  }
}
