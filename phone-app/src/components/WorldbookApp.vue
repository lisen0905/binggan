<!-- components/WorldbookApp.vue -->
<template>
  <div>
    <!-- 1. 世界书主页面板 -->
    <div id="worldbook-app" :class="{ active: isOpen }">
      <div class="simple-header">
        <div class="header-btn" @click="closeApp">关闭</div>
        <div class="header-title">世界设定</div>
        <div class="header-btn" @click="openEdit()">添加</div>
      </div>
      
      <!-- 分类滑动栏 -->
      <div class="wb-categories">
        <div 
          class="wb-tab" 
          v-for="cat in categories" 
          :key="cat"
          :class="{ active: currentCategory === cat }"
          @click="switchCategory(cat)"
        >
          {{ cat }}
        </div>
      </div>

      <!-- 总控面板 (当有分类时才显示) -->
      <div class="wb-master-control" v-if="currentCategory">
        <div class="wb-master-info">
          <div class="wb-master-title">当前世界书：{{ currentCategory }}</div>
          <div class="wb-master-desc">关闭后，该分类下所有分支均不生效</div>
        </div>
        <label class="switch" @click.stop>
          <input type="checkbox" v-model="isMasterOn" @change="toggleMasterSwitch">
          <span class="slider"></span>
        </label>
      </div>

      <!-- 条目列表区 -->
      <div class="wb-entry-list">
        <div v-if="categories.length === 0" style="text-align:center; color:#999; font-size:13px; margin-top:40px;">
          请先点击右上角添加一个世界书分类~
        </div>
        <div v-else-if="filteredEntries.length === 0" style="text-align:center; color:#999; font-size:13px; margin-top:40px;">
          该分类下暂无分支设定
        </div>
        
        <!-- 循环渲染卡片：大类关闭时附加 disabled-category 类名使其变灰 -->
        <div 
          v-for="entry in filteredEntries" 
          :key="entry.id"
          class="wb-card"
          :class="{ 'disabled-category': !isMasterOn }"
          @click="openEdit(entry)"
        >
          <div class="wb-card-left">
            <div class="wb-card-title">{{ entry.name }}</div>
            <div class="wb-card-tags">
              <div v-if="entry.triggerType === '常驻'" class="wb-tag always">常驻</div>
              <template v-else>
                <div class="wb-tag">关键词</div>
                <!-- 显示前两个关键词作为预览 -->
                <div class="wb-tag" v-for="(kw, index) in getPreviewKeywords(entry.keywords)" :key="index">
                  {{ kw }}
                </div>
              </template>
            </div>
          </div>
          <div class="switch-container" @click.stop>
            <label class="switch">
              <input type="checkbox" v-model="entry.isEnabled" :disabled="!isMasterOn" @change="toggleEntrySwitch(entry)">
              <span class="slider" :style="!isMasterOn ? 'cursor:not-allowed;' : ''"></span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 详情编辑页面板 -->
    <div id="worldbook-edit-app" :class="{ active: isOpen && isEditing }">
      <div class="simple-header">
        <div class="header-btn" style="color:#999;" @click="isEditing = false">取消</div>
        <div class="header-title">{{ form.id ? '编辑设定分支' : '新建设定分支' }}</div>
        <div class="header-btn" @click="saveEntry">保存</div>
      </div>
      
      <div class="edit-body">
        <div class="setting-group">
          <span class="setting-label">所属世界书分类 (输入新名称自动创建)</span>
          <input type="text" class="setting-input" v-model="form.category" placeholder="例如：魔法学院、修仙境界、现代都市">
        </div>

        <div class="setting-group">
          <span class="setting-label">分支名称</span>
          <input type="text" class="setting-input" v-model="form.name" placeholder="例如：学院历史、等级设定">
        </div>

        <div class="setting-group">
          <span class="setting-label">触发方式</span>
          <div class="trigger-toggle">
            <div class="trigger-btn" :class="{ active: form.triggerType === '常驻' }" @click="form.triggerType = '常驻'">全局常驻</div>
            <div class="trigger-btn" :class="{ active: form.triggerType === '关键词' }" @click="form.triggerType = '关键词'">关键词触发</div>
          </div>
        </div>

        <!-- 关键词输入框 -->
        <div class="setting-group" v-show="form.triggerType === '关键词'">
          <span class="setting-label">触发关键词 (多个词用英文逗号分隔)</span>
          <input type="text" class="setting-input" v-model="form.keywords" placeholder="例如：校长,邓布利多,开学典礼">
        </div>

        <div class="setting-group">
          <div class="textarea-header">
            <span class="setting-label" style="margin:0;">设定内容详述</span>
            <div class="word-import-btn" @click="triggerWordUpload">导入Word</div>
          </div>
          <textarea class="setting-textarea" v-model="form.content" placeholder="在这里输入详细的世界观设定，越详细 Char 越懂哦..."></textarea>
        </div>
        
        <!-- 删除按钮：只在编辑已有条目时显示，去掉了红色背景，改为纯净字体颜色 -->
        <div 
          v-if="form.id" 
          class="api-action-btn del" 
          style="text-align:center; padding:12px; margin-top:10px;" 
          @click="deleteEntry"
        >
          删除该分支
        </div>
      </div>
    </div>

    <!-- 隐藏的 Word 导入输入框 -->
    <input type="file" id="wb-word-upload" class="hidden-input" accept=".docx" @change="onWordUpload">
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import mammoth from 'mammoth'
import { initDB, saveSettingData, getSettingValue } from '../utils/db.js'

