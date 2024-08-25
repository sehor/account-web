<template>
  <div class="ledger" v-loading="loading">
    <div class="ledger-header">
      <div class="spacer"></div>
      <button @click="exportToExcel" class="export-button">导出到Excel</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>日期</th>
          <th>凭证字号</th>
          <th>描述</th>
          <th>借方</th>
          <th>贷方</th>
          <th>方向</th>
          <th>余额</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(group, period) in paginatedEntries">
          <tr v-for="(entry, index) in group" :key="`${period}-${index}`" :class="{ 'stripe': index % 2 === 0 }">
            <td>{{ entry.date }}</td>
            <td>{{ entry.voucherNo }}</td>
            <td>{{ entry.description }}</td>
            <td>{{ formatAmount(entry.debit) }}</td>
            <td>{{ formatAmount(entry.credit) }}</td>
            <td>{{ entry.direction }}</td>
            <td>{{ formatBalance(entry.balance) }}</td>
          </tr>
          <tr class="period-summary">
            <td colspan="3">{{ period }} 合计</td>
            <td>{{ formatAmount(periodTotals[period].debit) }}</td>
            <td>{{ formatAmount(periodTotals[period].credit) }}</td>
            <td>{{ periodTotals[period].direction }}</td>
            <td>{{ formatBalance(periodTotals[period].balance) }}</td>
          </tr>
        </template>
      </tbody>
      <tfoot v-if="ledgerEntries.length > 0">
        <tr class="grand-total">
          <td colspan="3">总计</td>
          <td>{{ formatAmount(grandTotal.debit) }}</td>
          <td>{{ formatAmount(grandTotal.credit) }}</td>
          <td>{{ grandTotal.direction }}</td>
          <td>{{ formatBalance(grandTotal.balance) }}</td>
        </tr>
      </tfoot>
    </table>
    <div class="pagination" v-if="ledgerEntries.length > 0">
      <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span>第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import * as XLSX from 'xlsx';
import transactionAPI from '../http/transactionAPI'
import { ElMessage } from 'element-plus'

export default {
  name: 'Ledger',
  props: {
    account: {
      type: Object,
      required: true
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      required: true
    },
    shouldFetch: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const loading = ref(false);
    const ledgerEntries = ref([]);
    const currentPage = ref(1);
    const itemsPerPage = ref(10);

    const fetchLedgerEntries = async () => {
      if (!props.account || !props.startDate || !props.endDate) return;

      loading.value = true;
      try {
        const response = await transactionAPI.getTransactionsByAccountAndPeriod(
          props.account.id,
          props.startDate,
          props.endDate
        );
        const returnData = response?._embedded?.transactionList;
        if (returnData) {
          ledgerEntries.value = returnData;
        } else {
          ledgerEntries.value = [];
          if (response && response.page && response.page.totalElements === 0) {
            ElMessage.info('该时间段内没有交易记录');
          } else {
            throw new Error('Unexpected response format');
          }
        }
      } catch (error) {
        console.error('Failed to fetch ledger entries:', error);
        ledgerEntries.value = [];
        ElMessage.error('获取明细账数据失败,请稍后重试');
      } finally {
        loading.value = false;
        emit('fetched'); // 发出一个事件表示数据获取完成
      }
    };

    watch(() => props.shouldFetch, (newShouldFetch) => {
      if (newShouldFetch) {
        fetchLedgerEntries();
      }
    });

    const filteredEntries = computed(() => {
      return ledgerEntries.value.filter(entry => {
        if (props.startDate && entry.createdDate < props.startDate) return false;
        if (props.endDate && entry.createdDate > props.endDate) return false;
        return true;
      });
    });

    const groupedEntries = computed(() => {
      let runningBalance = 0;
      return filteredEntries.value.reduce((acc, entry) => {
        const period = entry.createdDate.substring(0, 7);
        if (!acc[period]) {
          acc[period] = [];
        }
        const debit = Number(entry.debit) || 0;
        const credit = Number(entry.credit) || 0;
        if (entry.balanceDirection === 'DEBIT') {
          runningBalance += debit - credit;
        } else {
          runningBalance -= debit - credit;
        }
        acc[period].push({
          ...entry,
          date: entry.createdDate,
          voucherNo: entry.vouchWord || '-',
          direction: entry.balanceDirection === 'DEBIT' ? '借' : '贷',
          balance: runningBalance
        });
        return acc;
      }, {});
    });

    const paginatedEntries = computed(() => {
      const allEntries = Object.entries(groupedEntries.value);
      const start = (currentPage.value - 1) * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      return Object.fromEntries(allEntries.slice(start, end));
    });

    const totalPages = computed(() => {
      return Math.ceil(Object.keys(groupedEntries.value).length / itemsPerPage.value);
    });

    const periodTotals = computed(() => {
      return Object.entries(groupedEntries.value).reduce((acc, [period, entries]) => {
        acc[period] = entries.reduce((total, entry) => {
          total.debit += entry.debit;
          total.credit += entry.credit;
          total.balance = entry.balance;
          total.direction = entry.direction;
          return total;
        }, {debit: 0, credit: 0, balance: 0, direction: ''});
        return acc;
      }, {});
    });

    const grandTotal = computed(() => {
      return Object.values(periodTotals.value).reduce((total, periodTotal) => {
        total.debit += periodTotal.debit;
        total.credit += periodTotal.credit;
        total.balance = periodTotal.balance;
        total.direction = periodTotal.direction;
        return total;
      }, {debit: 0, credit: 0, balance: 0, direction: ''});
    });

    function formatNumber(value) {
      return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    }

    function formatAmount(value) {
      return value === 0 ? '' : formatNumber(value);
    }

    function formatBalance(value) {
      if (value === 0) return '平';
      return `${value > 0 ? '借' : '贷'} ${formatNumber(Math.abs(value))}`;
    }

    function prevPage() {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    }

    function nextPage() {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    }

    function exportToExcel() {
      if (!props.account) {
        console.warn('No account selected for export');
        return;
      }
      const data = Object.values(groupedEntries.value).flat().map(entry => ({
        日期: entry.date,
        凭证字号: entry.voucherNo,
        描述: entry.description,
        借方: entry.debit,
        贷方: entry.credit,
        方向: entry.direction,
        余额: entry.balance
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "会计分类账");
      XLSX.writeFile(wb, `${props.account.code}-${props.account.name}-明细账.xlsx`);
    }

    return {
      loading,
      ledgerEntries,
      currentPage,
      paginatedEntries,
      totalPages,
      periodTotals,
      grandTotal,
      formatAmount,
      formatBalance,
      prevPage,
      nextPage,
      exportToExcel
    };
  }
}
</script>

<style scoped>
.ledger {
  margin: 20px;
}

.ledger-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.spacer {
  flex-grow: 1;
}

.export-button {
  padding: 8px 15px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.export-button:hover {
  background-color: #66b1ff;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

.stripe {
  background-color: #f9f9f9;
}

.period-summary {
  font-weight: bold;
  background-color: #e6f7ff;
}

.grand-total {
  font-weight: bold;
  background-color: #ffd591;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.pagination button {
  margin: 0 10px;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 16px;
}
</style>