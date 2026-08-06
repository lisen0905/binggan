<!-- components/ThemeApp.vue -->
<template>
  <div id="theme-app" :class="{ active: isOpen }">
    <div class="theme-header">
      <div class="theme-title">主题美化</div>
      <div class="close-btn" @click="$emit('close')">×</div>
    </div>

    <div class="theme-scroll-area">
      <!-- 1. 桌面壁纸 -->
      <div class="theme-card">
        <div class="card-title">桌面壁纸</div>
        <div class="option-row">
          <div class="bg-block" style="background: linear-gradient(135deg, #e6eff5, #d4e0eb);" @click="setBg('linear-gradient(135deg, #e6eff5, #d4e0eb)')"></div>
          <!-- 修改点1：点击呼出绝美弹窗输入壁纸链接 -->
          <div class="bg-block action-btn" @click="triggerBgUrl">🔗</div>
          <div class="bg-block action-btn" @click="triggerBgUpload">＋</div>
        </div>
      </div>

      <!-- 2. 状态栏颜色 -->
      <div class="theme-card">
        <div class="card-title">状态栏颜色</div>
        <div class="option-row">
          <div class="color-dot" style="background: #5b6d82;" @click="setStatusBarColor('#5b6d82')"></div>
          <div class="color-dot" style="background: #ffffff;" @click="setStatusBarColor('#ffffff')"></div>
          <div class="color-dot color-picker-wrapper">
            🎨<input type="color" @input="onStatusBarColorChange">
          </div>
        </div>
      </div>

      <!-- 3. 桌面图标文字颜色 -->
      <div class="theme-card">
        <div class="card-title">桌面图标文字颜色</div>
        <div class="option-row">
          <div class="color-dot" style="background: #5b6d82;" @click="setAppTextColor('#5b6d82')"></div>
          <div class="color-dot" style="background: #ffffff;" @click="setAppTextColor('#ffffff')"></div>
          <div class="color-dot color-picker-wrapper">
            🎨<input type="color" @input="onAppTextColorChange">
          </div>
        </div>
      </div>

      <!-- 4. 更换具体应用图标 -->
      <div class="theme-card">
        <div class="card-title">更换图标图片</div>
        <div class="icon-edit-list">
          <div class="icon-edit-item">
            <span>联系人</span>
            <div class="icon-edit-actions">
              <!-- 修改点2：点击呼出绝美弹窗输入图标链接 -->
              <div class="icon-btn" @click="triggerIconUrl('联系人')">🔗</div>
              <div class="icon-btn" @click="triggerIconUpload('联系人')">＋</div>
            </div>
          </div>
          <div class="icon-edit-item">
            <span>消息</span>
            <div class="icon-edit-actions">
              <div class="icon-btn" @click="triggerIconUrl('消息')">🔗</div>
              <div class="icon-btn" @click="triggerIconUpload('消息')">＋</div>
            </div>
          </div>
          <div class="icon-edit-item">
            <span>世界书</span>
            <div class="icon-edit-actions">
              <div class="icon-btn" @click="triggerIconUrl('世界书')">🔗</div>
              <div class="icon-btn" @click="triggerIconUpload('世界书')">＋</div>
            </div>
          </div>

           <!-- --- 新增功能：记忆库图标自定义选项 开始 --- -->
          <div class="icon-edit-item">
            <span>记忆库</span>
            <div class="icon-edit-actions">
              <div class="icon-btn" @click="triggerIconUrl('记忆库')">🔗</div>
              <div class="icon-btn" @click="triggerIconUpload('记忆库')">＋</div>
            </div>
          </div>
          <!-- --- 结束 --- -->
        </div>
      </div>
    </div>

    <!-- 隐藏的文件上传控件 -->
    <input type="file" id="bg-upload" class="hidden-input" accept="image/*" @change="onBgUploadChange">
    <input type="file" id="icon-upload" class="hidden-input" accept="image/*" @change="onIconUploadChange">

    <!-- ==========================================
         修改点3：原生复刻的绝美自定义弹窗
         ========================================== -->
    <div class="modal-overlay" :class="{ active: isPromptOpen }">
      <div class="modal-box">
        <div class="modal-title">{{ promptTitle }}</div>
        <!-- v-model 让输入框的值和 Vue 变量实时绑定 -->
        <input type="text" class="modal-input" v-model="promptValue" placeholder="https://..." autocomplete="off">
        <div class="modal-buttons">
          <div class="modal-btn cancel-btn" @click="closePrompt">取消</div>
          <div class="modal-btn confirm-btn" @click="confirmPrompt">确定</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 【新增引入 ref】，用于控制弹窗状态
import { ref } from 'vue'
import { setBg, setStatusBarColor, setAppTextColor } from '../utils/theme.js'

defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'changeIcon'])

// ==========================================
// 绝美弹窗控制系统
// ==========================================
const isPromptOpen = ref(false)
const promptTitle = ref('')
const promptValue = ref('')
let promptCallback = null // 用来记住点了确定后要执行什么函数

const showPrompt = (title, callback) => {
  promptTitle.value = title
  promptValue.value = ''
  promptCallback = callback
  isPromptOpen.value = true
}

const closePrompt = () => {
  isPromptOpen.value = false
  promptCallback = null
}

const confirmPrompt = () => {
  if (promptValue.value.trim() !== '' && promptCallback) {
    promptCallback(promptValue.value.trim()) // 把输入的链接传出去
  }
  closePrompt()
}

