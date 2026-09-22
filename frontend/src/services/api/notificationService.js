import apiClient from './apiClient';

export const notificationService = {
  // Récupérer toutes les notifications
  getAll: async () => {
    const response = await apiClient.get('/notifications/');
    return response.data;
  },

  // Marquer une notification comme lue
  markAsRead: async (id) => {
    const response = await apiClient.post(`/notifications/${id}/marquer_lue/`);
    return response.data;
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async () => {
    const notifications = await this.getAll();
    const promises = notifications.map(n => this.markAsRead(n.id));
    await Promise.all(promises);
    return true;
  }
};