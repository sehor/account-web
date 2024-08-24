<template>
  <div v-cloak>
    <el-container>
      <el-header>
        <el-row>
          <el-col :span="12">
            <h3>财务科目管理系统</h3>
          </el-col>
        </el-row>
        {{activeTab}}
      </el-header>

      <el-main>
        <el-tabs v-model="activeTab" @tab-click="onTabClick">
          <el-tab-pane label="资产" name="资产"></el-tab-pane>
          <el-tab-pane label="负债" name="负债"></el-tab-pane>
          <el-tab-pane label="所有者权益" name="所有者权益"></el-tab-pane>
          <el-tab-pane label="成本" name="成本"></el-tab-pane>
          <el-tab-pane label="损益" name="损益"></el-tab-pane>
        </el-tabs>
        <el-input v-model="searchQuery" placeholder="搜索" @input="filterTree"></el-input>
        <el-tree :data="accountsTree" :props="treeProps" :expand-on-click-node="false" :highlight-current="true"
          node-key="id" :filter-node-method="filterNode" :default-expanded-keys="defaultExpandedKeys"
          @node-expand="handleNodeExpand" @node-collapse="handleNodeCollapse" ref="tree" key="treeKey"
          style="max-width: 100%; margin: 0 auto;">
          <template #default="{ node, data }">
            <span>
              <i :class="data.icon" style="margin-right: 5px;"></i>
              {{ data.code }} - {{ data.name }}
            </span>
            <el-tag :type="getStatusType(data.state)" style="margin-left: 10px;">
              {{ data.state == 'ACTIVE' ? '启用' : '禁用' }}
            </el-tag>
            <div class="action-buttons" style="float: right;" :gutter="200">
              <el-icon size="small" color="blue" style="margin-right: 10px;" @click.stop="editItem(data)">
                <Edit></Edit>
              </el-icon>
              <el-icon size="small" color="green" style="margin-right: 10px;" @click.stop="addSubAccount(data)">
                <Plus />
              </el-icon>
              <el-icon size="small" color="red" @click.stop="deleteItem(data)">
                <Delete></Delete>
              </el-icon>

            </div>
          </template>
        </el-tree>
      </el-main>

      <el-dialog v-model="dialog" width="500px">
        <span slot="title">{{ formTitle }}</span>
        <el-form :model="editedItem">
          <el-row>
            <el-col :span="8">
              <el-form-item label="编码">
                <el-input v-model="editedItem.code" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="名称">
                <el-input v-model="editedItem.name" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="类别">
                <el-select disabled v-model="editedItem.type">
                  <el-option v-for="category in categories" :key="category.value" :label="category.label"
                    :value="category.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="余额方向">
                <el-select disabled v-model="editedItem.balanceDirection">
                  <el-option v-for="direction in balanceDirections" :key="direction.value" :label="direction.label"
                    :value="direction.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="状态">
                <el-select v-model="editedItem.state">
                  <el-option v-for="status in statusOptions" :key="status.value" :label="status.label"
                    :value="status.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="close">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </div>
      </el-dialog>

      <el-dialog v-model="dialogDelete" width="500px">
        <span slot="title">确定要删除这个科目吗?</span>
        <div slot="footer" class="dialog-footer">
          <el-button @click="closeDelete">取消</el-button>
          <el-button type="danger" @click="deleteItemConfirm">确定</el-button>
        </div>
      </el-dialog>
    </el-container>
  </div>
</template>

<script>

import {useAccountStore} from '@/stores/accountStores';
import accountService from '@/services/accountService';
import {ElMessage} from 'element-plus'; // 引入 Element Plus 的 Message 组件
import {Account, AccountCategoryMapping, ChineseToEnglishMapping} from "@/models/accountModels.js";

