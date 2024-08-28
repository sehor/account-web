<template>
  <div class="voucher-query">
    <h1>查询凭证</h1>
    <el-form :inline="true" :model="queryForm" class="demo-form-inline">
      <el-form-item label="开始会计期间">
        <el-date-picker
          v-model="queryForm.startPeriod"
          type="month"
          placeholder="选择开始会计期间"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="结束会计期间">
        <el-date-picker
          v-model="queryForm.endPeriod"
          type="month"
          placeholder="选择结束会计期间"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="voucherList"
      style="width: 100%"
      row-key="id"
      :row-class-name="tableRowClassName"
    >
      <el-table-column prop="voucherDate" label="凭证日期" width="100">
        <template #default="scope">
          <span v-if="scope.row.isFirstRow">{{ scope.row.voucherDate }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="voucherWord" label="字" width="50">
        <template #default="scope">
          <span v-if="scope.row.isFirstRow">{{ scope.row.voucherWord }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="voucherNum" label="号" width="50">
        <template #default="scope">
          <span v-if="scope.row.isFirstRow">{{ scope.row.voucherNum }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="summary" label="摘要" width="200"></el-table-column>
      <el-table-column prop="accountSubject" label="会计科目" width="200"></el-table-column>
      <el-table-column prop="debit" label="借方金额" width="120" align="right"></el-table-column>
      <el-table-column prop="credit" label="贷方金额" width="120" align="right"></el-table-column>
      <el-table-column prop="attachment" label="附件" width="60">
        <template #default="scope">
          <span v-if="scope.row.isFirstRow">{{ scope.row.attachment }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="preparer" label="制单人" width="80">
        <template #default="scope">
          <span v-if="scope.row.isFirstRow">{{ scope.row.preparer }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="auditor" label="审核人" width="80">
        <template #default="scope">
          <span v-if="scope.row.isFirstRow">{{ scope.row.auditor }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button v-if="scope.row.isFirstRow" size="small" @click="viewDetails(scope.row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
    >
    </el-pagination>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { JournalEntryModels, Transaction } from '@/models/journalEntryModels';

export default {
  name: 'VoucherQuery',
  setup() {
    const queryForm = reactive({
      startPeriod: null,
      endPeriod: null,
    });

    const voucherList = ref([]);
    const loading = ref(false);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const total = ref(0);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const mockData = ref([]);
    const flattenedVoucherList = ref([]);

    const generateMockData = (count) => {
      const data = [];
      for (let i = 0; i < count; i++) {
        const journalEntry = new JournalEntryModels(
          `id_${i + 1}`,
          new Date().toISOString(),
          new Date().toISOString(),
          '记',
          `制单人${Math.floor(Math.random() * 5) + 1}`,
          `审核人${Math.floor(Math.random() * 3) + 1}`,
          `会计主管${Math.floor(Math.random() * 2) + 1}`,
          [],
          i + 1,
          Math.random() > 0.5 ? ['attachment1'] : []
        );

        const transactions = [];
        const transactionCount = Math.floor(Math.random() * 3) + 2; // 2-4 transactions per entry
        for (let j = 0; j < transactionCount; j++) {
          transactions.push(new Transaction(
            `trans_id_${i}_${j}`,
            journalEntry.createdDate,
            journalEntry.modifiedDate,
            `摘要${j + 1}`,
            `account_id_${j}`,
            { fullName: `科目${Math.floor(Math.random() * 10) + 1}` },
            Math.random() > 0.5 ? '借' : '贷',
            (Math.random() * 10000).toFixed(2),
            Math.random() > 0.5 ? (Math.random() * 10000).toFixed(2) : 0,
            Math.random() > 0.5 ? (Math.random() * 10000).toFixed(2) : 0,
            '记'
          ));
        }

        journalEntry.transactions = transactions;
        data.push(journalEntry);
      }
      return data;
    };

    const flattenVoucherData = (data) => {
      return data.flatMap((journalEntry, index) => {
        return journalEntry.transactions.map((transaction, tIndex) => ({
          id: `${journalEntry.id}_${tIndex}`,
          voucherDate: tIndex === 0 ? formatDate(journalEntry.createdDate) : '',
          voucherWord: tIndex === 0 ? journalEntry.voucherWord : '',
          voucherNum: tIndex === 0 ? journalEntry.voucherNum : '',
          summary: transaction.description,
          accountSubject: transaction.account.fullName,
          debit: transaction.debit,
          credit: transaction.credit,
          attachment: tIndex === 0 ? (journalEntry.attachmentIds.length > 0 ? '有' : '无') : '',
          preparer: tIndex === 0 ? journalEntry.bookkeeper : '',
          auditor: tIndex === 0 ? journalEntry.auditor : '',
          isFirstRow: tIndex === 0,
          voucherIndex: index
        }));
      });
    };

    const tableRowClassName = ({ row }) => {
      if (row.isFirstRow) {
        return `voucher-first-row voucher-group-${row.voucherIndex % 2}`;
      }
      return `voucher-group-${row.voucherIndex % 2}`;
    };

    const onSubmit = async () => {
      loading.value = true;
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 在实际应用中，这里应该是从后端获取数据
        // 现在我们只是重新生成模拟数据
        mockData.value = generateMockData(1000);
        flattenedVoucherList.value = flattenVoucherData(mockData.value);
        
        total.value = flattenedVoucherList.value.length;
        currentPage.value = 1;
        updateDisplayedVouchers();
      } catch (error) {
        console.error('查询凭证失败:', error);
        ElMessage.error('查询凭证失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    };

    const updateDisplayedVouchers = () => {
      const startIndex = (currentPage.value - 1) * pageSize.value;
      const endIndex = startIndex + pageSize.value;
      voucherList.value = flattenedVoucherList.value.slice(startIndex, endIndex);
    };

    const handleSizeChange = (val) => {
      pageSize.value = val;
      updateDisplayedVouchers();
    };

    const handleCurrentChange = (val) => {
      currentPage.value = val;
      updateDisplayedVouchers();
    };

    const viewDetails = (row) => {
      console.log('查看凭证详情:', row);
    };

    // 初始加载数据
    onMounted(() => {
      onSubmit();
    });

    return {
      queryForm,
      voucherList,
      loading,
      currentPage,
      pageSize,
      total,
      onSubmit,
      handleSizeChange,
      handleCurrentChange,
      viewDetails,
      formatDate,
      flattenedVoucherList,
      tableRowClassName,
    };
  },
};
</script>

<style scoped>
.voucher-query {
  padding: 20px;
}
.el-table :deep(.voucher-first-row) {
  font-weight: bold;
}
.el-table :deep(.voucher-group-0) {
  background-color: #ffffff; /* 无色 */
}
.el-table :deep(.voucher-group-1) {
  background-color: #f0f9eb; /* 浅绿色 */
}
.el-table :deep(.el-table__row) {
  border-bottom: 1px solid #EBEEF5;
}
.el-table :deep(.voucher-first-row) {
  border-top: 2px solid #409EFF;
}
/* 移除鼠标悬停效果 */
.el-table :deep(.el-table__body tr:hover > td) {
  background-color: inherit !important;
}
</style>