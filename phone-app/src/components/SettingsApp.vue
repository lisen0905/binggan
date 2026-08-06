<!-- components/SettingsApp.vue -->
<template>
  <div id="settings-app" :class="{ active: isOpen }">
    <div class="theme-header">
      <div class="theme-title">系统设置</div>
      <div class="close-btn" @click="$emit('close')">×</div>
    </div>

    <div class="theme-scroll-area">
      <!-- 第一板块：API库列表 -->
      <div class="theme-card">
        <div class="card-title">API 方案库</div>
        <div class="api-list">
          <div v-if="allApiProfiles.length === 0" style="text-align:center;font-size:12px;color:#999;padding:10px;">
            仓库空空如也，快去录入吧~
          </div>
          <div v-else class="api-item" v-for="api in displayApiProfiles" :key="api.id">
            <div>
              <div class="api-info-name">
                {{ api.name }} 
                <span style="font-size:10px;color:#7a94a9;">({{ api.model || '未填' }})</span>
              </div>
              <div class="api-info-detail">T:{{ api.temperature }} | {{ api.isStream ? '流式' : '全量' }}</div>
            </div>
            <div class="api-actions">
              <div class="api-action-btn" @click="editApi(api)">编辑</div>
              <div class="api-action-btn del" @click="deleteApi(api.id)">删除</div>
            </div>
          </div>
        </div>
        <div 
          class="show-more-btn" 
          v-if="allApiProfiles.length > 3" 
          @click="isShowAllApis = !isShowAllApis"
        >
          {{ isShowAllApis ? '收起列表 ∧' : `查看更多 (${allApiProfiles.length - 3}) ∨` }}
        </div>
      </div>

      <!-- 第二板块：添加/编辑表单 -->
      <div class="theme-card">
        <div class="card-title">{{ isEditing ? '编辑模型方案' : '录入新模型方案' }}</div>
        
        <div class="setting-group">
          <span class="setting-label">方案名称 (如: DeepSeek-V3)</span>
          <input type="text" class="setting-input" v-model="form.name" placeholder="给方案起个好记的名字">
        </div>
        
        <div class="setting-group">
          <span class="setting-label">接口地址 (Base URL，通常以 /v1 结尾)</span>
          <input type="text" class="setting-input" v-model="form.url" placeholder="例如: https://api.deepseek.com/v1">
        </div>

        <div class="setting-group">
          <span class="setting-label">钥匙 (API Key)</span>
          <input type="password" class="setting-input" v-model="form.key" placeholder="sk-...">
        </div>
        
        <!-- 一键拉取按钮 -->
        <div class="save-db-btn" style="background: #7a94a9; margin-bottom: 15px;" @click="fetchModelsFromAPI">
          {{ fetchBtnText }}
        </div>

        <div class="setting-group" style="position: relative;" ref="dropdownContainer">
          <span class="setting-label">目标模型 (支持手动输入或下拉选择)</span>
          <input 
            type="text" 
            class="setting-input" 
            v-model="form.model" 
            placeholder="点击上方按钮拉取模型名单..." 
            autocomplete="off" 
            @focus="showModelDropdown" 
            @input="filterModels"
          >
          <!-- 绝美的自定义下拉容器 -->
          <div class="custom-dropdown" :class="{ active: isDropdownOpen }">
            <div v-if="filteredModels.length === 0" style="padding:12px; text-align:center; color:#999; font-size:12px;">无匹配模型</div>
            <div 
              class="dropdown-option" 
              v-for="modelId in filteredModels" 
              :key="modelId" 
              @click="selectModel(modelId)"
            >
              {{ modelId }}
            </div>
          </div>
        </div>

        <div class="setting-group">
          <span class="setting-label">温度设定 (Temperature)</span>
          <div class="slider-group">
            <span style="font-size:12px; color:#888;">严谨</span>
            <input type="range" min="0" max="2" step="0.1" v-model="form.temperature">
            <span class="slider-val">{{ form.temperature }}</span>
            <span style="font-size:12px; color:#888;">发散</span>
          </div>
        </div>

        <div class="toggle-group">
          <span class="setting-label" style="margin:0;">打字机流式输出 (Stream)</span>
          <label class="switch">
            <input type="checkbox" v-model="form.isStream">
            <span class="slider"></span>
          </label>
        </div>

        <div class="save-db-btn" @click="saveApiToDB">保存至仓库</div>
        <div class="show-more-btn" style="margin-top:10px;" v-if="isEditing" @click="resetApiForm">取消编辑</div>
      </div>

      <!-- 第三板块：环境感知 -->
      <div class="theme-card">
        <div class="card-title">后台环境感知</div>
        <div class="env-row">
          <span>{{ envLocation }}</span>
          <div class="env-btn" @click="fetchLocationAndWeather">获取定位</div>
        </div>
        <div class="env-row">
          <span>{{ envWeather }}</span>
        </div>
        <div style="font-size:11px; color:#999; margin-top:8px;">
          * 授权定位后，小手机将通过免费开源接口自动感知您身边的真实天气情况。
        </div>
      </div>

  <!-- --- 新增功能：消息通知模式与角色主动搭话面板 开始 --- -->
      <div class="theme-card">
        <div class="card-title">消息通知模式</div>
        <div class="setting-group">
          <select class="setting-input" v-model="sysNotificationMode" @change="saveNotificationMode">
            <option value="all">内部悬浮，外部系统推送</option>
            <option value="os_only">仅系统推送</option>
            <option value="off">关闭所有新消息通知</option>
          </select>
        </div>
        <div style="font-size:11px; color:#999; margin-top:4px; margin-bottom: 15px;">
          * 系统推送需要浏览器授权。若收不到，请检查浏览器设置。
        </div>

          <!-- --- 新增功能：双重通知测试按钮 开始 --- -->
        <div style="display: flex; gap: 10px; margin-bottom: 5px;">
          <div class="save-db-btn" style="margin-top: 0; flex: 1; background: #7a94a9; font-size: 12px; padding: 10px;" @click="triggerTestBanner">测试内部悬浮</div>
          <div class="save-db-btn" style="margin-top: 0; flex: 1; background: #5b6d82; font-size: 12px; padding: 10px;" @click="triggerTestOS">测试系统推送</div>
        </div>
        <!-- --- 结束 --- -->
        
        <hr style="border:none; border-top:1px dashed rgba(0,0,0,0.1); margin:15px 0;">
        <div class="card-title">角色后台回复</div>
        
        <div class="setting-group">
          <span class="setting-label">选择要配置的角色</span>
          <select class="setting-input" v-model="selectedContactId" @change="loadSpecificContactSettings">
            <option disabled value="">请选择角色...</option>
            <option v-for="c in allContacts" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div v-if="selectedContactId">
          <div class="toggle-group" style="margin-bottom: 12px;">
            <span class="setting-label" style="margin:0;">允许 TA 在后台主动找我</span>
            <label class="switch">
              <input type="checkbox" v-model="autoChatConfig.enabled" @change="saveAutoChatSettings">
              <span class="slider"></span>
            </label>
          </div>
          
          <div class="setting-group" v-if="autoChatConfig.enabled" style="display: flex; gap: 10px; align-items: center;">
            <span class="setting-label" style="margin:0; flex-shrink: 0;">冷落多久后触发:</span>
            <input type="number" min="5" class="setting-input" v-model="autoChatConfig.interval" @blur="validateAndSaveAutoChat" style="width: 70px; text-align: center;">
            <select class="setting-input" v-model="autoChatConfig.unit" @change="saveAutoChatSettings" style="width: 80px;">
              <option value="minutes">分钟</option>
              <option value="hours">小时</option>
            </select>
          </div>
          <div v-if="autoChatConfig.enabled" style="font-size:11px; color:#999; margin-top:4px;">
            * 最低5分钟。满足时间后，后台会按照正常的聊天逻辑发送多条消息过来哦。
          </div>
        </div>
      </div>
      <!-- --- 结束 --- -->

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { initDB, saveSettingData, getSettingValue } from '../utils/db.js'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

