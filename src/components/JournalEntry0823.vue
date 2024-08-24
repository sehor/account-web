<template>
  <div>
    <div class="container">
      <div class="left-panel no-print" @mouseenter="showPanel" @mouseleave="hidePanel" :style="{ left: panelLeft }">
        <div class="panel-toggle">{{ panelToggleText }}</div>
        <h2>已保存凭证</h2>
        <ul class="entries-list">
          <li v-for="entry in savedEntries" :key="entry.id" @click="loadEntry(entry)">
            <div class="entry-date">{{ entry.voucherDate }}</div>
            <div class="entry-description">{{ entry.voucherType }}{{ entry.voucherNumber }} {{ entry.entries[0].summary }}
            </div>
            <div class="entry-amount">合计：￥{{ entry.totalAmount.toFixed(2) }}</div>
          </li>
        </ul>
      </div>

      <div class="right-panel">
        <div class="voucher-container">
          <div class="title-container">
            <h1 class="main-title">记账凭证</h1>
            <span class="sub-title">2024年第12期</span>
          </div>

          <div class="header">
            <div class="header-left">
              <div class="header-item">
                凭证字
                <select v-model="journalEntryView.journalEntry.voucherWord">
                  <option value="记">记</option>
                  <!-- Add more options as needed -->
                </select>
              </div>
              <div class="header-item">
                <input type="text" v-model="journalEntryView.journalEntry.voucherNumber" style="width: 50px;">
                号
              </div>
            </div>
            <div class="header-right">
              <div class="header-item">
                日期
                <input type="text" v-model="journalEntryView.journalEntry.modifiedDate">
              </div>
              <div class="header-item">
                附单据
                <input type="text" v-model="journalEntryView.journalEntry.attachmentIds.length" style="width: 50px;">
                张
              </div>
            </div>
          </div>

          <table>
            <colgroup>
              <col class="col-summary">
              <col class="col-account">
              <col class="col-debit">
              <col class="col-credit">
              <col class="col-action no-print">
            </colgroup>
            <tr>
              <th>摘要</th>
              <th>会计科目</th>
              <th>借方金额</th>
              <th>贷方金额</th>
              <th class="no-print">操作</th>
            </tr>
            <tr v-for="(transaction, index) in journalEntryView.transactions" :key="index">
              <td :class="{ 'green-bg': index === 0 }" @click="editCell($event, transaction, 'summary')">
                <span>{{ transaction.description }}</span>
                <input type="text" v-model="transaction.description" class="editable"
                  @blur="hideInput($event, transaction, 'summary')"
                  @keydown="handleKeydown($event, transaction, 'summary')" />
              </td>

              <td class="account" :data-index="index">
                <!-- <SearchableSelect class="searchable-select" v-model="transaction.account"
                  :options="flattenAccountDataForSelector" @input="updateAccount($event, index)"
                  @keydown="handleKeydown($event, transaction, 'account')" /> -->

                <el-autocomplete v-model="transaction.account.fullName" :fetch-suggestions="querySearch" placeholder="选择会计科目"
                  @select="(selectedAccount) => updateAccount(selectedAccount, transaction)" />
              </td>

              <td class="right-align bold-text number-cell" :data-index="index" data-field="debit"
                @click="editCell($event, transaction, 'debit')">
                <span>{{ formatNumber(transaction.debit) }}</span>
                <input type="text" v-model="transaction.debit" class="editable"
                  @blur="hideInput($event, transaction, 'debit')"
                  @keydown="handleKeydown($event, transaction, 'debit')" />
              </td>
              <td class="right-align bold-text number-cell" :data-index="index" data-field="credit"
                @click="editCell($event, transaction, 'credit')"><span>{{ formatNumber(transaction.credit) }}</span>
                <input type="text" v-model="transaction.credit" class="editable"
                  @blur="hideInput($event, transaction, 'credit')"
                  @keydown="handleKeydown($event, transaction, 'credit')" />
              </td>
              <td class="action-cell no-print">
                <span class="action-icon add" @click="addRow(index)">+</span>
                <span class="action-icon delete" @click="deleteRow(index)">-</span>
              </td>
            </tr>
            <tr class="non-editable">
              <td colspan="2">合计：{{ totalAmountInWords }}</td>
              <td class="right-align bold-text number-cell">{{ formatNumber(totalDebit) }}</td>
              <td class="right-align bold-text number-cell">{{ formatNumber(totalCredit) }}</td>
              <td class="no-print"></td>
            </tr>
          </table>

          <div class="footer">
            <div class="preparer">
              制单人：<span>{{ journalEntryView.journalEntry.bookkeeper }}</span>
            </div>
            <div class="buttons">
              <button class="btn btn-save no-print" @click="saveVoucher">保存</button>
              <button class="btn btn-new no-print" @click="showNewVoucherConfirmation">新增</button>
              <button class="btn btn-print no-print" @click="printVoucher">打印</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal" v-if="showConfirmModal">
      <div class="modal-content">
        <p>是否保存当前凭证？</p>
        <div class="modal-buttons">
          <button class="modal-btn modal-btn-save" @click="saveAndCreateNew">保存</button>
          <button class="modal-btn modal-btn-discard" @click="discardAndCreateNew">不保存</button>
          <button class="modal-btn modal-btn-cancel" @click="cancelNewVoucher">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import SearchableSelect from './SearchableSelect.vue'
