<!-- components/CharSettingsApp.vue -->

<template>
  <div id="char-settings-app" :class="{ active: isOpen }">
    <div class="simple-header">
      <div class="header-btn" @click="closeSettings">‹ 返回</div>
      <div class="header-title">TA 的设定</div>
      <div class="header-btn" @click="saveSettings">保存</div>
    </div>

    <div class="cs-scroll-area" v-if="contact">
      <!-- 卡片一：💌 基础与羁绊 -->
      <div class="cs-card">
        <div class="cs-card-title">基础与羁绊</div>
        <div class="cs-row">
          <div class="cs-label">备注名称</div>
          <input type="text" class="cs-input-text" v-model="form.remark" placeholder="输入专属称呼">
        </div>
         <div class="cs-row link" @click="triggerOpenDiary">
          <div class="cs-label">TA 的手账本</div>
          <div class="cs-arrow">打开 ></div>
        </div>
        <div class="cs-row link" @click="triggerOpenMail">
          <div class="cs-label">TA 的邮箱</div>
          <div class="cs-arrow">打开 ></div>
        </div>
      </div>

      <!-- 卡片二：🧠 核心灵魂 -->
      <div class="cs-card">
        <div class="cs-card-title">核心灵魂</div>
        <div class="cs-row">
          <div class="cs-label">专属驱动模型 (API)</div>
          <select class="cs-select" v-model="form.apiId">
            <option value="">未绑定 (使用默认)</option>
            <option v-for="api in apiList" :key="api.id" :value="api.id">{{ api.name }}</option>
          </select>
        </div>
        
        <!-- 这里是你之前替换的地方，现在已经修复对齐了 -->
        <div class="cs-row link" @click="openWbModal">
          <div class="cs-label">世界书接入</div>
          <div class="cs-arrow">去配置 ></div>
        </div>

        <div class="cs-row">
          <div class="cs-label">
            角色语言
            <div class="cs-sub-label">非中文自带原文+翻译气泡</div>
          </div>
              <select class="cs-select" v-model="form.language">
            <!-- 基础语种 -->
            <option value="中文">🇨🇳 中文</option>
            <option value="English">🇬🇧 English (英语)</option>
            <option value="日本語">🇯🇵 日本語 (日语)</option>
            <option value="한국語">🇰🇷 한국語 (韩语)</option>
            
            <!-- 新增扩充外语 -->
            <option value="Français">🇫🇷 Français (法语)</option>
            <option value="Русский">🇷🇺 Русский (俄语)</option>
            <option value="Deutsch">🇩🇪 Deutsch (德语)</option>
            <option value="Español">🇪🇸 Español (西班牙语)</option>
            <option value="ภาษาไทย">🇹🇭 ภาษาไทย (泰语)</option>
            <option value="Tiếng Việt">🇻🇳 Tiếng Việt (越南语)</option>
            <option value="Italiano">🇮🇹 Italiano (意大利语)</option>
            <option value="العربية">🇸🇦 العربية (阿拉伯语)</option>

            <!-- 华语方言/文风 -->
            <option value="繁体中文">🇹🇼 繁体中文</option>
            <option value="粤语">粤语</option>
            <option value="四川话">四川话</option>
            <option value="东北话">东北话</option>
            <option value="北京话">北京话</option>
            <option value="上海话">上海话</option>
            <option value="文言文">古文言文</option>
             <option value="现代古风小生">古风小生</option>
          </select>
        </div>
      </div>

      <!-- 卡片三：🎭 行为与界限 -->
      <div class="cs-card">
        <div class="cs-card-title">行为与界限</div>
        <div class="cs-row">
          <div class="cs-label">允许自主换头像</div>
          <label class="switch"><input type="checkbox" v-model="form.autoAvatar"><span class="slider"></span></label>
        </div>
        <div class="cs-row">
          <div class="cs-label">允许已读不回</div>
          <label class="switch"><input type="checkbox" v-model="form.ignoreMsg"><span class="slider"></span></label>
        </div>
        <div class="cs-row">
          <div class="cs-label">禁止主动打电话</div>
          <label class="switch"><input type="checkbox" v-model="form.noCall"><span class="slider"></span></label>
        </div>
        <div class="cs-row" style="border:none;">
          <div class="cs-label">禁止见面 (网恋模式)</div>
          <label class="switch"><input type="checkbox" v-model="form.noMeet"><span class="slider"></span></label>
        </div>
      </div>

      <!-- 卡片四：💭 记忆与思维 -->
      <div class="cs-card">
        <div class="cs-card-title">记忆与思维</div>
        <div class="cs-row">
          <div class="cs-label">底层思维链 (CoT)</div>
          <label class="switch"><input type="checkbox" v-model="form.useCot"><span class="slider"></span></label>
        </div>
        <div class="cs-row">
          <div class="cs-label">显示思维逻辑气泡</div>
          <label class="switch"><input type="checkbox" v-model="form.showCot"><span class="slider"></span></label>
        </div>
        
        <div v-show="form.useCot" style="padding-top:10px; border-top:1px dashed rgba(0,0,0,0.1); margin-top:10px; margin-bottom:10px;">
          <div class="cs-label" style="margin-bottom:6px;">专属思维指导词</div>
          <textarea class="setting-textarea" style="height:80px;" v-model="form.cotPrompt" placeholder="留空则使用默认思维链接..."></textarea>
        </div>
        
        <div class="cs-slider-container">
          <div class="cs-slider-header">
            <div>角色参考记忆 (轮数)<div class="cs-sub-label">每次最多回顾多少历史消息</div></div>
            <input type="number" class="cs-number-box" v-model.number="form.memoryNum" min="0" max="500">
          </div>
          <input type="range" min="0" max="500" v-model.number="form.memoryNum">
        </div>

        <div class="cs-slider-container" style="border:none;">
          <div class="cs-slider-header">
            <div>角色回复气泡数<div class="cs-sub-label">单次回复切分成几条消息发送</div></div>
            <input type="number" class="cs-number-box" v-model.number="form.bubbleNum" min="1" max="15">
          </div>
          <input type="range" min="1" max="15" v-model.number="form.bubbleNum">
        </div>
      </div>

      <!-- 卡片：💌 时光邮局与掉落概率 -->
      <div class="cs-card">
        <div class="cs-card-title">邮箱掉落与时空设定</div>
        <div class="cs-row">
          <div class="cs-label">专属写信模型</div>
          <select class="cs-select" v-model="form.mailApiId">
            <option value="">同聊天模型</option>
            <option v-for="api in apiList" :key="api.id" :value="api.id">{{ api.name }}</option>
          </select>
        </div>
        <div class="cs-row">
          <div class="cs-label">写信冷却时间 (CD)</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="number" class="cs-number-box" v-model.number="form.mailCdNum" min="1">
            <select style="border:none; background:rgba(0,0,0,0.04); border-radius:8px; padding:4px 8px; font-size:13px; outline:none;" v-model="form.mailCdUnit">
              <option value="seconds">秒</option><option value="minutes">分钟</option><option value="hours">小时</option>
            </select>
          </div>
        </div>
        <div class="cs-slider-container">
          <div class="cs-slider-header"><div>日常漫时光掉落率</div><span style="font-size:12px; color:#888;">{{ form.probDaily }}%</span></div>
          <input type="range" min="0" max="100" v-model.number="form.probDaily">
        </div>
        <div class="cs-slider-container">
          <div class="cs-slider-header"><div>情绪极值破冰率</div><span style="font-size:12px; color:#888;">{{ form.probEmotion }}%</span></div>
          <input type="range" min="0" max="100" v-model.number="form.probEmotion">
        </div>
        <div class="cs-slider-container" style="border:none;">
          <div class="cs-slider-header"><div>时空邮局掉落率</div><span style="font-size:12px; color:#888;">{{ form.probSpace }}%</span></div>
          <input type="range" min="0" max="100" v-model.number="form.probSpace">
        </div>
      </div>

      <!-- 卡片五：🌍 沉浸感知 -->
      <div class="cs-card">
        <div class="cs-card-title">沉浸感知</div>
        <div class="cs-row">
          <div class="cs-label">时间感知</div>
          <label class="switch"><input type="checkbox" v-model="form.senseTime"><span class="slider"></span></label>
        </div>
        <div class="cs-row" style="border:none;">
          <div class="cs-label">环境感知 (天气)</div>
          <label class="switch"><input type="checkbox" v-model="form.senseWeather"><span class="slider"></span></label>
        </div>
      </div>

      <!-- 卡片六：📸 声音与视觉 -->
      <div class="cs-card">
        <div class="cs-card-title">声音与视觉</div>
        <div class="cs-row">
          <div class="cs-label">开启角色语音</div>
          <label class="switch"><input type="checkbox" v-model="form.voiceOn"><span class="slider"></span></label>
        </div>
        <div class="cs-row" style="border:none;">
          <div class="cs-label">触发角色生图</div>
          <label class="switch"><input type="checkbox" v-model="form.imageOn"><span class="slider"></span></label>
        </div>
        <div v-show="form.imageOn" style="padding-top:10px; border-top:1px dashed rgba(0,0,0,0.1); margin-top:10px;">
          <div class="cs-label" style="margin-bottom:6px;">生图提示词 (正向)</div>
          <textarea class="setting-textarea" style="height:60px; margin-bottom:10px;" v-model="form.promptPos" placeholder="例如：金发，蓝眼，西装，绝美画质"></textarea>
          <div class="cs-label" style="margin-bottom:6px;">生图负面词 (避雷)</div>
          <textarea class="setting-textarea" style="height:60px;" v-model="form.promptNeg" placeholder="例如：多手指，模糊，低画质"></textarea>
        </div>
      </div>

      <!-- 卡片七：⚠️ 危险地带 -->
      <div class="cs-card danger">
        <div class="cs-card-title danger-title" style="color: var(--app-text-color);">其他设置</div>
           <div class="cs-btn-group">
          <div class="cs-btn-half" @click="openImportModal">导入</div>
          <div class="cs-btn-half" @click="exportRecord">备份</div>
        </div>
        <div class="cs-row">
          <div class="cs-label" style="color: var(--app-text-color);">拉黑该角色</div>
          <label class="switch"><input type="checkbox" v-model="form.blacklist"><span class="slider"></span></label>
        </div>
        <div class="cs-btn-danger" @click="clearCharChatHistory">清除聊天记录 (仅清屏)</div>
        <div class="cs-btn-danger" @click="clearCharMemory">清除所有记忆 (重置)</div>
        <div class="cs-btn-danger solid" style="background: var(--icon-svg-color);" @click="deleteCharCompletely">彻底删除角色</div>
      </div>
    </div>

    <!-- 世界书树状挂载弹窗 (已经在最底部对齐好) -->
    <div class="modal-overlay" :class="{ active: isWbModalOpen }" style="z-index: 105;">
      <div class="modal-box" style="width: 85%; max-height: 70vh; display: flex; flex-direction: column;">
        <div class="modal-title">挂载专属世界书</div>
        
        <div style="flex: 1; overflow-y: auto; text-align: left; margin-bottom: 15px;">
          <div v-if="Object.keys(wbTreeData).length === 0" style="text-align:center; color:#999; font-size:12px; margin-top:20px;">
            仓库中还没有世界书，请先去桌面添加哦！
          </div>
          
          <div v-for="(entries, cat) in wbTreeData" :key="cat">
            <div class="wb-tree-cat" @click="toggleCat(cat)">
              <div>
                <span>{{ expandedCats[cat] ? '▼' : '▶' }}</span> {{ cat }}
                <span style="font-size:11px; font-weight:normal; color:#888;">({{ entries.length }}个设定)</span>
              </div>
              <input type="checkbox" class="wb-tree-chk" 
                     :checked="isCatAllSelected(cat)"
                     :indeterminate.prop="isCatIndeterminate(cat)"
                     @click.stop="toggleCatAll(cat, $event)">
            </div>
            
            <div class="wb-tree-children" :class="{ active: expandedCats[cat] }">
              <div class="wb-tree-item" v-for="entry in entries" :key="entry.id">
                <div><span class="wb-tag">{{ entry.triggerType === '常驻' ? '常驻' : '关键词' }}</span> {{ entry.name }}</div>
                <input type="checkbox" class="wb-tree-chk" :value="entry.id" v-model="tempSelectedWbs">
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-buttons">
          <div class="modal-btn cancel-btn" @click="closeWbModal">取消</div>
          <div class="modal-btn confirm-btn" style="background: var(--icon-svg-color);" @click="saveWbSelection">保存挂载</div>
        </div>
      </div>
    </div>


    <!-- 导入记录专属弹窗 -->
    <div class="modal-overlay" :class="{ active: isImportModalOpen }" style="z-index: 105;">
      <div class="modal-box" style="width: 85%; max-height: 70vh; display: flex; flex-direction: column;">
        <div class="modal-title" style="color:var(--app-text-color);">导入记忆档案</div>
        
        <div style="flex: 1; text-align: left; margin-bottom: 15px;">
          <div style="font-size:13px; color:#555; line-height:1.5; margin-bottom:15px;">
            导入后将直接覆盖当前的设定与历史聊天记录。请选择您之前备份的 JSON 数据文件。
          </div>
          
          <input type="file" id="import-file-upload" style="display:none;" accept=".json" @change="handleImportFileChange">
          <div class="modal-btn confirm-btn" style="background:#7a94a9; text-align:center; padding:10px; margin-bottom:10px;" @click="triggerImportUpload">
            选取备份文件
          </div>
          
          <div style="font-size:12px; color:#7a94a9; text-align:center; word-break:break-all;">
            {{ importFileName || '尚未选择文件' }}
          </div>
        </div>
        
        <div class="modal-buttons">
          <div class="modal-btn cancel-btn" @click="closeImportModal">取消</div>
          <div class="modal-btn confirm-btn" style="background:#5b6d82;" @click="confirmImport">确认导入</div>
        </div>
      </div>
    </div>




  </div>

