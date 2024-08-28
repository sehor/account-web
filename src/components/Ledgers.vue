<template>
  <div class="ledgers">
    <div class="ledger-layout">
      <div class="ledger-section">
        <div class="ledger-container">
          <h3>明细账</h3>
          <div v-if="selectedAccount" class="selected-account">
            当前选中科目：{{ selectedAccount.code }} - {{ selectedAccount.name }}
          </div>
          <div class="ledger-controls">
            <div class="period-selectors">
              <el-select
                v-model="startPeriod"
                placeholder="开始会计期间"
                style="width: 150px;"
              >
                <el-option
                  v-for="period in accountingPeriods"
                  :key="period.value"
                  :label="period.label"
                  :value="period.value"
                />
              </el-select>
              <span class="period-separator">至</span>
              <el-select
                v-model="endPeriod"
                placeholder="结束会计期间"
                style="width: 150px;"
              >
                <el-option
                  v-for="period in accountingPeriods"
                  :key="period.value"
                  :label="period.label"
                  :value="period.value"
                />
              </el-select>
              <el-button type="primary" @click="fetchData" >获取</el-button>
            </div>
          </div>
          <Ledger
            v-if="selectedAccount"
            :account="selectedAccount"
            :start-date="startDate"
            :end-date="endDate"
            :should-fetch="shouldFetch"
            @fetched="onFetched"
          />
        </div>
      </div>

      <div class="account-section">
        <Accounts @account-selected="handleAccountSelect" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Accounts from './Accounts.vue'
import Ledger from './Ledger.vue'
import { useAccountStore } from '../stores/accountStore'

export default {
  name: 'Ledgers',
  components: {
    Accounts,
    Ledger
  },
  setup() {
    const accountStore = useAccountStore()
    const selectedAccount = ref(null)
    const startPeriod = ref('')
    const endPeriod = ref('')
    const accountingPeriods = ref([])
    const shouldFetch = ref(false)

    const startDate = computed(() => {
      if (!startPeriod.value) return ''
      const [year, month] = startPeriod.value.split('-')
      return `${year}-${month}-01`
    })

    const endDate = computed(() => {
      if (!endPeriod.value) return ''
      const [year, month] = endPeriod.value.split('-')
      return new Date(year, month, 0).toISOString().split('T')[0]
    })

    const canFetch = computed(() => {
      return selectedAccount.value && startPeriod.value && endPeriod.value
    })

    function handleAccountSelect(account) {
      selectedAccount.value = account
      fetchData() // 每次选择账户时都获取数据
    }

    function fetchData() {
      if (canFetch.value) {
        shouldFetch.value = false // 先设置为 false
        nextTick(() => {
          shouldFetch.value = true // 在下一个 tick 设置为 true，确保触发变化
        })
      }
    }

    function onFetched() {
      shouldFetch.value = false
    }

    function generateAccountingPeriods() {
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1
      const periods = []
      for (let year = currentYear - 1; year <= currentYear + 1; year++) {
        for (let month = 1; month <= 12; month++) {
          const value = `${year}-${month.toString().padStart(2, '0')}`
          const label = `${year}年${month}月`
          periods.push({ value, label })
        }
      }
      accountingPeriods.value = periods

      // 设置默认会计期间为本月
      const defaultPeriod = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
      startPeriod.value = defaultPeriod
      endPeriod.value = defaultPeriod
    }

    function selectDefaultAccount() {
      if (accountStore.accounts.length > 0) {
        selectedAccount.value = accountStore.accounts[0]
        if (canFetch.value) {
          shouldFetch.value = true // 初始选择账户时，如果可以获取数据，则触发数据获取
        }
      }
    }

    onMounted(async () => {
      generateAccountingPeriods()
      await accountStore.fresh()
      selectDefaultAccount()
    })

    watch(() => accountStore.accounts, (newAccounts) => {
      if (newAccounts.length > 0 && !selectedAccount.value) {
        selectDefaultAccount()
      }
    })

    return {
      selectedAccount,
      startPeriod,
      endPeriod,
      startDate,
      endDate,
      accountingPeriods,
      handleAccountSelect,
      canFetch,
      fetchData, // 确保这个函数被返回
      shouldFetch,
      onFetched
    }
  }
}
</script>

<style scoped>
.ledgers {
  padding: 20px;
  overflow: hidden;
}

.ledger-layout {
  display: flex;
  width: 100%;
  height: calc(100vh - 40px); /* 减去padding的高度 */
  overflow: hidden;
}

.account-section {
  min-width: 200px;
  overflow-y: auto;
  border-right: 1px solid #e0e0e0;
  padding-right: 20px;
}

.ledger-section {
  flex: 1;
  min-width: 800px;
  overflow-y: auto;
  padding-left: 20px;
}

.ledger-container {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 20px;
}

.ledger-controls {
  margin-bottom: 20px;
}

.period-selectors {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.period-separator {
  margin: 0 10px;
}

.selected-account {
  margin-bottom: 15px;
  font-weight: bold;
  color: #409EFF;
}

.no-account-selected, .no-entries {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 16px;
  border-radius: 4px;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #409EFF;
}

.el-button {
  margin-left: 10px;
}
</style>