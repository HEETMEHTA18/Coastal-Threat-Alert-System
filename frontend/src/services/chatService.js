import nodeAxios from './nodeAxiosInstance';

// Simple chat API wrapper using Node.js backend.
export async function sendChatMessage({ text, mode = 'standard', context = {} }) {
  try {
    const response = await nodeAxios.post('/ai/chat', { message: text, mode, context });
    return response.data;
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}