// ==========================================
// API 列表逻辑
// ==========================================
const allApiProfiles = ref([])
const isShowAllApis = ref(false)

const displayApiProfiles = computed(() => {
  return isShowAllApis.value ? allApiProfiles.value : allApiProfiles.value.slice(0, 3)
})

const loadApiProfiles = async () => {
  const db = await initDB()
  const tx = db.transaction(['api_profiles'], 'readonly')
  const req = tx.objectStore('api_profiles').getAll()
  req.onsuccess = () => {
    allApiProfiles.value = req.result || []
  }
}

// 监听面板打开，每次打开时刷新数据
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadApiProfiles()
    loadEnvData()
    // --- 新增功能：每次打开面板刷新通知状态与角色列表 开始 ---
    loadNotificationMode()
    loadContactsForAutoChat()
    // --- 结束 ---
  }
})

// ==========================================
// API 表单逻辑
// ==========================================
const isEditing = ref(false)
const form = ref({
  id: '',
  name: '',
  url: '',
  key: '',
  model: '',
  temperature: '0.7',
  isStream: true
})

const resetApiForm = () => {
  isEditing.value = false
  form.value = { id: '', name: '', url: '', key: '', model: '', temperature: '0.7', isStream: true }
}

const editApi = (api) => {
  isEditing.value = true
  form.value = { ...api }
}