// ==========================================
// 主题颜色控制
// ==========================================
const onStatusBarColorChange = (e) => { setStatusBarColor(e.target.value) }
const onAppTextColorChange = (e) => { setAppTextColor(e.target.value) }

// ==========================================
// 壁纸上传与链接
// ==========================================
const triggerBgUpload = () => { document.getElementById('bg-upload').click() }

const onBgUploadChange = (e) => {
  const file = e.target.files[0]; 
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => { 
    setBg(`url(${evt.target.result}) no-repeat center/cover`); 
  };
  reader.readAsDataURL(file);
}

// 用绝美弹窗设置壁纸链接
const triggerBgUrl = () => {
  showPrompt('设置桌面壁纸 (输入图片链接)', (url) => {
    setBg(`url(${url}) no-repeat center/cover`)
  })
}

// ==========================================
// 图标上传与链接
// ==========================================
let currentEditAppName = ''

const triggerIconUpload = (appName) => {
  currentEditAppName = appName
  document.getElementById('icon-upload').click()
}

const onIconUploadChange = (e) => {
  const file = e.target.files[0]; 
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      const MAX_SIZE = 200; 
      let width = img.width, height = img.height;
      if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
      else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
      const canvas = document.createElement('canvas'); 
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const compressedUrl = canvas.toDataURL('image/png');
      
      emit('changeIcon', { appName: currentEditAppName, url: compressedUrl })
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file); 
  e.target.value = ''; 
}

// 用绝美弹窗设置图标链接
const triggerIconUrl = (appName) => {
  showPrompt(`为【${appName}】设置图片链接：`, (url) => {
    emit('changeIcon', { appName: appName, url: url })
  })
}
</script>

<style scoped>
/* ==========================================
   【主题美化 App 全屏面板样式】
   ========================================== */
#theme-app {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
   background: linear-gradient(to bottom, #f5f7fa, #e4ebf5);
  z-index: 50; display: flex; flex-direction: column;
  padding-top: max(50px, calc(env(safe-area-inset-top) + 40px));
  padding-bottom: 20px;
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
#theme-app.active { transform: translateY(0); }

.theme-header { display: flex; justify-content: space-between; align-items: center; padding: 0 24px 20px 24px; }
.theme-title { font-size: 24px; font-weight: bold; color: var(--app-text-color); }
.close-btn { width: 30px; height: 30px; background: rgba(0,0,0,0.05); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; color: var(--app-text-color); cursor: pointer; }

.theme-scroll-area { flex: 1; overflow-y: auto; padding: 0 24px; display: flex; flex-direction: column; gap: 20px; }
.theme-card { background: rgba(255, 255, 255, 0.6); border-radius: 20px; padding: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid rgba(255,255,255,0.8); }
.card-title { font-size: 14px; font-weight: bold; color: var(--app-text-color); margin-bottom: 12px; opacity: 0.8; }

.option-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; }
.option-row::-webkit-scrollbar { display: none; }
.bg-block { flex-shrink: 0; width: 60px; height: 90px; border-radius: 12px; cursor: pointer; border: 2px solid transparent; background-size: cover !important; background-position: center !important; }
.color-dot { flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; border: 2px solid rgba(0,0,0,0.05); }
.action-btn { display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.05); font-size: 20px; color: var(--app-text-color); border: 2px dashed rgba(0,0,0,0.1); }

/* 图标更换卡片列表样式 */
.icon-edit-list { display: flex; flex-direction: column; gap: 10px; }
.icon-edit-item {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(255, 255, 255, 0.5); padding: 8px 12px;
  border-radius: 12px; font-size: 14px; color: var(--app-text-color);
}
.icon-edit-actions { display: flex; gap: 8px; }
.icon-btn {
  width: 32px; height: 32px; background: rgba(0,0,0,0.05);
  border-radius: 8px; display: flex; justify-content: center; align-items: center;
  cursor: pointer; border: 1px dashed rgba(0,0,0,0.1);
}

/* 隐藏输入框与拾色器包装 */
.hidden-input { display: none; }
.color-picker-wrapper {
  position: relative; overflow: hidden;
  background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);
  display: flex; justify-content: center; align-items: center;
}
.color-picker-wrapper input[type="color"] {
  position: absolute; top: -10px; left: -10px; width: 60px; height: 60px;
  opacity: 0; cursor: pointer;
}

/* ==========================================
   自定义弹窗 CSS 样式复刻
   ========================================== */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  z-index: 999; display: flex; justify-content: center; align-items: center;
  opacity: 0; pointer-events: none; 
  transition: opacity 0.3s ease;
}
.modal-overlay.active { opacity: 1; pointer-events: auto; }
.modal-box {
  width: 80%; max-width: 320px; background: rgba(255, 255, 255, 0.9);
  border-radius: 20px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-align: center;
}
.modal-overlay.active .modal-box { transform: scale(1); }
.modal-title { font-size: 16px; font-weight: bold; color: var(--app-text-color); margin-bottom: 16px; }

.modal-input {
  width: 100%; padding: 12px 15px; border: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px; font-size: 14px; margin-bottom: 24px;
  outline: none; background: rgba(255,255,255,0.8); color: var(--app-text-color);
  transition: border-color 0.3s;
}
.modal-input:focus { border-color: #7a94a9; }

.modal-buttons { display: flex; gap: 12px; justify-content: center; }
.modal-btn {
  flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: bold;
  cursor: pointer; transition: background 0.2s;
}
.cancel-btn { background: rgba(0,0,0,0.05); color: #666; }
.confirm-btn { background: rgba(0,0,0,0.05);  color:  #666; }
</style>