import { JournalEntryModels, Transaction, JournalEntryView } from '@/models/journalEntryModels.js'
import { journalEntryService } from '@/services/journalEntryService';
import { ElMessage } from 'element-plus'
import { useAccountStore } from '@/stores/accountStores';
export default {
  components: {
    SearchableSelect
  },

  data: () => ({
    panelLeft: '-270px',
    panelToggleText: '展开',
    savedEntries: [],
    voucherType: '记',
    voucherNumber: '50',
    voucherDate: '2022-12-31',
    attachments: '0',
    entries: [
      { summary: '收款', account: '1002001 银行存款_基本户（平安银行）', debit: 10000.0, credit: 0.0 },
      { summary: '收款', account: '1122001 应收账款_国电南瑞科技股份有限公司', debit: 0.0, credit: 10000.0 }
    ],
    preparer: 'Tom',
    showConfirmModal: false,
    accountData: [
      {
        id: '1',
        name: '资产',
        children: [
          {
            id: '1001',
            name: '流动资产',
            children: [
              { id: '1001001', name: '库存现金' },
              { id: '1001002', name: '银行存款' },
              { id: '1001003', name: '应收账款' },
              { id: '1001004', name: '预付账款' },
              { id: '1001005', name: '应收票据' },
              { id: '1001006', name: '应收股利' },
              { id: '1001007', name: '应收利息' },
              { id: '1001008', name: '其他应收款' }
            ]
          },
          {
            id: '1002',
            name: '非流动资产',
            children: [
              { id: '1002001', name: '固定资产' },
              { id: '1002002', name: '无形资产' },
              { id: '1002003', name: '在建工程' },
              { id: '1002004', name: '长期股权投资' },
              { id: '1002005', name: '长期应收款' },
              { id: '1002006', name: '投资性房地产' },
              { id: '1002007', name: '商誉' }
            ]
          }
        ]
      },
      // ... (其他科目数据)
    ],
    // 初始化 journalEntryView 对象
    journalEntryView: {},
   
  }),
  computed: {
    totalDebit() {
      return this.journalEntryView.transactions.reduce((sum, entry) => sum + parseFloat(entry.debit), 0);
    },
    totalCredit() {
      return this.journalEntryView.transactions.reduce((sum, entry) => sum + parseFloat(entry.credit), 0);
    },
    totalAmountInWords() {
      // 实现金额转大写的逻辑
      return this.numberToChinese(this.totalDebit) + '元整';
    },
    flattenAccountDataForSelector() {
      return this.flattenAccountData(this.accountData, "");
    },
    getLeafAccountsWithFullName() {
      const accountStore = useAccountStore();
      return accountStore.getLeafAccountsWithFullName;
    }
  },
  methods: {
    showPanel() {
      this.panelLeft = '0';
      this.panelToggleText = '隐藏';
    },
    hidePanel() {
      this.panelLeft = '-270px';
      this.panelToggleText = '展开';
    },
    formatNumber(value) {

      if (isNaN(value) || value === null || value === undefined) {
        return '0.00';
      }
      const number = parseFloat(value);
      // 如果是有效数字，格式化为保留两位小数并添加千位分隔符
      return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    },
    editCell(event, entry, field) {
      const cell = event.currentTarget;
      const span = cell.querySelector('span');
      const input = cell.querySelector('input');
      if (span) {
        span.style.display = 'none';

      }
      if (input) {
        input.style.display = 'block';
        input.focus();
      }

      if (field === 'account') {
        const searchableSelectInput = cell.querySelector('.searchable-select input');
        if (searchableSelectInput) {
          searchableSelectInput.focus();
          searchableSelectInput.click();
        }
        return;
      }
    },

    hideInput(event, entry, field) {
      const input = event.target;
      const cell = input.closest('td');
      const span = cell.querySelector('span');
      if (input) {
        input.style.display = 'none';
      }
      if (span) {
        span.style.display = 'inline';
      }
      // 检查借方和贷方的值
      if (field === 'debit' && parseFloat(entry.debit) !== 0) {
        entry.credit = 0.0;
      } else if (field === 'credit' && parseFloat(entry.credit) !== 0) {
        entry.debit = 0.0;
      }
    },

    addRow(index) {
      this.journalEntryView.transactions.splice(index + 1, 0, new Transaction());
    },
    deleteRow(index) {
      if (this.entries.length > 1) {
        this.journalEntryView.transactions.splice(index, 1);
      } else {
        alert('Cannot delete the last row.');
      }
    },
    async saveVoucher() {
      // 1. 验证交易记录
      for (const transaction of this.journalEntryView.transactions) {
        if (!journalEntryService.isEmptyTransaction(transaction)) {
          if (!transaction.account) {
            ElMessage.error('所有交易必须包含会计科目。');
            return;
          }

          const debit = parseFloat(transaction.debit) || 0;
          const credit = parseFloat(transaction.credit) || 0;

          if (debit === 0 && credit === 0) {
            ElMessage.error('每条交易的借方或贷方必须有一方不为零。');
            return;
          }
        }
      }

      // 2. 使用 service.js 保存到后端
      await journalEntryService.saveJournalEntryView(this.journalEntryView);
      ElMessage.success('凭证已成功保存。');
    },
    loadEntry(entry) {
      //todo
    },
    showNewVoucherConfirmation() {
      this.showConfirmModal = true;
    },
    saveAndCreateNew() {
      this.saveVoucher();
      this.createNewVoucher();
      this.showConfirmModal = false;
    },
    discardAndCreateNew() {
      this.createNewVoucher();
      this.showConfirmModal = false;
    },
    cancelNewVoucher() {
      this.showConfirmModal = false;
    },
    createNewVoucher() {
      this.journalEntryView = new JournalEntryView();
    },
    printVoucher() {
      window.print();
    },
    numberToChinese(num) {
      const chineseNum = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
      const chineseUnit = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿', '拾', '佰', '仟'];
      let result = '';
      num = Math.floor(num);
      const numStr = num.toString();
      for (let i = 0; i < numStr.length; i++) {
        const digit = parseInt(numStr[i]);
        const unit = chineseUnit[numStr.length - 1 - i];
        if (digit !== 0) {
          result += chineseNum[digit] + unit;
        } else {
          if (result.charAt(result.length - 1) !== '零') {
            result += '零';
          }
        }
      }
      return result.replace(/零+$/, '');
    },
    createAutocomplete(input, items) {
      // 实现自动完成功能的逻辑
    },
    flatAccountData() {
      // 实现科目数据扁平化的逻辑
      return [];
    },

    querySearch(queryString, cb) {
    const results = queryString
      ? this.getLeafAccountsWithFullName
          .filter(account => account.fullName.toLowerCase().includes(queryString.toLowerCase()))
          .map(account => ({
            value: account.fullName, // 保持 el-autocomplete 的正常工作
            ...account // 保持整个 account 对象，以便后续使用
          }))
      : this.getLeafAccountsWithFullName.map(account => ({
          value: account.fullName,
          ...account
      }));

    cb(results); // 返回包含 value 和其他属性的对象数组
  },

  // 处理选中事件，将选中的 account 对象传递给 transaction
  updateAccount(selectedAccount, transaction) {
    // 直接将选中的 account 对象赋值给当前 transaction
   // console.log({transaction})
    transaction.account = selectedAccount; // 将整个 account 对象传递给 transaction
    transaction.accountId=selectedAccount.accountId;
    //console.log({selectedAccount})
    
  },

    // updateAccount(selectedAccount) {
    //   this.entries[index].account = value;
    //   this.$nextTick(() => {
    //     // 找到后面的debit元素

    //     const debitDom = document.querySelector(`td[data-index="${index}"][data-field="debit"]`);
    //     const input1 = debitDom.getElementsByTagName('input')[0];
    //     debitDom.click();

    //   });
      
    // },

    flattenAccountData(data, prefix = '') {
      return data.reduce((acc, item) => {
        const fullName = prefix ? `${prefix} - ${item.name}` : item.name;
        acc.push({ id: item.id, name: fullName });
        if (item.children) {
          acc.push(...this.flattenAccountData(item.children, fullName));
        }
        return acc;
      }, []);
    },
    findNextEditableCell(currentCell) {
      let nextCell = currentCell.nextElementSibling;
      let currentRow = currentCell.parentElement;

      while (currentRow) {
        while (nextCell) {
          if (!nextCell.classList.contains('action-cell') && !nextCell.closest('tr').classList.contains('non-editable')) {
            if (nextCell.classList.contains('account')) {
              const inerInput = nextCell.querySelector('.searchable-select input');
              inerInput.focus();
              inerInput.click();//这个点击事件不能传递到searchable-select -> input
            }
            return nextCell;
          }
          nextCell = nextCell.nextElementSibling;
        }
        currentRow = currentRow.nextElementSibling;
        if (currentRow && !currentRow.classList.contains('non-editable')) {
          nextCell = currentRow.cells[0];
        } else {
          return null;
        }
      }
      return null;
    },
    handleKeydown(event, entry, field) {
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const cell = event.target.closest('td');
        this.handleNextEditable(cell, entry, field);
      }
    },
    handleNextEditable(currentCell, event, field) {
      const nextCell = this.findNextEditableCell(currentCell);
      if (nextCell) {
        nextCell.click();
      } else {
        this.addRow(this.entries.length - 1);
        this.$nextTick(() => {
          const firstCellNewRow = currentCell.closest('tr').nextElementSibling.cells[0];
          firstCellNewRow.click();
        });
      }
    },
  },
  mounted() {
  },
  created() {
    const accountStore = useAccountStore();  // 获取 store 实例
    accountStore.fetchAccounts();  // 调用实例方法 fetchAccounts
    
    this.journalEntryView = new JournalEntryView(); // 初始化 journalEntryView
  }


}

