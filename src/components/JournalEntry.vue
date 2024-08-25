<template>
  <div>
    <div class="container">
      <div class="left-panel no-print" @mouseenter="showPanel" @mouseleave="hidePanel" :style="{ left: panelLeft }">
        <div class="panel-toggle">{{ panelToggleText }}</div>
        <h2>已保存凭证</h2>
        <ul class="entries-list">
          <li v-for="entry in savedEntries" :key="entry.id" @click="loadEntry(entry)">
            <div class="entry-date">{{ entry.voucherDate }}</div>
            <div class="entry-description">{{ entry.voucherType }}{{ entry.voucherNumber }} {{
                entry.entries[0].summary
              }}
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
          {{ journalEntryView.transactions[0] }}
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
            <tbody ref="transactions">
            <tr v-for="(transaction, index) in journalEntryView.transactions" :key="index">
              <td :class="{ 'green-bg': index === 0 }" @click="editCell($event, transaction, 'description',index)">
                <span>{{ transaction.description }}</span>
                <input type="text" v-model="transaction.description" class="editable"
                       @blur="hideInput($event, transaction, 'description')"
                       @keydown="handleKeydown($event, transaction, 'description',index)"/>
              </td>

              <td class="account" :data-index="index" @click="editCell($event, transaction, 'account',index)">
                <el-autocomplete class="custom-autocomplete" v-model="transaction.account.fullName"
                                 :fetch-suggestions="querySearch" placeholder="选择会计科目"
                                 @select="(selectedAccount) => updateAccount(selectedAccount, transaction)"
                                 @keydown="handleKeydown($event, transaction, 'account',index)"
                />
              </td>

              <td class="right-align bold-text number-cell" :data-index="index" data-field="debit"
                  @click="editCell($event, transaction, 'debit',index)">
                <span>{{ formatNumber(transaction.debit) }}</span>
                <input type="text" v-model.number="transaction.debit" class="editable"
                       @blur="hideInput($event, transaction, 'debit')"
                       @keydown="handleKeydown($event, transaction, 'debit',index)"/>
              </td>
              <td class="right-align bold-text number-cell" :data-index="index" data-field="credit"
                  @click="editCell($event, transaction, 'credit',index)"><span>{{
                  formatNumber(transaction.credit)
                }}</span>
                <input type="text" v-model.number="transaction.credit" class="editable"
                       @blur="hideInput($event, transaction, 'credit')"
                       @keydown="handleKeydown($event, transaction, 'credit',index)"/>
              </td>
              <td class="action-cell no-print">
                <span class="action-icon add" @click="addRow(index)">+</span>
                <span class="action-icon delete" @click="deleteRow(index)">-</span>
              </td>
            </tr>
            </tbody>
            <tfoot>
            <tr class="non-editable">
              <td colspan="2">合计：{{ totalAmountInWords }}</td>
              <td class="right-align bold-text number-cell">{{ formatNumber(totalDebit) }}</td>
              <td class="right-align bold-text number-cell">{{ formatNumber(totalCredit) }}</td>
              <td class="no-print"></td>
            </tr>
            </tfoot>
          </table>

          <div class="footer">
            <div class="preparer">
              制单人：<span>{{ journalEntryView.journalEntry.bookkeeper }}</span>
            </div>
            <div class="buttons">
              <button class="btn btn-save no-print" @click="saveJournalEntry">保存</button>
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
import {Transaction, JournalEntryView} from '@/models/journalEntryModels.js'
import {journalEntryService} from '@/services/journalEntryService';
import {ElMessage} from 'element-plus'
import {useAccountStore} from '@/stores/accountStore';
import {formatNumber, numberToChinese} from '@/utils.js'