const saveApiToDB = async () => {
  if (!form.value.name || !form.value.url) {
    alert("方案名称和地址不能为空哦！")
    return
  }
  const db = await initDB()
  const dataToSave = { ...form.value }
  if (!dataToSave.id) dataToSave.id = 'api_' + Date.now()

  const tx = db.transaction(['api_profiles'], 'readwrite')
  tx.objectStore('api_profiles').put(dataToSave)
  tx.oncomplete = () => {
    resetApiForm()
    loadApiProfiles()
    alert("保存成功！")
  }
}

const deleteApi = async (id) => {
  if (!confirm("确定要删除这个方案吗？")) return
  const db = await initDB()
  db.transaction(['api_profiles'], 'readwrite').objectStore('api_profiles').delete(id).onsuccess = () => {
    loadApiProfiles()
  }
}

// ==========================================
// 拉取模型与下拉菜单逻辑
// ==========================================
const fetchBtnText = ref('一键拉取可用模型')
const globalFetchedModels = ref([])
const filteredModels = ref([])
const isDropdownOpen = ref(false)
const dropdownContainer = ref(null)

const fetchModelsFromAPI = async () => {
  const url = form.value.url.trim()
  const key = form.value.key.trim()
  if (!url || !key) {
    alert("请先填写接口地址和专属钥匙！")
    return
  }
  
  const fetchUrl = url.replace(/\/+$/, '') + '/models'
  try {
    fetchBtnText.value = "正在努力拉取中..."
    const response = await fetch(fetchUrl, { 
      method: 'GET', 
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
    })
    if (!response.ok) throw new Error("网络请求失败")
    const data = await response.json()
    
    if (data && data.data && Array.isArray(data.data)) {
      globalFetchedModels.value = data.data.map(m => m.id)
      filteredModels.value = [...globalFetchedModels.value]
      
      if (globalFetchedModels.value.length > 0) {
        form.value.model = globalFetchedModels.value[0]
      }
      alert(`成功拉取到 ${globalFetchedModels.value.length} 个模型！`)
    } else {
      throw new Error("返回格式错误")
    }
  } catch (err) {
    alert("拉取失败了！可直接手动输入模型名称。")
  } finally {
    fetchBtnText.value = "一键拉取可用模型"
  }
}

const showModelDropdown = () => {
  if (globalFetchedModels.value.length > 0) {
    filteredModels.value = [...globalFetchedModels.value]
    isDropdownOpen.value = true
  }
}

const filterModels = () => {
  const val = form.value.model.toLowerCase()
  filteredModels.value = globalFetchedModels.value.filter(m => m.toLowerCase().includes(val))
  isDropdownOpen.value = true
}

const selectModel = (modelId) => {
  form.value.model = modelId
  isDropdownOpen.value = false
}

// 点击空白处关闭下拉菜单
const handleClickOutside = (e) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(e.target)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// ==========================================
// 环境感知逻辑
// ==========================================
const envLocation = ref('当前位置：未知')
const envWeather = ref('当地天气：未知')

