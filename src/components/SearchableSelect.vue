<template>
    <div class="searchable-select">
        <input type="text" v-model="search" @input="filterOptions" @focus="showDropdown = true" @blur="hideDropdown"
            :placeholder="placeholder">

        <div v-show="showDropdown" class="options-dropdown">
            <div v-for="option in filteredOptions" :key="option.value" @mousedown="selectOption(option)" class="option">
                {{ option.name }}
            </div>
        </div>
    </div>
</template>
  
<script>
export default {
    name: 'SearchableSelect',
    props: {
        value: String,
        options: Array,
        placeholder: {
            type: String,
            default: '搜索会计科目...'
        }
    },
    data() {
        return {
            search: '',
            showDropdown: false,
            filteredOptions: []
        }
    },
    mounted() {
        this.search = this.value;
        this.filteredOptions = this.options;
    },
    methods: {
        filterOptions() {
            this.filteredOptions = this.options.filter(option =>
                option.name.toLowerCase().includes(this.search.toLowerCase())
            );
            
        },
        selectOption(option) {
            this.search = option.name;
            this.$emit('input', option.name);
            this.showDropdown = false;
           
        },
        hideDropdown() {
            setTimeout(() => {
                this.showDropdown = false;
            }, 200);
        }
    }
}
</script>
  
<style scoped>
.searchable-select {
    position: relative;
    width: 100%;
    height: 100%;

}

input {
    width: 100%;
    height: 95%;
    padding: 0;
    /* 移除内边距 */
    margin: 0;
    /* 移除外边距 */
    border: none;
    /* 移除边框 */
}



.option {
    padding: 5px;
    cursor: pointer;
}

.option:hover {
    background-color: #f0f0f0;
}

.options-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #ccc;
    background-color: white;
    z-index: 1000;
}</style>
