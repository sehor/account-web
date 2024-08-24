import axios from 'axios';
import { ElMessage } from 'element-plus'; // 引入 Element Plus 的 Message 组件

// 创建一个 axios 实例
const http = axios.create({
  baseURL: 'http://localhost:8081', // 设置基础URL，这里需要替换为你的API地址
  timeout: 10000, // 设置请求超时时间
  headers: {
    'Content-Type': 'application/json',
    // 其他自定义头
  }
});

// 添加请求拦截器
http.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么，比如添加token
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 添加响应拦截器
//从后端来的repose格式：
 //response {
 //   
 //}
http.interceptors.response.use(
  response => {

   // console.log({response})
        //有时候有2层data
        const realData=response.data.data || response.data
    if (response.data && response.status === 200) {
      //console.log({realData})
      const successMessage = realData.message || '操作成功';
      ElMessage.success({
        message: successMessage,
        duration: 3000
      });
    }

    return realData;
  },
  error => {
    // 对响应错误做全局处理
    let message = '';

    if (error.response) {
      // 服务器返回了状态码但状态码在 2xx 之外
      switch (error.response.status) {
        case 400:
          message = '请求错误(400)';
          break;
        case 401:
          message = '未授权，请重新登录(401)';
          break;
        case 403:
          message = '拒绝访问(403)';
          break;
        case 404:
          message = '请求出错(404)';
          break;
        case 500:
          message = '服务器错误(500)';
          break;
        case 502:
          message = '网关错误(502)';
          break;
        case 503:
          message = '服务不可用(503)';
          break;
        case 504:
          message = '网关超时(504)';
          break;
        default:
          message = `连接出错(${error.response.status})!`;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      message = '请求超时或服务器无响应';
    } else {
      // 其他错误
      message = `请求出错: ${error.message}`;
    }

    // 使用 Element Plus 的 Message 显示错误
    ElMessage.error({
      message,
      duration: 5000
    });

    return Promise.reject(error); // 返回一个 rejected promise 以便后续的 catch 处理
  }
);

export default http;