// --- 新增功能：通知模式与主动搭话的逻辑状态 开始 ---
const sysNotificationMode = ref('all')
const allContacts = ref([])
const selectedContactId = ref('')
const autoChatConfig = ref({ enabled: false, interval: 5, unit: 'minutes' })

// --- 新增功能：调用全局测试方法 开始 ---
const triggerTestBanner = () => {
  if (window.testAppBanner) window.testAppBanner()
}
const triggerTestOS = () => {
  if (window.testOsNotification) window.testOsNotification()
}
// --- 结束 ---

const loadNotificationMode = async () => {
  const mode = await getSettingValue('notification_mode')
  if (mode) sysNotificationMode.value = mode
}

const saveNotificationMode = async () => {
  if ((sysNotificationMode.value === 'all' || sysNotificationMode.value === 'os_only') && 'Notification' in window) {
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        alert('系统推送未获得浏览器授权，可能无法在后台推送哦~')
        sysNotificationMode.value = 'off'
      }
    }
  }
  await saveSettingData('notification_mode', sysNotificationMode.value)
}

const loadContactsForAutoChat = async () => {
  const db = await initDB()
  db.transaction(['contacts_profiles'], 'readonly').objectStore('contacts_profiles').getAll().onsuccess = (e) => {
    allContacts.value = e.target.result || []
    if (allContacts.value.length > 0 && !selectedContactId.value) {
      selectedContactId.value = allContacts.value[0].id
      loadSpecificContactSettings()
    }
  }
}

const loadSpecificContactSettings = () => {
  const c = allContacts.value.find(x => x.id === selectedContactId.value)
  if (c && c.settings && c.settings.autoChat) {
    autoChatConfig.value = { ...c.settings.autoChat }
  } else {
    autoChatConfig.value = { enabled: false, interval: 5, unit: 'minutes' }
  }
}

const validateAndSaveAutoChat = () => {
  if (autoChatConfig.value.interval < 5) autoChatConfig.value.interval = 5
  saveAutoChatSettings()
}

const saveAutoChatSettings = async () => {
  if (!selectedContactId.value) return
  const db = await initDB()
  const tx = db.transaction(['contacts_profiles'], 'readwrite')
  const store = tx.objectStore('contacts_profiles')
  store.get(selectedContactId.value).onsuccess = (e) => {
    let charProf = e.target.result
    if (charProf) {
      if (!charProf.settings) charProf.settings = {}
      charProf.settings.autoChat = { ...autoChatConfig.value }
      store.put(charProf)
    }
  }
}
// --- 结束 ---

const getLocalDateKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loadEnvData = async () => {
  const savedLoc = await getSettingValue('env_location')
  if (savedLoc) envLocation.value = `${savedLoc}`
  const savedWeather = await getSettingValue('env_weather')
  if (savedWeather) envWeather.value = `${savedWeather}`
}

const fetchWeatherByCoords = async (lat, lon) => {
  envWeather.value = "获取中..."
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
    const data = await res.json()
    if (data && data.current_weather) {
      const t = data.current_weather.temperature, code = data.current_weather.weathercode
      let desc = "多云"; 
      if (code === 0) desc = "晴朗"; 
      if (code > 50 && code < 70) desc = "下雨"; 
      if (code >= 70 && code < 80) desc = "下雪";
      const weatherText = `气温 ${t}°C | ${desc}`
      
      envWeather.value = `${weatherText}`
      await saveSettingData('env_weather', weatherText)
      await saveSettingData('env_weather_date', getLocalDateKey())
    }
  } catch (e) {
    envWeather.value = "天气获取失败"
  }
}

const fetchLocationAndWeather = () => {
  envLocation.value = "定位中..."
  envWeather.value = "获取中..."
  if (!navigator.geolocation) { 
    envLocation.value = "设备不支持定位" 
    return 
  }
  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude.toFixed(2)
    const lon = position.coords.longitude.toFixed(2)
    const locText = `经纬度：${lat}, ${lon}`
    
    envLocation.value = `${locText}`
    await saveSettingData('env_location', locText)
    await saveSettingData('env_coords', { lat: parseFloat(lat), lon: parseFloat(lon) })
    await fetchWeatherByCoords(lat, lon)
  }, () => { 
    envLocation.value = "定位失败"
    envWeather.value = "无法获取天气" 
  })
}
</script>

