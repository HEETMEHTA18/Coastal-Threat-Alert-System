import axios from "axios";
import { ENDPOINTS } from "../config/apiConfig.js";

const API_URL = "/predict_alert"; // Use relative URL for Vite proxy in development
const BACKEND_DIRECT = ENDPOINTS.PREDICT_ALERT; // Production-ready endpoint

/**
 * Calls the unified alert prediction API with the given data.
 * @param {Object} data - The input features for prediction.
 * @param {number} data.latitude
 * @param {number} data.longitude
 * @param {string} [data.timestamp]
 * @returns {Promise<Object>} - The unified prediction/alert result
 */
export async function getAlertPrediction(data) {
  try {
    try {
      const response = await axios.post(API_URL, data);
      // mark that the proxied API succeeded
      return { ...response.data, _source: 'proxy' };
    } catch (err) {
      // If proxied request failed with 404 or no response, retry direct to backend
      const shouldRetry = !err.response || err.response.status === 404 || err.response.status === 405;
      if (shouldRetry) {
        try {
          const response2 = await axios.post(BACKEND_DIRECT, data);
          // mark that we fell back to direct backend
          return { ...response2.data, _source: 'direct' };
        } catch (err2) {
          // fall through to outer catch
          throw err2;
        }
      }
      throw err;
    }
  } catch (error) {
    // Provide richer error information for the frontend to display
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      let body = null;
      try {
        body = error.response.data;
      } catch (e) {
        body = error.response.text || null;
      }
      const msg = `Prediction API error: ${status} ${statusText}` + (body ? ` - ${JSON.stringify(body)}` : '');
      const err = new Error(msg);
      err.status = status;
      err.body = body;
      throw err;
    } else if (error.request) {
      const err = new Error('No response from prediction API. Is the backend running?');
      err.request = true;
      throw err;
    } else {
      throw new Error('Prediction API call failed: ' + error.message);
    }
  }
}