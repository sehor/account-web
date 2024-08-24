// api.js

import http from './http.js';

const journalEntryPath = '/journalEntries/';

class JournalEntryApi {
    
    // 发送创建 JournalEntryView 的请求
     save(journalEntryView) {
        return http.post(`${journalEntryPath}process`, journalEntryView);
    }

    // 发送读取 JournalEntryView 的请求
    getJournalEntryView(id) {
        return http.get(`${journalEntryPath}${id}`);
    }

    // 发送更新 JournalEntryView 的请求
    updateJournalEntryView(journalEntryView) {
        return http.put(`${journalEntryPath}update`, journalEntryView);
    }

    // 发送删除 JournalEntryView 的请求
    deleteJournalEntryView(id) {
        return http.delete(`${journalEntryPath}delete/${id}`);
    }

    // 其他与后端交互的方法（如果需要）
}

export const journalEntryApi = new JournalEntryApi();
