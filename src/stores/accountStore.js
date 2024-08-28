import {defineStore} from 'pinia';
import accountAPI from '@/http/accountAPI.js';


export const useAccountStore = defineStore('accountStore', {
        state: () => ({
            accounts: []  // 普通数据存储
        }),
        actions: {
            async fetchAccounts() {
                if (this.accounts.length === 0) {
                    // 如果 accounts 尚未加载，则调用 fresh() 方法刷新数据
                    await this.fresh();
                }
            },
            async fresh() {
                try {
                    // 从后端重新获取所有 accounts
                  this.accounts = await accountAPI.getAllAccounts();
                } catch (error) {
                    console.error('Failed to refresh accounts:', error);
                }
            },
            buildTree(data) {
                let map = {};
                data.forEach(item => {
                    map[item.id] = {...item, children: []};
                });

                let tree = [];
                data.forEach(item => {
                    if (item.parentId === null || item.parentId === '') {
                        tree.push(map[item.id]);
                    } else {
                        if (map[item.parentId]) {
                            map[item.parentId].children.push(map[item.id]);
                        }
                    }
                });

                return tree;
            },

            deleteAccount(id) {
             this.accounts = this.accounts.filter(acc => acc.id !== id);
            }
        },
        getters: {
            accountsTree(state) {
                return this.buildTree(state.accounts);
            },


            //只有叶子节点，供selector使用
            getLeafAccountsWithFullName(state) {
                const result = [];
                const accountMap = new Map();

                // Step 1: Map all accounts by their ID
                state.accounts.forEach(account => {
                    accountMap.set(account.id, account);
                });

                // Step 2: Build the full name for each leaf account
                function buildFullName(account) {
                    let fullName = ``;
                    let currentAccount = account;
                    const nameParts = [];

                    while (currentAccount) {
                        nameParts.unshift(currentAccount.name); // Add the current account's name at the start of the array
                        if (currentAccount.parentId) {
                            currentAccount = accountMap.get(currentAccount.parentId);
                        } else {
                            currentAccount = null;
                        }
                    }

                     fullName = `${account.code} ${nameParts.join(' - ')}`;
                    return fullName;
                }

                // Step 3: Identify leaf accounts and build their full names
                state.accounts.forEach(account => {
                    // Check if no other account has this account's id as its parentId
                    const isLeaf = !state.accounts.some(acc => acc.parentId === account.id);

                    if (isLeaf) {
                        // It's a leaf node, build its full name and add it to the result array
                        const fullName = buildFullName(account);
                        result.push({
                            ...account,
                            fullName
                        });
                    }
                });

                return result;
            }

        }
    }
);