<style scoped>
/* ==========================================
   【设置 App CSS 样式】
   ========================================== */
#settings-app {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(to bottom, #f5f7fa, #e4ebf5);
  z-index: 50; display: flex; flex-direction: column;
  padding-top: max(50px, calc(env(safe-area-inset-top) + 40px));
  padding-bottom: 20px;
  transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
#settings-app.active { transform: translateY(0); }

.theme-header { display: flex; justify-content: space-between; align-items: center; padding: 0 24px 20px 24px; }
.theme-title { font-size: 24px; font-weight: bold; color: var(--app-text-color); }
.close-btn { width: 30px; height: 30px; background: rgba(0,0,0,0.05); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; color: var(--app-text-color); cursor: pointer; }

.theme-scroll-area { flex: 1; overflow-y: auto; padding: 0 24px; display: flex; flex-direction: column; gap: 20px; }
.theme-card { background: rgba(255, 255, 255, 0.6); border-radius: 20px; padding: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid rgba(255,255,255,0.8); }
.card-title { font-size: 14px; font-weight: bold; color: var(--app-text-color); margin-bottom: 12px; opacity: 0.8; }

/* 列表项样式 */
.api-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; }
.api-item {
  background: rgba(255,255,255,0.6); border-radius: 12px; padding: 12px;
  display: flex; justify-content: space-between; align-items: center;
  border: 1px solid rgba(255,255,255,0.8);
}
.api-info-name { font-size: 14px; font-weight: bold; color: var(--app-text-color); margin-bottom: 4px; }
.api-info-detail { font-size: 11px; color: #888; }
.api-actions { display: flex; gap: 8px; }
.api-action-btn {
  font-size: 12px; padding: 6px 10px; border-radius: 6px; cursor: pointer;
  background: rgba(0,0,0,0.05); color: var(--app-text-color);
}
.api-action-btn.del { color: #7a94a9; background: transparent; font-weight: 500; }
.show-more-btn { text-align: center; font-size: 12px; color: #7a94a9; cursor: pointer; padding: 5px; }

/* 表单输入框样式 */
.setting-group { margin-bottom: 12px; }
.setting-label { font-size: 12px; font-weight: bold; color: var(--app-text-color); margin-bottom: 6px; display: block; opacity: 0.8;}
.setting-input {
  width: 100%; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.1);
  border-radius: 10px; font-size: 13px; background: rgba(255,255,255,0.8);
  outline: none; color: var(--app-text-color); transition: border-color 0.2s;
}
.setting-input:focus { border-color: #7a94a9; }

/* 滑块和开关布局 */
.slider-group { display: flex; align-items: center; gap: 10px; }
.slider-group input[type="range"] { flex: 1; }
.slider-val { font-size: 12px; font-weight: bold; width: 30px; text-align: right;}

.toggle-group { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: #7a94a9; }
input:checked + .slider:before { transform: translateX(20px); }

.save-db-btn {
  width: 100%; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: bold;
  background: #7a94a9; ; color: #fff; text-align: center; cursor: pointer;
  margin-top: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

/* 环境感知卡片 */
.env-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 14px; color: var(--app-text-color); }
.env-btn { font-size: 12px; padding: 6px 12px; background: rgba(0,0,0,0.05); border-radius: 15px; cursor: pointer; }

/* 自定义模型下拉菜单样式 */
.custom-dropdown {
  display: none; position: absolute; top: 100%; left: 0; width: 100%;
  max-height: 180px; overflow-y: auto; background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255,255,255,0.8); border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 100; margin-top: 6px;
}
.custom-dropdown.active { display: block; }
.dropdown-option {
  padding: 12px 15px; font-size: 13px; color: var(--app-text-color);
  border-bottom: 1px solid rgba(0,0,0,0.03); cursor: pointer; transition: 0.2s;
}
.dropdown-option:last-child { border-bottom: none; }
.dropdown-option:active { background: rgba(0,0,0,0.05); }
</style>