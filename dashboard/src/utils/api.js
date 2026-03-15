import axios from 'axios';

// Configure axios for SaaS usage
axios.defaults.withCredentials = true;
axios.defaults.timeout = 10000;

// Request Logger for Debugging
axios.interceptors.request.use(config => {
    // Silence verbose auth check logs
    if (!config.url.includes('/api/auth/me')) {
        console.log(`[HTTP Request] ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    }
    return config;
});

axios.interceptors.response.use(
    response => {
        // Silencing verbose logs for successful data fetches
        if (!response.config.url.includes('/api/auth/me')) {
            console.log(`[HTTP Response] ${response.status} ${response.config.url}`, response.data);
        }
        return response;
    },
    error => {
        const isMe401 = error.response?.status === 401 && error.config?.url.includes('/api/auth/me');
        if (!isMe401) {
            console.error(`[HTTP Error] ${error.response?.status || 'Network Error'} ${error.config?.url}`, error.response?.data || error.message);
        }
        return Promise.reject(error);
    }
);

export default axios;