</script>
  
  
<style scoped>
body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  font-family: Arial, sans-serif;
  padding: 20px;
  background-color: #f0f0f0;
}

.container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  height: 100%;
  max-height: 800px;
  gap: 20px;
  position: relative;
}

.left-panel {
  width: 300px;
  flex-shrink: 0;
  overflow-y: auto;
  position: fixed;
  left: -270px;
  top: 0;
  bottom: 0;
  background-color: #ffffff;
  transition: left 0.3s ease-in-out;
  padding: 20px;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.left-panel:hover {
  left: 0;
}

.panel-toggle {
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 5px 5px 0 0;
  transition: background-color 0.3s;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1001;
}

.panel-toggle:hover {
  background-color: #45a049;
}

.entries-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.entries-list li {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
  border-radius: 5px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
}

.entries-list li:last-child {
  border-bottom: none;
}

.entries-list li:hover {
  background-color: #e8e8e8;
  transform: translateX(5px);
}

.entry-date {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.entry-description {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.entry-amount {
  color: #4CAF50;
  font-weight: bold;
}

.right-panel {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
}

.voucher-container {
  width: 800px;
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.main-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.sub-title {
  font-size: 16px;
  color: #666;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-item {
  margin-right: 20px;
}

select,
input[type="text"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  font-size: 14px;
  border: 1px solid #444;
  table-layout: fixed;
  margin-bottom: 20px;
  border-radius: 5px;
  overflow: visible;

}

table tr {
  height: 60px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 1px;
  text-align: left;
  overflow: visible;
  text-overflow: ellipsis;
  white-space: nowrap;

}

td {
  height: 58px;
  position: relative;
}

th {
  background-color: #f8f8f8;
  border-top: 1px solid #444;
  font-weight: bold;
  color: #333;
}

tr:last-child td {
  border-bottom: 1px solid #444;
}

td:first-child,
th:first-child {
  border-left: 1px solid #444;
}

td:last-child,
th:last-child {
  border-right: 1px solid #444;
}

.green-bg {
  background-color: #e8f5e9;
}

.right-align {
  text-align: right;
}

.bold-text {
  font-weight: bold;
}

.number-cell {
  font-family: 'Courier New', monospace;
  letter-spacing: 0.1em;
}

td:hover {
  background-color: #e6f7ff;
  cursor: pointer;
}

.editable {
  width: 100%;
  height: 100%;
  background-color: #a86a19;
  color: yellow;
  outline: none;
  box-sizing: border-box;
  display: none;
}

.non-editable {

  background-color: #f0f0f0;
  cursor: not-allowed;
}

.action-cell {
  white-space: nowrap;
  text-align: center;
}

.action-icon {
  cursor: pointer;
  margin: 0 5px;
  font-size: 14px;
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 50%;
  transition: background-color 0.3s, transform 0.2s;
}

.action-icon:hover {
  opacity: 0.7;
  transform: scale(1.1);
}

.action-icon.add {
  color: #4CAF50;
  border: 1px solid #4CAF50;
}

.action-icon.add:hover {
  background-color: #e8f5e9;
}

.action-icon.delete {
  color: #f44336;
  border: 1px solid #f44336;
}

.action-icon.delete:hover {
  background-color: #ffebee;
}

.col-summary {
  width: 15%;
}

.col-account {
  width: 50%;
}

.col-debit,
.col-credit {
  width: 20%;
}

.col-action {
  width: 15%;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.preparer {
  font-size: 14px;
  color: #666;
}

.buttons {
  display: flex;
  gap: 15px;
}

.btn {
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  transition: background-color 0.3s, transform 0.2s;
  text-transform: uppercase;
  font-weight: bold;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-save {
  background-color: #4CAF50;
  color: white;
}

.btn-save:hover {
  background-color: #45a049;
}

.btn-new {
  background-color: #2196F3;
  color: white;
}

.btn-new:hover {
  background-color: #1e87db;
}

.btn-print {
  background-color: #ff9800;
  color: white;
}

.btn-print:hover {
  background-color: #e68a00;
}

.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.autocomplete-input {
  width: 100%;
  box-sizing: border-box;
}

.autocomplete-results {
  position: fixed;
  background-color: white;
  border: 1px solid #ddd;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  width: auto;
  min-width: 200px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.autocomplete-item {
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.autocomplete-item:hover {
  background-color: #f0f0f0;
}

.modal {
  position: fixed;
  z-index: 1050;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 300px;
  border-radius: 5px;
  text-align: center;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.modal-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.modal-btn-save {
  background-color: #4CAF50;
  color: white;
}

.modal-btn-discard {
  background-color: #f44336;
  color: white;
}

.modal-btn-cancel {
  background-color: #ccc;
  color: black;
}

.account {
  background-color: #1e87db;
}

.searchable-select {
  background-color: #1e87db;
}

.searchable-select input {
  background-color: #1e87db;
}

@media print {
  .no-print {
    display: none !important;
  }

  .container {
    display: block;
  }

  .right-panel {
    display: block;
    width: 100%;
  }

  .voucher-container {
    width: 100%;
    box-shadow: none;
  }

  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>