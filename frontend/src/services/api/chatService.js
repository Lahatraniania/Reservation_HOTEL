import apiClient from './apiClient';

export const chatService = {
    // Envoyer un message à l'agent IA
    sendMessage: async (content) => {
        const response = await apiClient.post('/chat/send_message/', { content });
        return response.data;
    },

    // Récupérer l'historique
    getHistory: async () => {
        const response = await apiClient.get('/chat/history/');
        return response.data;
    },

    // Effacer l'historique
    clearHistory: async () => {
        const response = await apiClient.post('/chat/clear_history/');
        return response.data;
    },
};