const store = useAccountStore();
export default {
  data() {
    return {
      accounts:[],
      accountsTree: [],
      defaultExpandedKeys: [],
      searchQuery: "",
      dialog: false,
      dialogDelete: false,
      openAll: [],
      isEdit:false,
      deleteId: null,
      editedItem: new Account(),
      defaultItem: new Account(),
      categories: Array.from(ChineseToEnglishMapping.AccountType, ([label, value]) => ({
        value,
        label
      })),
      balanceDirections: Array.from(ChineseToEnglishMapping.AccountingDirection, ([label, value]) => ({
        value,
        label
      })),
      statusOptions: Array.from(ChineseToEnglishMapping.AccountState, ([label, value]) => ({
        value,
        label
      })),
      activeTab: '资产',
      tabs: ['资产', '负债', '所有者权益', '成本', '损益'],
      treeProps: {
        children: 'children',
        label: 'name',
      },
    };
  },

  computed: {
    formTitle() {
      return this.isEdit ? '编辑科目' : '新增科目';
    },
  },

  methods: {
    onTabClick(tab) {
      this.searchQuery='';
      this.$nextTick(()=>{
        this.$refs.tree.filter('');
      })
    },
    getStatusType(status) {
      return status === 'ACTIVE' ? 'success' : 'info';
    },
    editItem(item) {
      this.isEdit = true;

      this.editedItem = { ...item };

      //this.dialog = true;
    },
    deleteItem(item) {
      if (item?.children?.length > 0) {
        ElMessage.error({
          message: "该科目存在下级科目，不能删除",
          duration: 5000
        });
        return
      }
      this.deleteId = item.id;
      this.dialogDelete = true;
    },
    deleteItemConfirm() {
      accountService.deleteAccount(this.deleteId)
          .then(() => {
            const node = this.findNodeById(this.deleteId,this.accountsTree);
            console.log({node})

            if (node) {
              const parentNode = this.findNodeById(node.parentId,this.accountsTree);
              console.log({parentNode})
              if (parentNode) {
                parentNode.children = parentNode.children.filter(child => child.id !== this.deleteId);
              } else {
                this.accountsTree = this.accountsTree.filter(rootNode => rootNode.id !== this.deleteId);
              }
            }
            this.deleteId = null;
          });
      this.dialogDelete = false;
    },

    addSubAccount(item) {
      this.editedItem = { ...this.defaultItem };
      this.editedItem.parentId = item.id; // Updated to use parentId
      this.editedItem.code = this.generateNextCode(item); // Generate the next code
      this.editedItem.type = item.type;
      this.editedItem.balanceDirection = item.balanceDirection;
      this.editedItem.state = 'ACTIVE';
      this.isEdit = false; // Set to false when creating a new item
      this.dialog = true;
    },
    close() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = new Account();
      });
    },
    closeDelete() {
      this.dialogDelete = false;
      this.$nextTick(() => {
        this.editedItem = new Account();
      });
    },
    save(event) {
      if (event) {
        event.preventDefault(); // Prevent default form submission behavior
      }
      if (this.isEdit) {
        //this.updateNode(this.editedItem.id, this.editedItem);
        accountService.updateAccount(this.editedItem).then(() => {
          this.updateNode(this.editedItem.id, this.editedItem);
        })
      } else {
        accountService.addAccount(this.editedItem).then((response) => {
          const parentNode = this.findNodeById(response.parentId, this.accountsTree);
          console.log(parentNode)
          if (parentNode) {
            parentNode.children.push(response);
            this.$nextTick(() => {
              this.defaultExpandedKeys.push(parentNode.code); //展开parentnode
              this.$refs.tree.setCurrentKey(response.id);
            });
          } else {
            this.accountsTree.push(response); // Add new root node
          }

        })
      }

      this.close();
    },
    generateNextCode(parent) {
      return parent.code + (parent.children.length + 1).toString().padStart(3, '0');
    },
    updateNode(nodeId, newNodeData) {
      const node = this.findNodeById(nodeId, this.accountsTree);
      if (node) {
        Object.assign(node, newNodeData); // This updates the node in place
      }
    },
    findNodeById(id, tree) {
      for (let i = 0; i < tree.length; i++) {
        if (tree[i].id === id) {
          return tree[i];
        } else if (tree[i].children && tree[i].children.length > 0) {
          const foundNode = this.findNodeById(id, tree[i].children);
          if (foundNode) {
            return foundNode;
          }
        }
      }
      return null;
    },
    filterTree() {
      // 通过ref调用树组件的filter方法
      this.$refs.tree.filter(this.searchQuery);
    },
    filterNode(value, data) {
      const categoryTypes = AccountCategoryMapping.get(this.activeTab) || [];

      // Check if the node's type matches the current active tab's category types
      const matchesCategory = categoryTypes.includes(data.type);
      //console.log({matchesCategory},{categoryTypes},data.type+"   ")
      if (!value) return matchesCategory;
      // Return true only if both the category and search criteria are matched
      return  (data.code.includes(value) || data.name.includes(value))&&matchesCategory;
    },
    handleNodeExpand(data) {
      if (!this.defaultExpandedKeys.includes(data.code)) {
        this.defaultExpandedKeys.push(data.code)
      }

    },
    handleNodeCollapse(data) {
      if (this.defaultExpandedKeys.includes(data.code)) {
        let index = this.defaultExpandedKeys.indexOf(data.code);
        this.defaultExpandedKeys.splice(index, 1);
      }
    }
  },
  mounted() {
    this.$nextTick(() => {

      //this.$refs.tree.filter('');
    });
  },
  created() {
    store.fetchAccounts().then(() => {
      this.accounts = store.accounts;
      this.accountsTree = store.buildTree(this.accounts);


      // Ensure the tree is rendered with the correct data before filtering
      this.$nextTick(() => {
        if (this.$refs.tree) {
          this.$refs.tree.filter(this.searchQuery);

        }
      });
    });
  }

};
</script>

<style scoped>
[v-cloak] {
  display: none;
}

.account-tree {
  max-width: 100%;
  margin: 0 auto;
}

.action-buttons {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.dialog-footer {
  text-align: right;

}
</style>
