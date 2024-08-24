// src/accountAPI.js
import http from './http.js';

const accountAPI = {
  // 获取所有账户
  getAllAccounts() {
    return http.get('/accounts/all');
  },

  // 获取单个账户详情
  getAccountById(id) {
    return http.get(`/accounts/${id}`);
  },

  // 创建新账户
  createAccount(accountData) {
    console.log({accountData})
    return http.post('/accounts/create', accountData);
  },

  // 更新账户信息
  updateAccount(accountData) {
    return http.put(`/accounts/update`, accountData);
  },

  // 删除账户
  deleteAccount(id) {
    return http.delete(`/accounts/delete/${id}`);
  },
  searchAccounts(query) {
    return http.get(`/accounts/${query}`);
  }
};

export default accountAPI;
