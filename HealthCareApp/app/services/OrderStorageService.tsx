import AsyncStorage from '@react-native-async-storage/async-storage';

const ORDERS_STORAGE_KEY = '@TestKitOrders';

export const OrderStorageService = {
  /**
   * Save an order to local storage
   * @param {Object} orderData - The order data to save
   * @returns {Promise<boolean>} - Success status
   */
  saveOrder: async (orderData) => {
    try {
      // Get existing orders
      const existingOrders = await OrderStorageService.getOrders();
      
      // Add new order to the list
      const updatedOrders = [orderData, ...existingOrders];
      
      // Save updated list back to storage
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
      return true;
    } catch (error) {
      console.error('Error saving order to local storage:', error);
      return false;
    }
  },

  /**
   * Get all saved orders from local storage
   * @returns {Promise<Array>} - Array of orders
   */
  getOrders: async () => {
    try {
      const ordersJson = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
      return ordersJson ? JSON.parse(ordersJson) : [];
    } catch (error) {
      console.error('Error getting orders from local storage:', error);
      return [];
    }
  },

  /**
   * Get a specific order by order number
   * @param {string} orderNumber - The order number to find
   * @returns {Promise<Object|null>} - The order or null if not found
   */
  getOrderByNumber: async (orderNumber) => {
    try {
      const orders = await OrderStorageService.getOrders();
      return orders.find(order => order.orderNumber === orderNumber) || null;
    } catch (error) {
      console.error('Error getting order by number from local storage:', error);
      return null;
    }
  },

  /**
   * Update a specific order in local storage
   * @param {string} orderNumber - The order number to update
   * @param {Object} updatedData - The updated order data
   * @returns {Promise<boolean>} - Success status
   */
  updateOrder: async (orderNumber, updatedData) => {
    try {
      const orders = await OrderStorageService.getOrders();
      const updatedOrders = orders.map(order => 
        order.orderNumber === orderNumber ? { ...order, ...updatedData } : order
      );
      
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
      return true;
    } catch (error) {
      console.error('Error updating order in local storage:', error);
      return false;
    }
  },

  /**
   * Delete a specific order from local storage
   * @param {string} orderNumber - The order number to delete
   * @returns {Promise<boolean>} - Success status
   */
  deleteOrder: async (orderNumber) => {
    try {
      const orders = await OrderStorageService.getOrders();
      const updatedOrders = orders.filter(order => order.orderNumber !== orderNumber);
      
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
      return true;
    } catch (error) {
      console.error('Error deleting order from local storage:', error);
      return false;
    }
  },

  /**
   * Clear all orders from local storage
   * @returns {Promise<boolean>} - Success status
   */
  clearOrders: async () => {
    try {
      await AsyncStorage.removeItem(ORDERS_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing orders from local storage:', error);
      return false;
    }
  }
};