<!-- components/MessagesApp.vue -->
<script setup>
import { ref, watch, onMounted } from 'vue'
import { initDB, saveSettingData, getSettingValue } from '../utils/db.js'

const props = defineProps({ isOpen: Boolean, updateTick: Number })
const emit = defineEmits(['close', 'openChat'])

const activeTab = ref('msg')
const activeChats = ref([])
const userProfile = ref({ name: '', prompt: '', avatar: '' })
const isSelectModalOpen = ref(false)
const allContacts = ref([])

watch(() => props.isOpen, (newVal) => {
  if (newVal) { activeTab.value = 'msg'; loadUserProfile(); loadActiveChats() }
})

watch(() => props.updateTick, () => {
  if (props.isOpen) loadActiveChats()
})

const loadUserProfile = async () => {
  const data = await getSettingValue('user_profile')
  if (data) userProfile.value = { ...data }
}

const saveUserProfile = async () => {
  await saveSettingData('user_profile', JSON.parse(JSON.stringify(userProfile.value)))
  alert("User 资料已保存！")
}

const triggerUserAvatarUpload = () => { document.getElementById('user-avatar-upload').click() }
const onUserAvatarUpload = (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas'); let size = 150; canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d'); let min = Math.min(img.width, img.height);
      let sx = (img.width - min) / 2, sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      userProfile.value.avatar = canvas.toDataURL('image/png');
    }; img.src = evt.target.result;
  }; reader.readAsDataURL(file); e.target.value = '';
}

// ==========================================
// 核心修复：即使没发过消息也显示列表
// ==========================================
const loadActiveChats = async () => {
  const db = await initDB()
  const tx = db.transaction(['chat_history_db', 'contacts_profiles'], 'readonly')
  const historyStore = tx.objectStore('chat_history_db')
  const contactsStore = tx.objectStore('contacts_profiles')
  
  historyStore.getAll().onsuccess = (req) => {
    const histories = req.target.result || []
    
    // 按最后活跃时间排序（即使没有消息，也要按创建时间或msg列表逻辑排序）
    histories.sort((a, b) => {
      const timeA = a.messages && a.messages.length > 0 ? a.messages[a.messages.length - 1].time : 0
      const timeB = b.messages && b.messages.length > 0 ? b.messages[b.messages.length - 1].time : 0
      return timeB - timeA
    })
    
    let tempChats = []
    let processed = 0
    if (histories.length === 0) { activeChats.value = []; return }

    histories.forEach(h => {
      contactsStore.get(h.charId).onsuccess = (cReq) => {
        const contact = cReq.target.result
        if (contact) {
          const hasMsgs = h.messages && h.messages.length > 0
          const lastMsgText = hasMsgs ? h.messages[h.messages.length - 1].text : '点击开启甜蜜对话吧'
          const lastMsgTime = hasMsgs ? h.messages[h.messages.length - 1].time : Date.now()
          const displayName = (contact.settings && contact.settings.remark) ? contact.settings.remark : contact.name
          
          tempChats.push({ 
            id: contact.id, 
            contact: contact, 
            avatar: contact.avatar, 
            displayName: displayName, 
            lastMessage: lastMsgText, 
            time: lastMsgTime 
          })
        }
        processed++
        if (processed === histories.length) {
          // 重新整理排序并同步给 Vue
          tempChats.sort((a, b) => b.time - a.time)
          activeChats.value = tempChats
        }
      }
    })
  }
}

const openStartChatModal = async () => {
  const db = await initDB()
  db.transaction(['contacts_profiles'], 'readonly').objectStore('contacts_profiles').getAll().onsuccess = (req) => {
    allContacts.value = req.target.result || []; isSelectModalOpen.value = true
  }
}
const selectContactAndChat = (contact) => { isSelectModalOpen.value = false; emit('openChat', contact) }
const startChat = (contact) => { emit('openChat', contact) }
</script>