export default {
  components: {
    SearchableSelect
  },

  data: () => ({
    panelLeft: '-270px',
    panelToggleText: '展开',
    savedEntries: [],
    showConfirmModal: false,
    // 初始化 journalEntryView 对象
    journalEntryView: {},

  }),
  computed: {
    totalDebit() {
      return this.journalEntryView.transactions.reduce((sum, transaction) => sum + parseFloat(transaction.debit), 0);
    },
    totalCredit() {
      return this.journalEntryView.transactions.reduce((sum, transaction) => sum + parseFloat(transaction.credit), 0);
    },
    totalAmountInWords() {
      // 实现金额转大写的逻辑
      return this.numberToChinese(this.totalDebit) + '元整';
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
    editCell(event, transaction, field, index) {
      const cell = event.currentTarget;
      const span = cell.querySelector('span');
      const input = cell.querySelector('input');
      if (span) {
        span.style.display = 'none';
      }
      if (input) {
        input.style.display = 'block';
        input.focus();
        input.select();
      }
      //copy the first transaction description
      if (field === 'description' && index > 0 && transaction?.description === '') {
        transaction.description = this.journalEntryView?.transactions[index - 1]?.description || '';
      }
      if (field === 'account') {
        const searchableSelectInput = cell.querySelector('.searchable-select input');
        if (searchableSelectInput) {
          searchableSelectInput.focus();
          searchableSelectInput.click();
        }
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
    async saveJournalEntry() {
      // 1. 验证交易记录
      for (const transaction of this.journalEntryView.transactions) {
        if (!journalEntryService.isEmptyTransaction(transaction)) {
          if (!transaction.account) {
            ElMessage.error('所有交易必须包含会计科目。');
            return;
          }
          if (transaction.debit === 0 && transaction.credit === 0) {
            ElMessage.error('每条交易的借方或贷方必须有一方不为零。');
            return;
          }
          if (this.totalDebit !== this.totalCredit) {
            ElMessage.error('借贷方不相等');
            return;
          }
        }
      }
      // 2. 使用 service.js 保存到后端
      const response = await journalEntryService.saveJournalEntryView(this.journalEntryView);
      this.journalEntryView = Object.assign({}, response);
      console.log("save and return from backend", response);

    },

    showNewVoucherConfirmation() {
      this.showConfirmModal = true;
    },
    saveAndCreateNew() {
      this.saveJournalEntry();
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
    formatNumber, // Using the imported utility function
    numberToChinese, // Using the imported utility function
    // 处理选中事件，将选中的 account 对象传递给 transaction
    updateAccount(selectedAccount, transaction) {
      transaction.account = selectedAccount; // 将整个 account 对象传递给 transaction
      transaction.accountId = selectedAccount.accountId;
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
    handleKeydown(event, transaction, field, index) {
      if (event.key !== 'Enter' && event.key !== 'Tab') return;
      event.preventDefault();
      const fieldsOrder = ['description', 'account', 'debit', 'credit'];

      if (fieldsOrder.indexOf(field) < fieldsOrder.length - 1) {
        this.$refs.transactions.querySelectorAll('tr')[index].querySelectorAll('td')[fieldsOrder.indexOf(field) + 1]?.click();
      } else {
        if (index + 1 >= this.journalEntryView.transactions.length) {
          if(event.key==='Enter'){
            this.journalEntryView.transactions.push(new Transaction());
          }else{
            return;
          }
        }
        this.$nextTick(() => {
          this.$refs.transactions.querySelectorAll('tr')[index + 1].querySelectorAll('td')[0]?.click();
        })
      }
    },
    handleKeydown1(event, entry, field) {
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
  },
  mounted() {
  },
  created() {
    const accountStore = useAccountStore();  // 获取 store 实例
    accountStore.fetchAccounts();
    this.journalEntryView = new JournalEntryView(); // 初始化 journalEntryView
    // 调用实例方法 fetchAccounts
  }
}

</script>


<style scoped>
@import '@/assets/styles/journalEntry.css';
/* Target the deepest element with ::v-deep */
.custom-autocomplete {
  height: 100%;
  padding: 2px;
}

::v-deep(.custom-autocomplete .el-input) {
  height: 60px;
}

</style>