</template>

<script setup>
import { ref, watch } from 'vue'
import { initDB } from '../utils/db.js'

const props = defineProps({ isOpen: Boolean, contact: Object })
const emit = defineEmits(['close', 'settingSaved', 'charDeleted', 'openDiary', 'openMail'])

const apiList = ref([])
const form = ref({})

// ==========================================
// 世界书弹窗专用的响应式变量
// ==========================================
const isWbModalOpen = ref(false)
const wbTreeData = ref({}) // 存放 { '分类名': [设定1, 设定2] }
const tempSelectedWbs = ref([]) // 弹窗里的临时勾选数组
const expandedCats = ref({}) // 存放哪些分类展开了 { '分类名': true/false }

watch(() => props.isOpen, async (newVal) => {
  if (newVal && props.contact) {
    const db = await initDB()
    db.transaction(['api_profiles'], 'readonly').objectStore('api_profiles').getAll().onsuccess = (e) => {
      apiList.value = e.target.result || []
    }
    const st = props.contact.settings || {}
    form.value = {
      remark: st.remark || '', apiId: st.apiId || '', language: st.language || '中文',
      mailApiId: st.mailApiId || '', mailCdNum: st.mailCdNum ?? 3, mailCdUnit: st.mailCdUnit || 'hours',
      probDaily: st.probDaily ?? 20, probEmotion: st.probEmotion ?? 80, probSpace: st.probSpace ?? 5,
      autoAvatar: !!st.autoAvatar, ignoreMsg: !!st.ignoreMsg, noCall: !!st.noCall, noMeet: !!st.noMeet,
      useCot: !!st.useCot, showCot: !!st.showCot, cotPrompt: st.cotPrompt || '',
      memoryNum: st.memoryNum ?? 50, bubbleNum: st.bubbleNum ?? 2,
      senseTime: !!st.senseTime, senseWeather: !!st.senseWeather,
      voiceOn: !!st.voiceOn, imageOn: !!st.imageOn, promptPos: st.promptPos || '', promptNeg: st.promptNeg || '',
      blacklist: !!st.blacklist, selectedWorldbooks: st.selectedWorldbooks || []
    }
  }
})

