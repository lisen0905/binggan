<!-- components/ContactsApp.vue -->
<template>
  <!-- 1. 列表页 -->
  <div id="contacts-app" :class="{ active: isOpen }">
    <div class="simple-header">
      <div class="header-btn" @click="closeApp">关闭</div>
      <div class="header-title">联系人</div>
      <div class="header-btn" @click="openEdit()">添加</div>
    </div>
    <div class="contacts-list">
      <div v-if="contactsList.length === 0" style="text-align:center; color:#999; font-size:14px; margin-top:50px;">
        暂无联系人，请点击添加
      </div>
      <div v-else class="contact-item" v-for="c in contactsList" :key="c.id">
        <div class="contact-left">
          <div class="contact-avatar" :style="c.avatar ? `background: url(${c.avatar}) center/cover` : 'background:#e0e0e0'"></div>
          <div class="contact-name">{{ c.name }}</div>
        </div>
        <div class="contact-actions">
          <div class="contact-action-btn" @click="openEdit(c)">编辑</div>
                 <div class="contact-action-btn" @click="alertChat(c)">聊天</div>
          <!-- 换成冰川蓝的删除按钮 -->
          <div class="contact-action-btn" style="color:var(--status-bar-color); background:rgba(91,109,130,0.1);" @click="confirmDelete(c)">删除</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 2. 编辑页 -->
  <div id="contact-edit-app" :class="{ active: isOpen && isEditing }">
    <div class="simple-header">
      <div class="header-btn" style="color:#999;" @click="isEditing = false">取消</div>
      <div class="header-title">{{ form.id ? '编辑资料' : '新建联系人' }}</div>
      <div class="header-btn" @click="saveContact">保存</div>
    </div>
    
    <div class="edit-body">
      <div class="avatar-upload-area">
        <div class="avatar-preview" :style="form.avatar ? `background: url(${form.avatar}) center/cover` : 'background:#d4e0eb'" @click="triggerAvatarUpload">
          {{ form.avatar ? '' : '上传' }}
        </div>
      </div>

      <div class="setting-group">
        <span class="setting-label">角色名</span>
        <input type="text" class="setting-input" v-model="form.name" placeholder="输入名称">
      </div>

      <div class="setting-group">
        <span class="setting-label">昵称</span>
        <input type="text" class="setting-input" v-model="form.nickname" placeholder="输入昵称">
      </div>

      <div class="setting-group">
        <span class="setting-label">性别</span>
        <div class="gender-toggle">
          <div class="gender-btn" :class="{ active: form.gender === '男' }" @click="form.gender = '男'">男</div>
          <div class="gender-btn" :class="{ active: form.gender === '女' }" @click="form.gender = '女'">女</div>
        </div>
      </div>

      <div class="setting-group">
        <div class="textarea-header">
          <span class="setting-label" style="margin:0;">角色人设 (System Prompt)</span>
          <div class="word-import-btn" @click="triggerWordUpload">导入Word</div>
        </div>
        <textarea class="setting-textarea" v-model="form.prompt" placeholder="在这里手动输入，或点击上方导入Word文档提取内容..."></textarea>
      </div>
    </div>
  </div>

  <!-- 隐藏的文件上传框 -->
  <input type="file" id="contact-avatar-upload" class="hidden-input" accept="image/*" @change="onAvatarUpload">
  <input type="file" id="word-upload" class="hidden-input" accept=".docx" @change="onWordUpload">

  <!-- 3. 自定义删除确认弹窗 (去除了所有红色，统一冰川蓝) -->
  <div class="modal-overlay" :class="{ active: isDeleteModalOpen }">
    <div class="modal-box">
      <div class="modal-title" style="color: #5b6d82;">请注意</div>
      <div style="font-size: 14px; color: #555; margin-bottom: 24px; line-height: 1.6; white-space: pre-wrap; text-align: left;">
        确定要彻底删除联系人【{{ contactToDelete?.name }}】吗？<br><br>删除后，与 TA 的角色设定、聊天气泡、以及所有私密手账本都将被彻底抹除，不可恢复！
      </div>
      <div class="modal-buttons">
        <div class="modal-btn cancel-btn" @click="isDeleteModalOpen = false">取消</div>
        <div class="modal-btn confirm-btn" @click="executeDelete">删除</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import mammoth from 'mammoth'
import { initDB } from '../utils/db.js'

const props = defineProps({ isOpen: Boolean })
// 【修复】：正确声明 openChat 信号
const emit = defineEmits(['close', 'openChat'])

const closeApp = () => { emit('close') }

const contactsList = ref([])
const isEditing = ref(false)
const form = ref({ id: '', name: '', nickname: '', gender: '男', prompt: '', avatar: '' })

watch(() => props.isOpen, (newVal) => {
  if (newVal) { loadContacts(); isEditing.value = false }
})

const loadContacts = async () => {
  const db = await initDB()
  db.transaction(['contacts_profiles'], 'readonly').objectStore('contacts_profiles').getAll().onsuccess = (e) => {
    contactsList.value = e.target.result || []
  }
}

const openEdit = (contact = null) => {
  if (contact) form.value = { ...contact }
  else form.value = { id: '', name: '', nickname: '', gender: '男', prompt: '', avatar: '' }
  isEditing.value = true
}