<template>
  <div id="messages-app" :class="{ active: isOpen }">
    <div class="simple-header">
      <div class="header-btn" @click="$emit('close')">关闭</div>
      <div class="header-title">消息</div>
      <div class="header-btn" @click="openStartChatModal">+</div>
    </div>

    <!-- Tab 1: 消息列表 -->
    <div class="msg-content-area" :class="{ active: activeTab === 'msg' }">
      <div v-if="activeChats.length === 0" style="text-align:center; color:#999; font-size:13px; margin-top:40px;">
        暂无聊天，点击右上角+发起
      </div>
      <div v-else>
        <div 
          class="chat-list-item" 
          v-for="chat in activeChats" 
          :key="chat.id"
          @click="startChat(chat.contact)"
        >
          <div class="chat-list-avatar" :style="chat.avatar ? `background: url(${chat.avatar}) center/cover` : 'background:#e0e0e0'"></div>
          <div class="chat-list-info">
            <div class="chat-list-name">{{ chat.displayName }}</div>
            <div class="chat-list-lastmsg">{{ chat.lastMessage }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: 动态 (省略) -->
    <div class="msg-content-area" :class="{ active: activeTab === 'feed' }">
      <div style="text-align:center; color:#999; font-size:13px; margin-top:40px;">动态功能开发中...</div>
    </div>

    <!-- Tab 3: 我  -->
    <div class="msg-content-area" :class="{ active: activeTab === 'user' }">
      <div class="avatar-upload-area">
        <div class="avatar-preview" :style="userProfile.avatar ? `background: url(${userProfile.avatar}) center/cover` : 'background:#d4e0eb'" @click="triggerUserAvatarUpload">
          {{ userProfile.avatar ? '' : 'User头像' }}
        </div>
        <input type="file" id="user-avatar-upload" class="hidden-input" accept="image/*" @change="onUserAvatarUpload">
      </div>
      <div class="setting-group">
        <span class="setting-label">User 名称</span>
        <input type="text" class="setting-input" v-model="userProfile.name" placeholder="输入你的名字">
      </div>
      <div class="setting-group">
        <span class="setting-label">User 人设</span>
        <textarea class="setting-textarea" style="height:120px;" v-model="userProfile.prompt" placeholder="性格人设..."></textarea>
      </div>
      <div class="save-db-btn" @click="saveUserProfile">保存 User 资料</div>
    </div>

    <!-- 底部导航 -->
    <div class="msg-tabs">
      <div class="msg-tab-btn" :class="{ active: activeTab === 'msg' }" @click="activeTab = 'msg'">消息</div>
      <div class="msg-tab-btn" :class="{ active: activeTab === 'feed' }" @click="activeTab = 'feed'">动态</div>
      <div class="msg-tab-btn" :class="{ active: activeTab === 'user' }" @click="activeTab = 'user'">我</div>
    </div>

    <!-- 选择联系人弹窗 -->
    <div class="modal-overlay" :class="{ active: isSelectModalOpen }">
      <div class="modal-box" style="display: flex; flex-direction: column; max-height: 60vh;">
        <div class="modal-title">选择聊天对象</div>
        <div class="contact-select-list">
          <div v-for="c in allContacts" :key="c.id" class="contact-select-item" @click="selectContactAndChat(c)">
            <div class="select-item-avatar" :style="c.avatar ? `background: url(${c.avatar}) center/cover` : 'background:#e0e0e0'"></div>
            <div class="select-item-name">{{ c.name }}</div>
          </div>
        </div>
        <div class="modal-buttons">
          <div class="modal-btn cancel-btn" @click="isSelectModalOpen = false">取消</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保持原样 (浅冰川蓝实心背景) */
#messages-app { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, #f5f7fa, #e4ebf5); z-index: 60; display: flex; flex-direction: column; padding-top: max(50px, calc(env(safe-area-inset-top) + 20px)); transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }
#messages-app.active { transform: translateY(0); }
.simple-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 24px 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.05); }
.header-title { font-size: 17px; font-weight: bold; color: var(--app-text-color); }
.header-btn { font-size: 15px;  color: #5b6d82;; cursor: pointer; font-weight: 500; }
.msg-content-area { flex: 1; overflow-y: auto; display: none; padding: 20px 24px 100px 24px; }
.msg-content-area.active { display: block; }
.chat-list-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.03); cursor: pointer; }
.chat-list-avatar { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; }
.chat-list-info { flex: 1; overflow: hidden; }
.chat-list-name { font-size: 16px; font-weight: 500; color: var(--app-text-color); margin-bottom: 4px; }
.chat-list-lastmsg { font-size: 13px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.msg-tabs { position: absolute; bottom: max(20px, env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); width: 85%; height: 55px; background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); border-radius: 28px; display: flex; justify-content: space-around; align-items: center; box-shadow: 0 8px 25px rgba(0,0,0,0.08); border: 1px solid rgba(255,255,255,0.8); z-index: 85; }
.msg-tab-btn { flex: 1; display: flex; justify-content: center; align-items: center; font-size: 14px; font-weight: bold; color: #999; cursor: pointer; transition: 0.2s; height: 100%; border-radius: 28px; }
.msg-tab-btn.active { color: var(--icon-svg-color); }
.avatar-upload-area { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 10px; }
.avatar-preview { width: 80px; height: 80px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; color: #fff; font-size: 12px; }
.hidden-input { display: none; }
.setting-group { margin-bottom: 12px; }
.setting-label { font-size: 12px; font-weight: bold; color: var(--app-text-color); margin-bottom: 6px; display: block; opacity: 0.8;}
.setting-input { width: 100%; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; background: rgba(255,255,255,0.8); outline: none; color: var(--app-text-color); transition: border-color 0.2s; }
.setting-input:focus { border-color: var(--icon-svg-color); }
.setting-textarea { width: 100%; padding: 12px; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; outline: none; resize: none; background: rgba(255,255,255,0.8); color: var(--app-text-color); line-height: 1.5; }
.save-db-btn { width: 100%; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: bold; background: var(--icon-svg-color); color: #fff; text-align: center; cursor: pointer; margin-top: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px); z-index: 999; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
.modal-overlay.active { opacity: 1; pointer-events: auto; }
.modal-box { width: 80%; max-width: 320px; background: rgba(255, 255, 255, 0.9); border-radius: 20px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transform: scale(0.9); transition: 0.3s; text-align: center; }
.modal-overlay.active .modal-box { transform: scale(1); }
.modal-title { font-size: 16px; font-weight: bold; color: var(--app-text-color); margin-bottom: 16px; }
.contact-select-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.contact-select-item { display: flex; align-items: center; gap: 12px; padding: 10px 15px; background: rgba(0,0,0,0.04); border-radius: 12px; cursor: pointer; }
.select-item-avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.select-item-name { font-size: 15px; font-weight: bold; color: var(--app-text-color); }
.modal-buttons { display: flex; gap: 12px; justify-content: center; }
.modal-btn { flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: bold; cursor: pointer; }
.cancel-btn { background: rgba(0,0,0,0.05); color: #666; }
</style>