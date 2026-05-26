import nodeAxios from './nodeAxiosInstance';

export async function submitQuestionnaire(answers) {
  try {
    const response = await nodeAxios.post('/ai/questionnaire/submit', { answers });
    return response.data;
  } catch (error) {
    console.error('Error submitting questionnaire:', error);
    throw error.response?.data || error;
  }
}

export async function getQuestionnaireHistory() {
  try {
    const response = await nodeAxios.get('/ai/questionnaire/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching questionnaire history:', error);
    throw error.response?.data || error;
  }
}