const props = defineProps({ isOpen: Boolean })
const emit = defineEmits(['close'])

const closeApp = () => { emit('close') }

// 数据状态
const allEntries = ref([])
const currentCategory = ref('')
const isMasterOn = ref(true)
const isEditing = ref(false)

const form = ref({
  id: '', category: '', name: '', triggerType: '常驻', keywords: '', content: '', isEnabled: true
})

// 计算属性：提取所有不重复的分类名
const categories = computed(() => {
  const cats = allEntries.value.map(e => e.category).filter(c => c)
  return [...new Set(cats)]
})

// 计算属性：当前选中分类下的条目
const filteredEntries = computed(() => {
  return allEntries.value.filter(e => e.category === currentCategory.value)
})

// 提取关键词做预览展示
const getPreviewKeywords = (keywordsStr) => {
  if (!keywordsStr) return []
  return keywordsStr.split(',').filter(k => k.trim() !== '').slice(0, 2)
}

// 监听打开状态
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    isEditing.value = false
    loadData()
  }
})

// 加载数据库
const loadData = async (targetCategory = null) => {
  const db = await initDB()
  db.transaction(['worldbook_db'], 'readonly').objectStore('worldbook_db').getAll().onsuccess = async (e) => {
    allEntries.value = e.target.result || []
    
    if (categories.value.length > 0) {
      if (targetCategory && categories.value.includes(targetCategory)) {
        currentCategory.value = targetCategory
      } else if (!categories.value.includes(currentCategory.value)) {
        currentCategory.value = categories.value[0]
      }
      await checkMasterSwitch()
    } else {
      currentCategory.value = ''
    }
  }
}

// 切换分类
const switchCategory = async (cat) => {
  currentCategory.value = cat
  await checkMasterSwitch()
}

// 检查并同步分类的总控开关
const checkMasterSwitch = async () => {
  if (!currentCategory.value) return
  const val = await getSettingValue('wb_master_' + currentCategory.value)
  isMasterOn.value = (val !== null && val !== undefined) ? val : true
}

// 切换总控开关
const toggleMasterSwitch = async () => {
  if (!currentCategory.value) return
  await saveSettingData('wb_master_' + currentCategory.value, isMasterOn.value)
}

// 切换单个条目开关
const toggleEntrySwitch = async (entry) => {
  const db = await initDB()
  db.transaction(['worldbook_db'], 'readwrite').objectStore('worldbook_db').put(JSON.parse(JSON.stringify(entry)))
}

// 打开编辑面板
const openEdit = (entry = null) => {
  if (entry) {
    form.value = JSON.parse(JSON.stringify(entry))
  } else {
    form.value = {
      id: '', category: currentCategory.value || '', name: '', triggerType: '常驻', keywords: '', content: '', isEnabled: true
    }
  }
  isEditing.value = true
}

// 保存设定分支
const saveEntry = async () => {
  const f = form.value
  if (!f.category.trim() || !f.name.trim() || !f.content.trim()) {
    alert("分类名、分支名和设定内容都不能为空哦！")
    return
  }
  
  if (!f.id) f.id = 'wb_' + Date.now()

  const db = await initDB()
  db.transaction(['worldbook_db'], 'readwrite').objectStore('worldbook_db').put(JSON.parse(JSON.stringify(f))).onsuccess = () => {
    isEditing.value = false
    loadData(f.category) // 保存后刷新并跳转到该分类
  }
}

// 删除设定分支
const deleteEntry = async () => {
  if (!form.value.id) return
  if (!confirm("确定要删除这个设定分支吗？删除后不可恢复哦！")) return
  
  const db = await initDB()
  db.transaction(['worldbook_db'], 'readwrite').objectStore('worldbook_db').delete(form.value.id).onsuccess = () => {
    isEditing.value = false
    loadData(currentCategory.value)
  }
}

// 导入 Word
const triggerWordUpload = () => { document.getElementById('wb-word-upload').click() }
const onWordUpload = (e) => {
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    mammoth.extractRawText({arrayBuffer: evt.target.result})
      .then(result => { form.value.content = result.value })
      .catch(() => alert("解析失败，请确保上传的是 .docx 文档！"));
  };
  reader.readAsArrayBuffer(file); e.target.value = '';
}
</script>

