// service.js

import {JournalEntryModels, JournalEntryView, Transaction} from '@/models/journalEntryModels.js';
import {journalEntryApi} from '@/http/journalEntryAPI';
import {useAccountStore} from '@/stores/accountStore';
import {ElMessage} from 'element-plus';
import accountService from '@/services/accountService'

class JournalEntryService {
    //判断是否是空的交易
    isEmptyTransaction(transaction) {
        const hasNoAccount = !transaction.account || transaction.account.fullName.trim() === '';
        const debitIsZero = parseFloat(transaction.debit) === 0 || isNaN(parseFloat(transaction.debit));
        const creditIsZero = parseFloat(transaction.credit) === 0 || isNaN(parseFloat(transaction.credit));

        return hasNoAccount && debitIsZero && creditIsZero;
    }

    // 创建 JournalEntryView 对象并发送到后端
    async saveJournalEntryView(journalEntryView) {
        const transactions_filter = journalEntryView.transactions.filter(t => {
            return !this.isEmptyTransaction(t)
        })

        //是否是空的分录
        if (transactions_filter.length < 2) {
            ElMessage.error("分录必须包含2条或以上交易记录")
        }
        const journalEntryView_toBackend = this.mapToJournalEntryView(journalEntryView.journalEntry, transactions_filter);
// Await the save operation and return the mapped response
        const response = await journalEntryApi.save(journalEntryView_toBackend);
        return await this.mapFromBackend(response);
    }


    // 获取 JournalEntryView 对象
    async getJournalEntryView(id) {
        const response = await journalEntryApi.getJournalEntryView(id);
        return this.mapFromBackend(response);
    }

    // 更新 JournalEntryView 对象
    async updateJournalEntryView(journalEntryData, transactionsData) {
        const journalEntryView = this.mapToJournalEntryView(journalEntryData, transactionsData);
        const response = await journalEntryApi.updateJournalEntryView(journalEntryView);
        return this.mapFromBackend(response);
    }

    // 删除 JournalEntryView 对象
    async deleteJournalEntryView(id) {
        const response = await journalEntryApi.deleteJournalEntryView(id);
        return response;
    }

    // 将前端数据映射为 JournalEntryView 对象
    mapToJournalEntryView(journalEntryData, transactionsData) {
        // 使用 Object.assign 拷贝对象
        const journalEntry = Object.assign({}, journalEntryData);

        console.log({transactionsData})
        // 遍历 transactionsData，设置 balanceDirection
        const transactions = transactionsData.map(transaction => {
            const transactionCopy = Object.assign({}, transaction);

            // 设置 balanceDirection 根据 debit 的值
            if (transactionCopy.debit !== 0) {
                transactionCopy.balanceDirection = "DEBIT";
                transactionCopy.amount = transactionCopy.debit;
            } else {
                transactionCopy.balanceDirection = "CREDIT";
                transactionCopy.amount = transactionCopy.credit;
            }
            //set accountId
            transactionCopy.accountId = transactionCopy.account.id;
            transactionCopy.vounrchWord=journalEntry.vounrchWord;

            return transactionCopy;
        });

        return new JournalEntryView(journalEntry, transactions);
    }


    // 将后端传来的数据映射为 JournalEntryView 对象
    async mapFromBackend(data) {
        const journalEntry = new JournalEntryModels();
        Object.assign(journalEntry, data.journalEntry);

        // Get the Pinia store instance and the accounts with full names
        const accountStore = useAccountStore();
        const leafAccounts = accountStore.getLeafAccountsWithFullName;

        // Map the transactions and set the full name for the account
        const transactions = data.transactions.map(transactionData => {
            const transaction = new Transaction();
            Object.assign(transaction, transactionData);

            // Find the account using the account ID and set the full name
            const account = leafAccounts.find(acc => acc.id === transactionData.accountId);

            if (account) {
                transaction.account = account; // Assign the full account object
                transaction.account.fullName = account.fullName; // Ensure the fullName is set
            } else {
                // If the account is not found, you can handle it appropriately
                console.warn(`Account with ID ${transactionData.accountId} not found.`);
                transaction.account = { id: transactionData.accountId, fullName: 'Unknown Account' };
            }

            // Set debit or credit
            if (transaction.balanceDirection.toLowerCase() === 'debit') {
                transaction.debit = transaction.amount;
            } else {
                transaction.credit = transaction.amount;
            }

            return transaction;
        });

        // Fill in the remaining slots with empty transactions
        for (let i = 5 - transactions.length; i > 0; i--) {
            transactions.push(new Transaction());
        }

        return new JournalEntryView(journalEntry, transactions);
    }

}

export const journalEntryService = new JournalEntryService();
