import api from './apiService';

// Simple chat API wrapper. For streaming, migrate to EventSource/ReadableStream later.
export async function sendChatMessage({ text, mode = 'standard', context = {} }) {
  try {
    const result = await api.fetchAPI('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: text, mode, context })
    });
    return result;
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}