<style scoped>
/* 背景强制采用纯冰川蓝，去除了所有的磨砂效果 */
#worldbook-app, #worldbook-edit-app {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
   background: linear-gradient(to bottom, #f5f7fa, #e4ebf5);
  z-index: 60; display: flex; flex-direction: column;
  padding-top: max(50px, calc(env(safe-area-inset-top) + 20px));
  transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
#worldbook-app.active, #worldbook-edit-app.active { transform: translateY(0); }
#worldbook-edit-app { z-index: 70; }

.simple-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 24px 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.05);
}
.header-title { font-size: 18px; font-weight: bold; color: var(--app-text-color); }
/* 使用 icon-svg-color 变量，不再使用发红的 status-bar 变量 */
.header-btn { font-size: 15px; color: var(--icon-svg-color); cursor: pointer; font-weight: 500; }

/* 横向滑动导航 */
.wb-categories {
  display: flex; gap: 12px; overflow-x: auto; padding: 0 24px 15px 24px;
  scrollbar-width: none; border-bottom: 1px solid rgba(0,0,0,0.05);
}
.wb-categories::-webkit-scrollbar { display: none; }
.wb-tab {
  flex-shrink: 0; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold;
  background: rgba(255,255,255,0.4); color: #888; cursor: pointer; transition: 0.3s;
  border: 1px solid transparent; box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}
.wb-tab.active {
  background: rgba(255,255,255,0.9); color: var(--icon-svg-color);
  box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.8);
}

/* 苹果风总控面板 */
.wb-master-control {
  margin: 15px 24px; padding: 16px; background: rgba(255,255,255,0.6);
  border-radius: 20px; display: flex; justify-content: space-between; align-items: center;
  border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}
.wb-master-info { display: flex; flex-direction: column; gap: 4px; }
.wb-master-title { font-size: 15px; font-weight: bold; color: var(--app-text-color); }
.wb-master-desc { font-size: 11px; color: #888; }

/* 条目列表卡片 */
.wb-entry-list { flex: 1; overflow-y: auto; padding: 0 24px 20px 24px; display: flex; flex-direction: column; gap: 12px; }
.wb-card {
  background: rgba(255,255,255,0.7); border-radius: 16px; padding: 15px;
  border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  display: flex; justify-content: space-between; align-items: center; cursor: pointer;
  transition: transform 0.2s, opacity 0.3s ease, filter 0.3s ease;
}
.wb-card:active { transform: scale(0.98); }
.wb-card.disabled-category { opacity: 0.45; filter: grayscale(100%); }
.wb-card-left { flex: 1; overflow: hidden; padding-right: 15px; }
.wb-card-title { font-size: 15px; font-weight: bold; color: var(--app-text-color); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-card-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.wb-tag { font-size: 11px; padding: 3px 8px; border-radius: 8px; background: rgba(122,148,169,0.1); color: #7a94a9; }
.wb-tag.always { background: rgba(255,193,7,0.15); color: #d3a000; font-weight: bold; }

/* 开关滑块样式 (保证不受系统干扰) */
.switch-container { display: flex; align-items: center; }
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: var(--icon-svg-color); }
input:checked + .slider:before { transform: translateX(20px); }

/* 编辑表单与触发方式胶囊 */
.edit-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.trigger-toggle { display: flex; background: rgba(0,0,0,0.05); border-radius: 12px; overflow: hidden; margin-bottom: 6px; }
.trigger-btn { flex: 1; text-align: center; padding: 10px 0; font-size: 13px; cursor: pointer; color: #888; transition: 0.2s; font-weight: bold; }
.trigger-btn.active { background: var(--icon-svg-color); color: #fff; }

.setting-group { margin-bottom: 12px; }
.setting-label { font-size: 12px; font-weight: bold; color: var(--app-text-color); margin-bottom: 6px; display: block; opacity: 0.8;}
.setting-input {
  width: 100%; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.1);
  border-radius: 10px; font-size: 13px; background: rgba(255,255,255,0.8);
  outline: none; color: var(--app-text-color); transition: border-color 0.2s;
}
.setting-input:focus { border-color: var(--icon-svg-color); }

.textarea-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px; }
.word-import-btn { font-size: 12px; color: #fff; background: var(--icon-svg-color); padding: 4px 10px; border-radius: 6px; cursor: pointer; }
.setting-textarea { width: 100%; height: 200px; padding: 12px; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; outline: none; resize: none; background: rgba(255,255,255,0.8); color: var(--app-text-color); line-height: 1.5; }

.api-action-btn { font-size: 13px; border-radius: 12px; cursor: pointer; font-weight: bold; }
/* 彻底去掉报错红，统一柔和高级色 */
.api-action-btn.del { color: #555; background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.1); }

.hidden-input { display: none; }
</style>