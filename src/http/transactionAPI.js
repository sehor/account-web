// src/transactionAPI.js
import http from './http.js';

const transactionAPI = {
  // 获取某个账户在指定时间段内的交易记录
  getTransactionsByAccountAndPeriod(accountId, startDate, endDate, page = 0, size = 10) {
    return http.get(`transactions/period/${accountId}`, {
      params: {
        startDate,
        endDate,
        page,
        size,
      },
    });
  },

  // 其他与交易相关的API方法可以在此添加
  // e.g., 获取单个交易详情
  getTransactionById(transactionId) {
    return http.get(`/transactions/${transactionId}`);
  },

  // 创建新交易记录
  createTransaction(transactionData) {
    return http.post('/transactions/create', transactionData);
  },

  // 更新交易记录
  updateTransaction(transactionData) {
    return http.put(`/transactions/update`, transactionData);
  },

  // 删除交易记录
  deleteTransaction(transactionId) {
    return http.delete(`/transactions/delete/${transactionId}`);
  },
};

export default transactionAPI;
