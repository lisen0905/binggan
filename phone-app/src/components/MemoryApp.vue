<!-- components/MemoryApp.vue -->
<template>
  <div id="memory-app" :class="{ active: isOpen }">
    <div class="memory-container">
      <!-- ===== 顶栏 ===== -->
      <div class="memory-header">
        <div class="title-group">
          <!-- --- 新增功能：去除 Emoji，极简标题 开始 --- -->
          <div class="memory-title">
            记忆库
          
          </div>
          <!-- --- 结束 --- -->
          <span class="memory-sub"></span>
        </div>
        <div class="action-btn" @click="$emit('close')">
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12" stroke-width="1.8" />
          </svg>
          关闭
        </div>
      </div>

      <!-- --- 新增功能：横向滚动头像选择器 开始 --- -->
      <div class="avatar-scroller">
        <!-- 动态循环联系人，优先显示备注，没头像则用极简灰底 -->
        <div 
          v-for="contact in contacts" 
          :key="contact.id"
          class="avatar-item"
          :class="{ active: activeCharId === contact.id }"
          @click="activeCharId = contact.id"
        >
          <div class="avatar-img" :style="contact.avatar ? `background-image: url(${contact.avatar})` : 'background: #e0e0e0;'"></div>
          <span class="avatar-name">{{ contact.settings?.remark || contact.name }}</span>
        </div>
        <!-- 如果数据库为空的防空白提示 -->
        <div v-if="contacts.length === 0" style="font-size:12px; color:#999; margin:auto;">暂无角色，请先创建联系人</div>
      </div>
      <!-- --- 结束 --- -->

      <!-- ===== Tab 导航 ===== -->
      <div class="tab-bar">
        <!-- --- 新增功能：去除 Emoji，替换为极简线条 SVG 开始 --- -->
        <div class="tab-item" :class="{ active: activeTab === 'narrative' }" @click="activeTab = 'narrative'">
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          叙事记忆
        </div>
        <div class="tab-item" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          关于你
        </div>
        <div class="tab-item" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          管理
        </div>
        <!-- --- 结束 --- -->
      </div>

  

      <!-- ===== 内容区域 (暂用你提供的静态排版占位) ===== -->
      <div class="tab-content-wrapper">
         <!-- Tab 1: 叙事流 -->
        <div class="tab-content" v-show="activeTab === 'narrative'">
          <!-- --- 新增功能：真实叙事流数据绑定 增加安全问号防崩溃 开始 --- -->
          <div v-if="activeCharId">
            <div class="global-summary">
              <div class="global-summary-header">
                <span class="label">
                  <svg viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z" stroke-width="2"/><path d="M4 9h16" stroke-width="2"/><path d="M4 15h16" stroke-width="2"/><path d="M9 4v16" stroke-width="2"/><path d="M15 4v16" stroke-width="2"/></svg>全局摘要
                </span>
              </div>
              <div class="global-summary-text">
                {{ narrativeData?.long?.length > 0 ? narrativeData.long[narrativeData.long.length - 1].text : (narrativeData?.short?.length > 0 ? narrativeData.short[narrativeData.short.length - 1].text : '暂无记忆摘要，TA正在默默观察中...') }}
              </div>
              <div class="global-summary-meta">
                <span>基于 {{ narrativeData?.long?.length || 0 }} 个大总结</span><span>·</span><span>共有 {{ narrativeData?.short?.length || 0 }} 个待合并记忆碎片</span>
              </div>
            </div>
            <!-- 未合并的近期散落记忆 -->
            <div class="summary-group" v-if="narrativeData?.short?.length > 0">
              <div class="summary-card">
                <div class="summary-card-header" @click="toggleSummary('unmerged')">
                  <div class="left"><span class="arrow" :class="{ open: summaryFoldState['unmerged'] }">▶</span><span class="title">近期散落记忆 (待合并)</span></div>
                  <span class="meta">{{ narrativeData.short.length }} 个片段</span>
                </div>
                <div class="summary-card-body" v-show="summaryFoldState['unmerged']">
                  <div class="text">这些是最近发生、但还未融合成大章节的记忆碎片。</div>
                  <div class="child-summaries">
                    <div class="child-item" v-for="ss in narrativeData.short" :key="ss.id">
                      <span class="dot">●</span><span>{{ ss.text }}</span><span class="time-tag">{{ formatTime(ss.timestamp) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 历史大总结卡片 (按时间倒序) -->
            <div class="summary-group" v-for="(ls, index) in (narrativeData?.long || []).slice().reverse()" :key="ls.id">
              <div class="summary-card">
                <div class="summary-card-header" @click="toggleSummary(ls.id)">
                  <div class="left">
                    <span class="arrow" :class="{ open: summaryFoldState[ls.id] }">▶</span>
                    <span class="title">大总结 卷{{ (narrativeData?.long?.length || 0) - index }}</span>
                  </div>
                  <span class="meta">{{ ls.children ? ls.children.length : 0 }} 个片段</span>
                </div>
                <div class="summary-card-body" v-show="summaryFoldState[ls.id]">
                  <div class="text">{{ ls.text }}</div>
                  <div class="sub-meta" style="margin-top:8px;">包含以下原始剧情碎片：</div>
                  <div class="child-summaries" v-if="ls.children">
                    <div class="child-item" v-for="child in ls.children" :key="child.id">
                      <span class="dot">●</span><span>{{ child.text }}</span><span class="time-tag">{{ formatTime(child.timestamp) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 空状态 -->
            <div v-if="!narrativeData?.long?.length && !narrativeData?.short?.length" style="font-size:12px; color:#999; text-align:center; padding: 20px;">
              你们的故事才刚刚开始，多聊聊吧~
            </div>
          </div>
          <!-- --- 结束 --- -->
        </div>
           <!-- Tab 2: 用户画像 -->
        <div class="tab-content" v-show="activeTab === 'profile'">
          <!-- --- 新增功能：动态标签墙与长按删除 开始 --- -->
          <div class="filter-bar" v-if="activeCharId">
            <span class="filter-chip" :class="{ active: activeFilter === '全部' }" @click="activeFilter = '全部'">
              全部 <span class="count">{{ profileTags.length }}</span>
            </span>
            <span class="filter-chip" v-for="cat in filterOptions" :key="cat" :class="{ active: activeFilter === cat }" @click="activeFilter = cat">
              {{ cat }} <span class="count">{{ profileTags.filter(t => t.category === cat).length }}</span>
            </span>
          </div>
          
          <div class="tag-wall" v-if="activeCharId">
            <div 
              v-for="tag in filteredAndSortedTags" :key="tag.id"
              class="tag-card" :class="{ pending: tag.status === 'pending' }"
              @touchstart="startPress(tag.id, tag.status)" @touchend="cancelPress" 
              @mousedown="startPress(tag.id, tag.status)" @mouseup="cancelPress" @mouseleave="cancelPress"
            >
              <div class="tag-category">{{ tag.category }}</div>
              <div class="tag-content">{{ tag.content }}</div>
              <div class="tag-source">{{ tag.status === 'pending' ? '待确认 · 刚抓取' : '已确认 · 长期记忆' }}</div>
              
              <div class="pending-actions" v-if="tag.status === 'pending'">
                <button class="confirm" @click="handleTagAction(tag.id, 'confirm')">✓ 确认</button>
                <button @click="handleTagAction(tag.id, 'ignore')">✕ 忽略</button>
              </div>
            </div>
            
            <!-- 空状态提示 -->
            <div v-if="filteredAndSortedTags.length === 0" style="font-size:12px; color:#999; margin-top:20px; grid-column: 1/-1;">
              暂无专属记忆标签
            </div>
          </div>
          
          <div class="add-tag-btn" v-if="activeCharId" @click="openAddTag">
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;stroke-width:2;fill:none;"><path d="M12 5v14M5 12h14"/></svg>新建标签
          </div>
          <!-- --- 结束 --- -->
        
        
        
        
        </div>

        <!-- Tab 3: 管理 -->
           <div class="tab-content" v-show="activeTab === 'settings'">
          <div style="font-size:0.85rem;font-weight:500;color:#1a1a1a;margin-bottom:0.6rem;">管理设置</div>
          
               <!-- --- 新增功能：套用黑白撞色 setting-card 样式 开始 --- -->
            <!-- 模块 1：API 驱动选择 -->
            <div class="setting-card">
              <div class="setting-card-title">后台总结驱动 API</div>
              <select v-model="memorySettings.apiId" @change="saveMemorySettings" class="memory-select">
                <option v-for="api in apiList" :key="api.id" :value="api.id">{{ api.name }}</option>
                <option v-if="apiList.length === 0" value="">请先在设置中添加API</option>
              </select>
            </div>

            <!-- 模块 2：触发阈值 -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
              <div class="setting-card" style="margin-bottom: 0;">
                <div class="setting-card-title">小总结间隔</div>
                <div style="display:flex;align-items:center;gap:0.4rem;">
                  <input type="number" v-model="memorySettings.shortSummaryInterval" @blur="saveMemorySettings" class="memory-num-input">
                  <span style="font-size:0.7rem;color:#8a8a8a;font-weight:500;white-space:nowrap;">条消息</span>
                </div>
              </div>
              <div class="setting-card" style="margin-bottom: 0;">
                <div class="setting-card-title">大总结合并</div>
                <div style="display:flex;align-items:center;gap:0.4rem;">
                  <input type="number" v-model="memorySettings.longSummaryThreshold" @blur="saveMemorySettings" class="memory-num-input">
                  <span style="font-size:0.7rem;color:#8a8a8a;font-weight:500;white-space:nowrap;">个小总结</span>
                </div>
              </div>
            </div>

            <!-- 模块 3：自定义 Prompt -->
            <div class="setting-card">
              <div class="setting-card-title">记忆萃取法则 (自定义 Prompt)</div>
              <textarea v-model="memorySettings.customPrompt" @blur="saveMemorySettings" class="memory-textarea" placeholder="留空使用默认法则：作为客观的时光记录者，请以第三人称上帝视角提炼互动回忆。要求：1.点明时间与起因。2.客观记述情感起伏与抛出的重要信息。3.不少于30字，细节生动具体。"></textarea>
            </div>
            <!-- --- 结束 --- -->


             <!-- --- 新增功能：上帝视角监控雷达 UI 开始 --- -->
            <div style="background: #111; border-radius: 12px; padding: 1rem; margin-top: 0.5rem; border: 2px solid #1a1a1a; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
              <div style="font-size: 0.6rem; color: #4ade80; font-family: monospace; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 6px;">
                <span class="dot-pulse" style="background: #4ade80;"></span> System Radar Active
              </div>
              <div style="font-size: 0.75rem; color: #e2e8f0; font-family: monospace; line-height: 1.6;">
                > 引擎状态: <span style="color: #4ade80;">静默潜伏中...</span><br>
                > 当前累计未总结气泡: <span style="color: #fbbf24; font-weight: bold; font-size: 0.9rem;">{{ currentMsgCount }}</span> / {{ memorySettings.shortSummaryInterval || 50 }}<br>
                <span v-if="currentMsgCount >= (memorySettings.shortSummaryInterval || 50)" style="color: #f87171; animation: flash 1s infinite;">> ⚠️ 阈值突破！后台总结进程已点火...</span>
                <span v-else style="color: #94a3b8;">> 进度: {{ Math.min(100, Math.round((currentMsgCount / (memorySettings.shortSummaryInterval || 50)) * 100)) }}% [等待触发]</span>
              </div>
            </div>
            <!-- --- 结束 --- -->
  
        </div>
      </div>
    
    </div>
  </div>


 <!-- --- 新增功能：新建羁绊标签 黑白极简弹窗 开始 --- -->
      <div class="modal-overlay" :class="{ active: isAddTagOpen }" style="z-index: 300;">
        <div class="modal-box" style="width: 85%; max-width: 320px; border: 2px solid #1a1a1a; border-radius: 20px; box-shadow: 8px 8px 0 #1a1a1a;">
          <div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px;">新建专属标签</div>
          
          <!-- 分类下拉 -->
          <div style="text-align: left; margin-bottom: 10px;">
            <div style="font-size: 10px; font-weight: 600; color: #8a8a8a; margin-bottom: 4px;">选择分类</div>
            <select v-model="newTag.category" style="width: 100%; border: 2px solid #e0e0e0; border-radius: 12px; padding: 8px; font-size: 13px; font-weight: 500; outline: none;">
              <option v-for="cat in filterOptions" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          
          <!-- 内容输入带字数限制 -->
          <div style="text-align: left; margin-bottom: 20px; position: relative;">
            <div style="font-size: 10px; font-weight: 600; color: #8a8a8a; margin-bottom: 4px;">标签内容 (限30字)</div>
            <input type="text" v-model="newTag.content" maxlength="30" style="width: 100%; border: 2px solid #e0e0e0; border-radius: 12px; padding: 10px; font-size: 14px; font-weight: 500; outline: none; transition: 0.2s;" placeholder="如：不吃香菜 / 叫我宝宝">
            <span style="position: absolute; right: 10px; bottom: 10px; font-size: 10px; color: #b0b0b0;">{{ newTag.content.length }}/30</span>
          </div>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1; padding: 10px; border-radius: 40px; font-size: 13px; font-weight: 600; cursor: pointer; border: 2px solid #d0d0d0; color: #4a4a4a;" @click="isAddTagOpen = false">取消</div>
            <div style="flex: 1; padding: 10px; border-radius: 40px; font-size: 13px; font-weight: 600; cursor: pointer; background: #1a1a1a; color: #fff; border: 2px solid #1a1a1a;" @click="confirmAddTag">确认新建</div>
          </div>
        </div>
      </div>
      <!-- --- 结束 --- -->


</template>

<script setup>

import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { initDB } from '../utils/db.js'

const props = defineProps({
  isOpen: Boolean
})
const emit = defineEmits(['close'])

const activeTab = ref('narrative')
const contacts = ref([])
const activeCharId = ref(null)

// --- 新增功能：上帝视角监控雷达变量 开始 ---
const currentMsgCount = ref(0)
let radarTimer = null

const startRadar = () => {
  if (radarTimer) clearInterval(radarTimer)
  radarTimer = setInterval(async () => {
    if (!activeCharId.value) return
    const db = await initDB()
    const data = await new Promise(res => {
      db.transaction(['memory_db'], 'readonly').objectStore('memory_db').get(activeCharId.value).onsuccess = e => res(e.target.result)
    })
    if (data && data.narrative) {
      currentMsgCount.value = data.narrative.unsummarizedMsgCount || 0
    }
  }, 1500) // 每1.5秒偷偷看一眼底层计数器
}

onMounted(() => {
  startRadar()
})

onUnmounted(() => {
  if (radarTimer) clearInterval(radarTimer)
})
// --- 结束 ---

// --- 新增功能：记忆库设置状态与静默保存逻辑 开始 ---
const apiList = ref([])
const memorySettings = ref({
  apiId: '',
  shortSummaryInterval: 50,
  longSummaryThreshold: 5,
  customPrompt: ''
})
// 拉取 API 列表用于下拉框
const loadApiList = async () => {
  const db = await initDB()
  const list = await new Promise(res => {
    db.transaction(['api_profiles'], 'readonly').objectStore('api_profiles').getAll().onsuccess = e => res(e.target.result || [])
  })
  apiList.value = list
}
// 切换角色时，读取对应的记忆设置
const loadMemorySettings = async (charId) => {
  if (!charId) return
  const db = await initDB()
  const data = await new Promise(res => {
    db.transaction(['memory_db'], 'readonly').objectStore('memory_db').get(charId).onsuccess = e => res(e.target.result)
  })
  if (data && data.settings) {
    memorySettings.value = { ...memorySettings.value, ...data.settings }
  } else {
    // 没设置过就给默认值
    memorySettings.value = { apiId: apiList.value[0]?.id || '', shortSummaryInterval: 50, longSummaryThreshold: 5, customPrompt: '' }
  }
}
// 核心：失焦瞬间全自动存入数据库
const saveMemorySettings = async () => {
  if (!activeCharId.value) return
  const db = await initDB()
  const tx = db.transaction(['memory_db'], 'readwrite')
  const store = tx.objectStore('memory_db')
  const data = await new Promise(res => store.get(activeCharId.value).onsuccess = e => res(e.target.result)) || { charId: activeCharId.value, narrative: [], profile: [] }
  
  data.settings = JSON.parse(JSON.stringify(memorySettings.value))
  await new Promise(res => { store.put(data).onsuccess = res })
}

// --- 新增功能：羁绊画像核心引擎 开始 ---
const profileTags = ref([]) // 存储当前角色的所有标签
const activeFilter = ref('全部') // 当前选中的分类
/* --- 新增功能：升级为高羁绊情感分类 开始 --- */
const filterOptions = ['核心档案', '约定', '生活', '雷区', '情感', '世界观']
/* --- 结束 --- */

// 智能排序与过滤引擎（Pending 置顶，Confirmed 按时间倒序）
const filteredAndSortedTags = computed(() => {
  let list = profileTags.value || []
  if (activeFilter.value !== '全部') {
    list = list.filter(t => t.category === activeFilter.value)
  }
  return list.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
    return b.timestamp - a.timestamp
  })
})

// 读取并更新记忆数据 (统一包装函数)
const updateProfileToDB = async (newList) => {
  if (!activeCharId.value) return
  profileTags.value = newList
  const db = await initDB()
  const tx = db.transaction(['memory_db'], 'readwrite')
  const store = tx.objectStore('memory_db')
  const data = await new Promise(res => store.get(activeCharId.value).onsuccess = e => res(e.target.result)) || { charId: activeCharId.value, narrative: { short:[], long:[] }, profile: [] }
  data.profile = JSON.parse(JSON.stringify(newList))
  await new Promise(res => { store.put(data).onsuccess = res })
}

// --- 新增功能：叙事流变量与折叠控制 开始 ---
const narrativeData = ref({ short: [], long: [], unsummarizedMsgCount: 0 })
const summaryFoldState = ref({})

const toggleSummary = (id) => {
  summaryFoldState.value[id] = !summaryFoldState.value[id]
}

const formatTime = (ts) => {
  const d = new Date(ts)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
// --- 结束 ---

// 独立读取记忆库数据 (升级为同时读取叙事流)
const loadProfileData = async (charId) => {
  if (!charId) return
  const db = await initDB()
  const data = await new Promise(res => {
    db.transaction(['memory_db'], 'readonly').objectStore('memory_db').get(charId).onsuccess = e => res(e.target.result)
  })
  profileTags.value = data?.profile || []
  narrativeData.value = data?.narrative || { short: [], long: [], unsummarizedMsgCount: 0 }
}

// 状态扭转：确认或忽略
const handleTagAction = async (tagId, action) => {
  let list = [...profileTags.value]
  if (action === 'confirm') {
    let tag = list.find(t => t.id === tagId)
    if (tag) { tag.status = 'confirmed'; tag.timestamp = Date.now() } // 确认后更新时间，排到已确认最前面
  } else if (action === 'ignore') {
    list = list.filter(t => t.id !== tagId)
  }
  await updateProfileToDB(list)
}

// 长按删除引擎 (无震动版)
let pressTimer = null
const startPress = (tagId, status) => {
  if (status !== 'confirmed') return
  pressTimer = setTimeout(() => {
    if (window.confirm('确定删除这条专属记忆吗？')) {
      let list = profileTags.value.filter(t => t.id !== tagId)
      updateProfileToDB(list)
    }
  }, 800)
}
const cancelPress = () => { if (pressTimer) clearTimeout(pressTimer) }

// 新建标签弹窗引擎
const isAddTagOpen = ref(false)
/* --- 新增功能：更新新建标签默认分类 开始 --- */
const newTag = ref({ category: '核心档案', content: '' })

const openAddTag = () => {
  newTag.value = { category: '核心档案', content: '' }
  isAddTagOpen.value = true
}
/* --- 结束 --- */
const confirmAddTag = async () => {
  if (!newTag.value.content.trim()) return alert('内容不能为空哦！')
  let list = [...profileTags.value]
  list.push({
    id: 'tag_' + Date.now(), category: newTag.value.category, 
    content: newTag.value.content.trim(), status: 'confirmed', timestamp: Date.now()
  })
  await updateProfileToDB(list)
  isAddTagOpen.value = false
}
// --- 结束 ---

// 监听当前选中的头像，随时切换数据
watch(activeCharId, (newId) => {
  if (newId) {
    loadMemorySettings(newId)
    loadProfileData(newId) // 切换角色时同步加载画像
  }
})

const loadContacts = async () => {
  const db = await initDB()
  const list = await new Promise(res => {
    db.transaction(['contacts_profiles'], 'readonly')
      .objectStore('contacts_profiles')
      .getAll().onsuccess = e => res(e.target.result || [])
  })
  contacts.value = list
  // 如果当前没选中任何人，且列表有数据，默认选中第一个角色
  if (list.length > 0 && !list.find(c => c.id === activeCharId.value)) {
    activeCharId.value = list[0].id
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) loadContacts()
})

onMounted(() => {
  // --- 新增功能：初始化时拉取一次 API 列表 开始 ---
  loadApiList()
  // --- 结束 ---
  loadContacts()
})
// --- 结束 ---
</script>

<style scoped>


/* --- 新增功能：黑白撞色 全屏布局与顶栏、Tab 样式 开始 --- */
#memory-app {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: #ffffff; 
  z-index: 60; display: flex; flex-direction: column;
  transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}
#memory-app.active { transform: translateY(0); }

.memory-container {
  width: 100%; max-width: none; border-radius: 0;
  padding: max(50px, calc(env(safe-area-inset-top) + 20px)) 1.6rem 1.5rem 1.6rem;
  border: none; box-shadow: none; display: flex; flex-direction: column;
  background-image: linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 28px 28px; background-position: -1px -1px;
  /* --- 新增功能：打上死锁，绝对禁止容器撑出屏幕外导致滑动失效 开始 --- */
  flex: 1; min-height: 0; overflow: hidden;
  /* --- 结束 --- */
}

/* 保持头像滚动功能样式 */
/* --- 新增功能：加上 flex-shrink: 0 锁死高度，防止被内容挤压 开始 --- */
.avatar-scroller { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 15px; scrollbar-width: none; flex-shrink: 0; }
/* --- 结束 --- */
.avatar-scroller::-webkit-scrollbar { display: none; }
.avatar-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; opacity: 0.5; transition: 0.3s; }
.avatar-item.active { opacity: 1; }
.avatar-img { width: 44px; height: 44px; border-radius: 50%; background-size: cover; background-position: center; border: 2px solid transparent; }
.avatar-item.active .avatar-img { border-color: #1a1a1a; }
.avatar-name { font-size: 11px; font-weight: 600; color: #1a1a1a; white-space: nowrap; }

/* --- 新增功能：加上 flex-shrink: 0 锁死顶栏高度 开始 --- */
.memory-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; margin-bottom: 1.6rem; border-bottom: 2px solid #1a1a1a; flex-shrink: 0; }
/* --- 结束 --- */
.title-group { display: flex; align-items: baseline; gap: 0.6rem; }
.memory-title { font-weight: 600; font-size: 1.6rem; color: #1a1a1a; display: flex; align-items: center; gap: 0.5rem; letter-spacing: -0.02em; }
.badge-count { font-size: 0.7rem; font-weight: 500; color: #ffffff; background: #1a1a1a; padding: 0.05rem 0.7rem; border-radius: 40px; border: 1.5px solid #1a1a1a; }
.memory-sub { font-size: 0.7rem; color: #8a8a8a; border-left: 2px solid #d0d0d0; padding-left: 0.8rem; letter-spacing: 0.03em; }
.action-btn { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 500; color: #ffffff; background: #1a1a1a; padding: 0.35rem 1.2rem 0.35rem 1rem; border-radius: 40px; border: 2px solid #1a1a1a; cursor: pointer; transition: background 0.15s, color 0.15s; }
.action-btn svg { width: 16px; height: 16px; stroke: #ffffff; stroke-width: 2; fill: none; }
.action-btn:hover { background: #ffffff; color: #1a1a1a; }
.action-btn:hover svg { stroke: #1a1a1a; }

/* --- 新增功能：优化 Tab 间距与尺寸，强制完美同处一行 开始 --- */
.tab-bar { 
  display: flex; justify-content: space-between; gap: 0; 
  border-bottom: 2px solid #1a1a1a; margin-bottom: 1.8rem; padding-bottom: 0; flex-shrink: 0; 
}
.tab-item { 
  flex: 1; /* 核心魔法：让三个标签绝对平分屏幕宽度 */
  justify-content: center; /* 内部居中对齐 */
  white-space: nowrap; 
  padding: 0.4rem 0.2rem 0.5rem; /* 大幅缩小左右内边距，腾出空间 */
  font-size: 0.75rem; /* 字体微微调小一点点，更加精致 */
  font-weight: 500; color: #8a8a8a; border-bottom: 3px solid transparent; cursor: pointer; display: flex; align-items: center; gap: 0.2rem; background: transparent; border-radius: 8px 8px 0 0; transition: 0.15s; 
}
.tab-item.active { color: #1a1a1a; border-bottom-color: #1a1a1a; background: #f5f5f5; }
.tab-item svg { width: 14px; height: 14px; margin-right: 0; flex-shrink: 0; }
.tab-count { font-size: 0.55rem; font-weight: 500; background: #1a1a1a; padding: 0.05rem 0.4rem; border-radius: 30px; color: #ffffff; flex-shrink: 0; }
.tab-item.active .tab-count { background: #1a1a1a; color: #ffffff; }
/* --- 结束 --- */

/* --- 新增功能：完美解决内容滑动与底部遮挡 开始 --- */
.tab-content-wrapper { 
  flex: 1 1 0; 
  min-height: 0; 
  overflow-y: auto; 
  /* 加厚底垫，并且适配苹果/安卓的全面屏底部安全区 (safe-area) */
  padding-bottom: max(80px, calc(env(safe-area-inset-bottom) + 50px)); 
}
.tab-content-wrapper::-webkit-scrollbar { 
  display: none; 
}
.tab-content {
  padding-bottom: 20px; /* 保证内部元素本身不贴底 */
}
/* --- 结束 --- */


/* --- 新增功能：黑白撞色 卡片、标签与表单样式 开始 --- */
.global-summary { background: #1a1a1a; border-radius: 20px; padding: 1.2rem 1.4rem; margin-bottom: 1.6rem; border: 2px solid #1a1a1a; }
.global-summary-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
.global-summary-header .label { font-size: 0.7rem; font-weight: 500; color: #b0b0b0; display: flex; align-items: center; gap: 0.4rem; letter-spacing: 0.04em; }
.global-summary-header .label svg { width: 16px; height: 16px; stroke: #b0b0b0; stroke-width: 2; fill: none; }
.global-summary-header .action-link { font-size: 0.65rem; color: #8a8a8a; border-bottom: 1px dashed #5a5a5a; padding-bottom: 0.05rem; }
.global-summary-text { font-size: 0.92rem; line-height: 1.6; color: #f0f0f0; letter-spacing: -0.01em; }
.global-summary-meta { font-size: 0.6rem; color: #7a7a7a; margin-top: 0.4rem; display: flex; gap: 1rem; }

.summary-group { margin-bottom: 0.8rem; }
.summary-card { background: #ffffff; border-radius: 20px; padding: 1rem 1.2rem; border: 2px solid #1a1a1a; transition: background 0.2s, transform 0.15s; cursor: pointer; }
.summary-card:hover { background: #f8f8f8; transform: translateX(2px); }
.summary-card-header { display: flex; justify-content: space-between; align-items: center; }
.summary-card-header .left { display: flex; align-items: center; gap: 0.6rem; }
.summary-card-header .arrow { font-size: 0.7rem; color: #1a1a1a; transition: transform 0.2s; display: inline-block; }
.summary-card-header .arrow.open { transform: rotate(90deg); }
.summary-card-header .title { font-size: 0.85rem; font-weight: 600; color: #1a1a1a; }
.summary-card-header .meta { font-size: 0.6rem; color: #8a8a8a; background: #f0f0f0; padding: 0.1rem 0.7rem; border-radius: 30px; border: 1px solid #d0d0d0; letter-spacing: 0.02em; }
.summary-card-body { margin-top: 0.5rem; padding-left: 1.8rem; }
.summary-card-body .text { font-size: 0.85rem; line-height: 1.6; color: #1a1a1a; }
.child-summaries { margin-top: 0.6rem; padding-left: 1rem; border-left: 3px solid #1a1a1a; }
.child-item { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.3rem 0; font-size: 0.78rem; color: #2a2a2a; border-bottom: 1px solid #f0f0f0; }
.child-item:last-child { border-bottom: none; }

.filter-bar { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.4rem; }
.filter-chip { font-size: 0.7rem; font-weight: 500; padding: 0.25rem 0.9rem 0.25rem 0.7rem; border-radius: 40px; background: #ffffff; border: 2px solid #d0d0d0; color: #7a7a7a; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; transition: 0.15s; }
.filter-chip.active { background: #1a1a1a; border-color: #1a1a1a; color: #ffffff; }
.filter-chip .count { font-size: 0.55rem; background: #eaeaea; padding: 0.05rem 0.4rem; border-radius: 30px; color: #5a5a5a; }
.filter-chip.active .count { background: #3a3a3a; color: #ffffff; }

/* --- 新增功能：绝对双列 Grid 交错便利贴墙 开始 --- */
.tag-wall { 
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 强制绝对平分左右两列 */
  gap: 0.8rem; 
  margin-bottom: 1.2rem; 
  padding: 0.5rem 0 2rem 0; /* 底部多留出空间，防止右侧卡片下移被遮挡 */
  align-items: start; /* 让每张卡片保持自身真实高度，绝不互相拉伸 */
}

.tag-card { 
  width: 100%; 
  background: #ffffff; 
  border-radius: 6px; 
  padding: 1rem 0.9rem; 
  border: 1.5px solid #1a1a1a; 
  box-shadow: 4px 6px 0px rgba(26, 26, 26, 0.9); 
  /* 已彻底删除 transition 和 hover 动画，让纸片安静地死死贴在墙上 */
}

/* 单数（左边列）向左微倾斜 */
.tag-card:nth-child(odd) {
  transform: rotate(-1.5deg);
}
/* 双数（右边列）向右微倾斜，并向下错开一段距离，形成错落有致的高低咬合感 */
.tag-card:nth-child(even) {
  transform: rotate(2deg) translateY(1.5rem);
}
/* --- 结束 --- */

.tag-category { font-size: 0.55rem; font-weight: 600; color: #8a8a8a; text-transform: uppercase; margin-bottom: 0.2rem; letter-spacing: 0.05em; }
.tag-content { font-size: 0.85rem; font-weight: 500; color: #1a1a1a; line-height: 1.4; }
.tag-source { font-size: 0.55rem; font-weight: 400; color: #b0b0b0; margin-top: 0.3rem; border-top: 2px solid #f0f0f0; padding-top: 0.3rem; }
.tag-card.pending { border: 2px dashed #1a1a1a; background: #fafafa; opacity: 0.9; }
.pending-actions { display: flex; gap: 0.4rem; margin-top: 0.4rem; }
.pending-actions button { font-size: 0.6rem; font-weight: 500; padding: 0.1rem 0.7rem; border-radius: 30px; border: 2px solid #d0d0d0; background: #ffffff; color: #4a4a4a; }
.pending-actions button.confirm { border-color: #1a1a1a; background: #1a1a1a; color: #ffffff; }
.add-tag-btn { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 500; color: #1a1a1a; padding: 0.4rem 1.2rem; border-radius: 40px; border: 2px dashed #1a1a1a; background: transparent; cursor: pointer; }

.setting-card { background: #ffffff; border-radius: 18px; padding: 0.8rem 1rem; border: 2px solid #1a1a1a; margin-bottom: 1rem; }
.setting-card-title { font-size: 0.6rem; font-weight: 600; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.4rem; }
.memory-select { width: 100%; border: none; background: transparent; outline: none; font-size: 0.85rem; font-weight: 500; color: #1a1a1a; cursor: pointer; padding: 2px 0; }
.memory-num-input { width: 45px; border: none; background: transparent; outline: none; font-size: 1.1rem; font-weight: 600; color: #1a1a1a; text-align: center; border-bottom: 2px solid #d0d0d0; padding: 2px; }
.memory-num-input:focus { border-bottom-color: #1a1a1a; }
.memory-num-input::-webkit-outer-spin-button, .memory-num-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.memory-textarea { width: 100%; height: 90px; border: none; background: transparent; outline: none; font-size: 0.8rem; font-weight: 500; color: #1a1a1a; resize: none; line-height: 1.5; padding: 2px 0; }
.memory-textarea::placeholder { color: #b0b0b0; font-weight: 400; }

/* --- 新增功能：补全弹窗基础悬浮与隐藏 CSS 开始 --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(5px);
  display: flex; justify-content: center; align-items: center;
  opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
}
.modal-overlay.active {
  opacity: 1; pointer-events: auto;
}
.modal-box {
  background: #ffffff; padding: 20px;
  transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.modal-overlay.active .modal-box {
  transform: scale(1);
}
/* --- 结束 --- */


</style>