const closeSettings = () => { emit('close') }

const saveSettings = async () => {
  if (!props.contact) return
  const oldRemark = props.contact.settings?.remark || ''
  if (oldRemark !== form.value.remark && form.value.remark.trim() !== '') {
    props.contact._justChangedRemark = form.value.remark.trim()
  }
  props.contact.settings = JSON.parse(JSON.stringify(form.value))
  
  const db = await initDB()
  db.transaction(['contacts_profiles'], 'readwrite').objectStore('contacts_profiles').put(JSON.parse(JSON.stringify(props.contact))).onsuccess = () => {
   
    emit('settingSaved', props.contact)
    closeSettings()
  }
}

const clearCharChatHistory = async () => {
  if (!confirm("确定要清除与 TA 的所有聊天气泡吗？（角色人设将保留）")) return
  const db = await initDB()
  db.transaction(['chat_history_db'], 'readwrite').objectStore('chat_history_db').put({ charId: props.contact.id, messages: [] }).onsuccess = () => {
    alert("气泡已清空！请重新打开聊天室生效。")
  }
}

const clearCharMemory = async () => {
  if (!confirm("警告：此操作将清空 TA 脑海里的所有记忆，相当于重启人生，确定吗？")) return
  await clearCharChatHistory()
}

const deleteCharCompletely = async () => {
  if (!confirm("终极警告：这会连同角色设定、气泡、记忆一起彻底抹除！要继续吗？")) return
  const id = props.contact.id
  const db = await initDB()
  const tx = db.transaction(['contacts_profiles', 'chat_history_db', 'diary_db'], 'readwrite')
  tx.objectStore('contacts_profiles').delete(id)
  tx.objectStore('chat_history_db').delete(id)
  tx.objectStore('diary_db').delete(id)
  tx.oncomplete = () => {
    alert("角色已被彻底删除。")
    emit('charDeleted')
    closeSettings()
  }
}

