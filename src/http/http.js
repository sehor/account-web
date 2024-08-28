import axios from 'axios';
import { ElMessage } from 'element-plus';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器
http.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器
http.interceptors.response.use(
  response => {
    const { data, status } = response;
    const realData = data.data || data;
    
    if (status === 200 && realData.success !== false) {
      const successMessage = realData.message || '操作成功';
      ElMessage.success({ message: successMessage, duration: 3000 });
    }
    
    return realData;
  },
  error => {
    const { response } = error;
    let message = '未知错误';
    console.log({response})

    if (response) {
      const statusMessages = {
        400: '请求错误',
        401: '未授权，请重新登录',
        403: '拒绝访问',
        404: '请求的资源不存在',
        500: '服务器内部错误',
        502: '网关错误',
        503: '服务不可用',
        504: '网关超时',
      };
      message = statusMessages[response.status]||response?.data?.message;
    } else if (error.request) {
      message = '请求超时或服务器无响应';
    } else {
      message = `请求出错: ${error.message}`;
    }

    ElMessage.error({ message, duration: 5000 });
    return Promise.reject(error);
  }
);

export default http;