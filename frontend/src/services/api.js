const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async refreshToken() {
    return this.request('/auth/refresh-token', {
      method: 'POST',
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // User endpoints
  async getUsers() {
    return this.request('/users/');
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async createUser(userData) {
    return this.request('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Transaction endpoints
  async getUserTransactions(userId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/users/${userId}/transactions/${queryParams ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async createTransaction(userId, transactionData) {
    return this.request(`/users/${userId}/transactions/`, {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async updateTransaction(userId, transactionId, transactionData) {
    return this.request(`/users/${userId}/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  }

  async deleteTransaction(userId, transactionId) {
    return this.request(`/users/${userId}/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }

  async getTransactionsByCategory(userId, category) {
    return this.request(`/users/${userId}/transactions/category/${category}`);
  }

  // Budget endpoints
  async getUserBudgets(userId) {
    return this.request(`/users/${userId}/budgets/`);
  }

  async createOrUpdateBudget(userId, budgetData) {
    return this.request(`/users/${userId}/budgets/`, {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  }

  async deleteBudget(userId, budgetId) {
    return this.request(`/users/${userId}/budgets/${budgetId}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getSpendingAnalysis(userId, months = 12) {
    return this.request(`/users/${userId}/spending-analysis/?months=${months}`);
  }

  async getBudgetAlerts(userId) {
    return this.request(`/users/${userId}/budget-alerts/`);
  }

  async getFinancialHealthScore(userId) {
    return this.request(`/users/${userId}/financial-health-score/`);
  }

  // Development endpoints
  async createSampleData() {
    return this.request('/dev/create-sample-data/', {
      method: 'POST',
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;