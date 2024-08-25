<template>
  <div class="account-tree" v-loading="loading" element-loading-text="加载中...">
    <h2 class="account-tree__title">会计科目表</h2>
    <div class="account-tree__search-container">
      <el-input
        v-model="searchQuery"
        placeholder="搜索科目"
        prefix-icon="el-icon-search"
        clearable
        class="account-tree__search"
      />
    </div>
    <el-tree
      v-if="!loading"
      ref="treeRef"
      :data="accountTree"
      :props="defaultProps"
      :filter-node-method="filterNode"
      :default-expanded-keys="expandedKeys"
      @node-click="handleNodeClick"
      @node-expand="handleNodeExpand"
      @node-collapse="handleNodeCollapse"
      class="account-tree__tree"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span class="custom-tree-node__code">{{ data.code }}</span>
          <span class="custom-tree-node__name">{{ data.name }}</span>
        </span>
      </template>
    </el-tree>
  </div>
</template>
  
<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '../stores/accountStore'
  
export default {
  name: 'AccountTree',
  emits: ['account-selected'], // Added this line to declare the event
  setup(props, { emit }) { // Added emit parameter
    const accountStore = useAccountStore()
    const loading = ref(true)
    const searchQuery = ref('')
    const treeRef = ref(null)
    const expandedKeys = ref([])
  
    const accountTree = computed(() => {
      if (accountStore.accounts.length === 0) {
        return []
      }
      return accountStore.buildTree(accountStore.accounts)
    })
  
    const defaultProps = {
      children: 'children',
      label: 'name'
    }
  
    function handleNodeClick(data) {
      console.log(data)
      emit('account-selected', data) // Emit the selected account data
    }
  
    function filterNode(value, data) {
      if (!value) return true
      return data.name.includes(value) || data.code.includes(value)
    }
  
    function handleNodeExpand(data) {
      expandedKeys.value.push(data.id)
      localStorage.setItem('expandedKeys', JSON.stringify(expandedKeys.value))
    }
  
    function handleNodeCollapse(data) {
      const index = expandedKeys.value.indexOf(data.id)
      if (index > -1) {
        expandedKeys.value.splice(index, 1)
        localStorage.setItem('expandedKeys', JSON.stringify(expandedKeys.value))
      }
    }
  
    onMounted(async () => {
      try {
        await accountStore.fresh()
        const savedExpandedKeys = localStorage.getItem('expandedKeys')
        if (savedExpandedKeys) {
          expandedKeys.value = JSON.parse(savedExpandedKeys)
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error)
        // 这里可以添加错误处理逻辑,比如显示错误消息
      } finally {
        loading.value = false
      }
    })
  
    watch(searchQuery, (newValue) => {
      treeRef.value.filter(newValue)
    })
  
    return {
      accountTree,
      defaultProps,
      handleNodeClick,
      loading,
      searchQuery,
      treeRef,
      filterNode,
      expandedKeys,
      handleNodeExpand,
      handleNodeCollapse
    }
  }
}
</script>
  
<style scoped>
.account-tree {
  margin: 20px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
}

.account-tree__title {
  color: #409EFF;
  font-size: 18px;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f2f6fc;
  border-bottom: 1px solid #e0e0e0;
}

.account-tree__search-container {
  padding: 10px;
  display: flex;
  justify-content: flex-end;
}

.account-tree__search {
  width: 200px;
}

.account-tree__tree {
  max-height: 600px;
  overflow-y: auto;
  padding: 0 10px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.custom-tree-node__code {
  color: #606266;
  margin-right: 8px;
  font-weight: 500;
}

.custom-tree-node__name {
  color: #303133;
}

:deep(.el-tree-node__content) {
  height: 30px;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}

:deep(.el-tree-node:focus > .el-tree-node__content) {
  background-color: #e6f1fc;
}

:deep(.el-tree-node__expand-icon) {
  font-size: 16px;
}

:deep(.el-tree-node__expand-icon.expanded) {
  transform: rotate(90deg);
}

:deep(.el-input__inner) {
  height: 32px;
}

:deep(.el-tree) {
  background-color: transparent;
}
</style>