// 保存联系人
const saveContact = async () => {
  if (!form.value.name.trim()) { alert("角色名必须填写哦！"); return; }
  const db = await initDB()
  const dataToSave = { ...form.value }
  if (!dataToSave.id) dataToSave.id = 'contact_' + Date.now()

  // 【核心修复】：脱掉 Vue 的 Proxy 隐身衣，转换成纯净对象！
  const plainObject = JSON.parse(JSON.stringify(dataToSave))

  db.transaction(['contacts_profiles'], 'readwrite').objectStore('contacts_profiles').put(plainObject).onsuccess = () => {
    isEditing.value = false
    loadContacts()
  }
}

const triggerAvatarUpload = () => { document.getElementById('contact-avatar-upload').click() }
const onAvatarUpload = (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas'); let size = 150; canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d'); let min = Math.min(img.width, img.height);
      let sx = (img.width - min) / 2, sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      form.value.avatar = canvas.toDataURL('image/png');
    }; img.src = evt.target.result;
  }; reader.readAsDataURL(file); e.target.value = '';
}

const triggerWordUpload = () => { document.getElementById('word-upload').click() }
const onWordUpload = (e) => {
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    mammoth.extractRawText({arrayBuffer: evt.target.result})
      .then(result => { form.value.prompt = result.value })
      .catch(() => alert("解析失败，请确保上传的是 .docx 文档！"));
  }; reader.readAsArrayBuffer(file); e.target.value = '';
}

// 【修复】：点击聊天后，关掉联系人面板，通知大本营打开聊天室！
const alertChat = (contact) => {
  emit('close')
  emit('openChat', contact)
}

const isDeleteModalOpen = ref(false)
const contactToDelete = ref(null)
const confirmDelete = (contact) => { contactToDelete.value = contact; isDeleteModalOpen.value = true }
const executeDelete = async () => {
  if (!contactToDelete.value) return
  const id = contactToDelete.value.id
  const db = await initDB()
  const tx = db.transaction(['contacts_profiles', 'chat_history_db', 'diary_db'], 'readwrite')
  tx.objectStore('contacts_profiles').delete(id)
  tx.objectStore('chat_history_db').delete(id)
  tx.objectStore('diary_db').delete(id)
  tx.oncomplete = () => { isDeleteModalOpen.value = false; contactToDelete.value = null; loadContacts() }
}
</script>

<style scoped>
/* 纯冰川蓝背景，去掉磨砂 */
#contacts-app, #contact-edit-app {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
   background: linear-gradient(to bottom, #f5f7fa, #e4ebf5);
  z-index: 60; display: flex; flex-direction: column;
  padding-top: max(50px, calc(env(safe-area-inset-top) + 20px));
  transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
#contacts-app.active, #contact-edit-app.active { transform: translateY(0); }
#contact-edit-app { z-index: 70; }

.simple-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 24px 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.05);
}
.header-title { font-size: 18px; font-weight: bold; color: var(--app-text-color); }
.header-btn { font-size: 15px; color: #5b6d82; cursor: pointer; font-weight: 500; }

.contacts-list { flex: 1; overflow-y: auto; padding: 20px 24px; }
.contact-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05);
}
.contact-left { display: flex; align-items: center; gap: 12px; }
.contact-avatar {
  width: 48px; height: 48px; border-radius: 50%; background: #e0e0e0;
}
.contact-name { font-size: 16px; font-weight: 500; color: var(--app-text-color); }
.contact-actions { display: flex; gap: 12px; }
.contact-action-btn { font-size: 13px; color: #7a94a9; cursor: pointer; background: rgba(0,0,0,0.04); padding: 5px 12px; border-radius: 12px; }

.edit-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.avatar-upload-area { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 10px; }
.avatar-preview { width: 80px; height: 80px; border-radius: 50%; background: #d4e0eb; cursor: pointer; display: flex; justify-content: center; align-items: center; color: #fff; font-size: 12px; }

.setting-group { margin-bottom: 12px; }
.setting-label { font-size: 12px; font-weight: bold; color: var(--app-text-color); margin-bottom: 6px; display: block; opacity: 0.8;}
.setting-input {
  width: 100%; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.1);
  border-radius: 10px; font-size: 13px; background: rgba(255,255,255,0.8);
  outline: none; color: var(--app-text-color); transition: border-color 0.2s;
}
.setting-input:focus { border-color: #7a94a9; }

.gender-toggle { display: flex; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; }
.gender-btn { flex: 1; text-align: center; padding: 8px 0; font-size: 13px; cursor: pointer; color: var(--app-text-color); transition: 0.2s; }
.gender-btn.active { background: #5b6d82; color: #fff; font-weight: bold; }

.textarea-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px; }
.word-import-btn { font-size: 12px; color: #fff; background: #7a94a9; padding: 4px 10px; border-radius: 6px; cursor: pointer; }
.setting-textarea { width: 100%; height: 200px; padding: 12px; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; outline: none; resize: none; background: rgba(255,255,255,0.8); color: var(--app-text-color); line-height: 1.5; }

.hidden-input { display: none; }

/* 绝美弹窗 */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  z-index: 999; display: flex; justify-content: center; align-items: center;
  opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
}
.modal-overlay.active { opacity: 1; pointer-events: auto; }
.modal-box {
  width: 80%; max-width: 320px; background: rgba(255, 255, 255, 0.9);
  border-radius: 20px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  text-align: center;
}
.modal-overlay.active .modal-box { transform: scale(1); }
.modal-title { font-size: 16px; font-weight: bold; margin-bottom: 16px; }
.modal-buttons { display: flex; gap: 12px; justify-content: center; }
.modal-btn { flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
.cancel-btn { background: rgba(0,0,0,0.05); color: #666; }
.confirm-btn { background: #5b6d82; color: #fff; }
</style>