const triggerOpenDiary = () => { emit('openDiary') }
const triggerOpenMail = () => { emit('openMail') }

const alertPlaceholder = (name) => { 
  alert(`[${name}] 功能即将搬入...`) 
}


// ==========================================
// 导入与导出记录逻辑方法
// ==========================================
const isImportModalOpen = ref(false)
const importFile = ref(null)
const importFileName = ref('')

// 导出(备份)功能
const exportRecord = async () => {
  if (!props.contact) return
  const db = await initDB()
  const charId = props.contact.id
  
  // 提取角色设定表数据
  const profile = await new Promise(res => {
    db.transaction(['contacts_profiles'], 'readonly').objectStore('contacts_profiles').get(charId).onsuccess = e => res(e.target.result)
  })
  
  // 提取聊天记录表数据
  const historyData = await new Promise(res => {
    db.transaction(['chat_history_db'], 'readonly').objectStore('chat_history_db').get(charId).onsuccess = e => res(e.target.result)
  })

  // 打包为统一的 JSON 结构
  const exportData = {
    profile: profile,
    history: historyData ? historyData.messages : []
  }

  // 生成本地文件并触发浏览器下载
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const dateStr = new Date().toISOString().split('T')[0]
  a.download = `${profile.name}_备份_${dateStr}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 导入(恢复)弹窗控制
const openImportModal = () => {
  importFile.value = null
  importFileName.value = ''
  isImportModalOpen.value = true
}

const closeImportModal = () => {
  isImportModalOpen.value = false
}

const triggerImportUpload = () => {
  document.getElementById('import-file-upload').click()
}

const handleImportFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    importFile.value = file
    importFileName.value = file.name
  }
  e.target.value = ''
}

// 核心覆盖逻辑
const confirmImport = () => {
  if (!importFile.value) return
  const reader = new FileReader()
  reader.onload = async (evt) => {
    try {
      const data = JSON.parse(evt.target.result)
      // 校验文件格式是否合法
      if (!data.profile || !data.history) {
        importFileName.value = "文件格式错误，解析失败"
        return
      }
      
      const db = await initDB()
      const charId = props.contact.id
      
      // 强制将导入的数据归属于当前角色ID，防止错乱
      data.profile.id = charId
      
      // 覆盖角色设定
      const tx1 = db.transaction(['contacts_profiles'], 'readwrite')
      await new Promise((res, rej) => {
        tx1.objectStore('contacts_profiles').put(data.profile).onsuccess = res
        tx1.onerror = rej
      })
      
      // 覆盖聊天记录
      const tx2 = db.transaction(['chat_history_db'], 'readwrite')
      await new Promise((res, rej) => {
        tx2.objectStore('chat_history_db').put({ charId: charId, messages: data.history }).onsuccess = res
        tx2.onerror = rej
      })
      
      // 无缝关闭弹窗与设置页，向父组件发送更新信号以刷新主聊天室
      isImportModalOpen.value = false
      emit('settingSaved', data.profile)
      closeSettings()
      
    } catch (err) {
      importFileName.value = "文件格式错误，解析失败"
    }
  }
  reader.readAsText(importFile.value)
}


// ==========================================
// 世界书弹窗逻辑方法
// ==========================================
const openWbModal = async () => {
  // 把已经选好的世界书拉进临时数组里
  tempSelectedWbs.value = [...(form.value.selectedWorldbooks || [])]
  isWbModalOpen.value = true
  
  const db = await initDB()
  db.transaction(['worldbook_db'], 'readonly').objectStore('worldbook_db').getAll().onsuccess = (e) => {
    const allWb = e.target.result || []
    const grouped = {}
    
    // 按大类进行分组装填
    allWb.forEach(wb => {
      if (!grouped[wb.category]) {
        grouped[wb.category] = []
        if (expandedCats.value[wb.category] === undefined) {
          expandedCats.value[wb.category] = false // 默认不展开
        }
      }
      grouped[wb.category].push(wb)
    })
    wbTreeData.value = grouped
  }
}

const closeWbModal = () => { isWbModalOpen.value = false }

const saveWbSelection = () => {
  // 把临时勾选的数组倒进角色的真实表单里
  form.value.selectedWorldbooks = [...tempSelectedWbs.value]
  closeWbModal()
  alert('挂载成功！(请记得点击右上角保存以持久化生效哦)')
}

// 展开/收起某个分类
const toggleCat = (cat) => {
  expandedCats.value[cat] = !expandedCats.value[cat]
}

// 判断大类是否全被勾选
const isCatAllSelected = (cat) => {
  const entries = wbTreeData.value[cat]
  if (!entries || entries.length === 0) return false
  return entries.every(e => tempSelectedWbs.value.includes(e.id))
}

// 判断大类是否是半勾选状态 (有横线)
const isCatIndeterminate = (cat) => {
  const entries = wbTreeData.value[cat]
  if (!entries || entries.length === 0) return false
  const selectedCount = entries.filter(e => tempSelectedWbs.value.includes(e.id)).length
  return selectedCount > 0 && selectedCount < entries.length
}

// 点击大类的复选框，进行全选/全不选
const toggleCatAll = (cat, event) => {
  const isChecked = event.target.checked
  const entries = wbTreeData.value[cat]
  if (!entries) return
  
  if (isChecked) {
    // 全选：把不在数组里的全塞进去
    entries.forEach(e => {
      if (!tempSelectedWbs.value.includes(e.id)) {
        tempSelectedWbs.value.push(e.id)
      }
    })
  } else {
    // 取消全选：把属于这个分类的从数组里抠掉
    const idsToRemove = entries.map(e => e.id)
    tempSelectedWbs.value = tempSelectedWbs.value.filter(id => !idsToRemove.includes(id))
  }
}
</script>

<style scoped>
/* 严格采用实心浅冰川蓝背景，杜绝磨砂和乱发红 */
#char-settings-app {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(to bottom, #f5f7fa, #e4ebf5);
  z-index: 90; display: flex; flex-direction: column;
  padding-top: max(50px, calc(env(safe-area-inset-top) + 20px));
  transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
#char-settings-app.active { transform: translateX(0); }

.simple-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 24px 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.05);
}
.header-title { font-size: 16px; font-weight: bold; color: var(--app-text-color); }
.header-btn { font-size: 15px; color: #5b6d82; cursor: pointer; font-weight: 500; }

.cs-scroll-area { flex: 1; overflow-y: auto; padding: 0 24px 40px 24px; display: flex; flex-direction: column; gap: 20px; }
.cs-card { background: rgba(255, 255, 255, 0.6); border-radius: 20px; padding: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid rgba(255,255,255,0.8); }
.cs-card.danger { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.05); }

.cs-card-title { font-size: 13px; font-weight: bold; color: var(--app-text-color); margin-bottom: 12px; opacity: 0.8; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 6px; }

.cs-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.03); font-size: 14px; color: var(--app-text-color); }
.cs-row:last-child { border-bottom: none; padding-bottom: 0; }
.cs-row.link { cursor: pointer; }
.cs-row.link:active { opacity: 0.5; }
.cs-arrow { color: #bbb; font-weight: bold; }

.cs-label { flex: 1; font-weight: 500; }
.cs-sub-label { font-size: 11px; color: #888; margin-top: 2px; font-weight: normal; }

.cs-input-text, .cs-select { border: none; background: transparent; outline: none; font-size: 14px; color: #555; text-align: right; direction: rtl; }
.cs-select { appearance: none; }

.cs-slider-container { display: flex; flex-direction: column; gap: 8px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.03); }
.cs-slider-header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 500; color: var(--app-text-color); }
.cs-number-box { width: 55px; padding: 4px; text-align: center; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.8); font-size: 13px; outline: none; }
.cs-number-box::-webkit-inner-spin-button, .cs-number-box::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: var(--icon-svg-color); }
input:checked + .slider:before { transform: translateX(20px); }

.setting-textarea { width: 100%; padding: 10px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; font-size: 13px; background: rgba(255,255,255,0.8); outline: none; resize: none; color: #555; }

.cs-btn-danger { color: #555; text-align: center; font-weight: bold; padding: 12px 0; cursor: pointer; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 14px; }
.cs-btn-danger:last-child { border-bottom: none; }
.cs-btn-danger.solid { color: white; border-radius: 12px; margin-top: 10px; }

.cs-btn-group { display: flex; gap: 10px; margin-bottom: 10px; }
.cs-btn-half { flex: 1; text-align: center; padding: 10px; background: rgba(0,0,0,0.04); border-radius: 12px; font-size: 13px; color: var(--app-text-color); cursor: pointer; font-weight: bold; }

/* ==========================================
   自定义弹窗 CSS 样式 (纯正居中悬浮框)
   ========================================== */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  z-index: 999; display: flex; justify-content: center; align-items: center;
  opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
}
.modal-overlay.active { opacity: 1; pointer-events: auto; }
.modal-box {
  width: 85%; max-width: 320px; background: rgba(255, 255, 255, 0.95);
  border-radius: 20px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-align: center;
}
.modal-overlay.active .modal-box { transform: scale(1); }
.modal-title { font-size: 16px; font-weight: bold; color: var(--app-text-color); margin-bottom: 16px; }
.modal-buttons { display: flex; gap: 12px; justify-content: center; }
.modal-btn {
  flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: bold;
  cursor: pointer; transition: background 0.2s;
}
.cancel-btn { background: rgba(0,0,0,0.05); color: #666; }
.confirm-btn { color: #fff; }

/* ==========================================
   世界书树状列表 CSS
   ========================================== */
.wb-tree-cat { 
  font-size: 14px; font-weight: bold; padding: 12px 10px; background: rgba(0,0,0,0.04); 
  border-radius: 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; color: var(--app-text-color);
}
.wb-tree-children { margin-left: 20px; display: none; flex-direction: column; gap: 6px; margin-bottom: 15px;}
.wb-tree-children.active { display: flex; }
.wb-tree-item { 
  display: flex; align-items: center; justify-content: space-between; 
  font-size: 13px; padding: 10px; border-bottom: 1px dashed rgba(0,0,0,0.06); color: #555;
}
.wb-tree-chk { transform: scale(1.2); }
.wb-tag { font-size: 11px; padding: 3px 8px; border-radius: 8px; background: rgba(122,148,169,0.1); color: #7a94a9; }


</style>