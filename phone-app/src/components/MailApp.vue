<!-- components/MailApp.vue -->
<template>
  <div style="z-index: 105;">
    <!-- 1. 列表页 -->
 <div id="mail-list-app" class="mail-app-screen" :class="{ active: isOpen }">
      <div class="simple-header">
        <div class="header-btn" @click="closeApp">‹ 退出</div>
        <div class="header-title">{{ contact?.name || 'TA' }}的信箱</div>
        <div class="header-btn" style="color:#5b6d82; font-weight:bold;" @click="openCompose">写信</div>
      </div>
      <div class="mail-tabs">
        <div class="mail-tab" :class="{ active: activeTab === 'inbox' }" @click="switchTab('inbox')">收件箱</div>
        <div class="mail-tab" :class="{ active: activeTab === 'drafts' }" @click="switchTab('drafts')">草稿箱</div>
      </div>
      <div class="mail-list">
        <div v-if="filteredMails.length === 0" style="text-align:center; color:#999; font-size:13px; margin-top:50px;">
          时光邮局筹备中...<br>等待第一封来信。
        </div>
        <div v-else class="mail-item" v-for="m in filteredMails" :key="m.id" @click="openRead(m)">
          <div class="mail-item-header">
            <div class="mail-sender"><div v-if="!m.isRead" class="unread-dot"></div>{{ m.sender || 'TA' }} {{ m.attachment ? '📎' : '' }}</div>
            <div class="mail-time">{{ formatTime(m.timestamp) }}</div>
          </div>
          <div class="mail-subject"><b>{{ m.subject || '无主题' }}</b></div>
          <div class="mail-snippet">{{ m.body ? m.body.substring(0, 30).replace(/\n/g, ' ') : '' }}...</div>
        </div>
      </div>
    </div>

    <!-- 2. 阅读页 -->
    <!-- 2. 阅读页 (保持不变，覆盖在列表页上面) -->
    <div id="mail-reader-app" class="mail-app-screen" :class="{ active: isOpen && isReading }">
      <div class="simple-header">
<div class="header-btn" @click="isReading = false">‹ 返回</div>
        <div class="header-btn" style="color:#5b6d82; font-weight:bold;" @click="openCompose">↩ 回复</div>
      </div>
      <div v-if="currentMail" class="mail-reader-meta">
        <div class="meta-row"><div class="meta-label">发件人:</div><div class="meta-value">{{ currentMail.sender || 'TA' }}</div></div>
        <div class="meta-row"><div class="meta-label">收件人:</div><div class="meta-value">我</div></div>
        <div class="meta-row" v-if="currentMail.cc"><div class="meta-label">抄 送:</div><div class="meta-value">{{ currentMail.cc }}</div></div>
        <div class="meta-row"><div class="meta-label">日 期:</div><div class="meta-value" style="color:#888;">{{ formatTime(currentMail.timestamp) }}</div></div>
        <div class="meta-row" style="margin-top:8px;"><div class="meta-label">主 题:</div><div class="meta-value" style="font-weight:bold;">{{ currentMail.subject || '无主题' }}</div></div>
      </div>
      <div v-if="currentMail" class="mail-reader-body" :style="currentMail.box === 'drafts' ? 'background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.03) 100%);' : ''">
        <div style="white-space: pre-wrap;">{{ currentMail.body }}</div>
        <div v-if="currentMail.attachment" class="mail-attachments">
          <div class="attachment-item">
            <div class="attachment-icon">{{ getAttachmentIcon(currentMail.attachment) }}</div>
            <div class="attachment-info">
              <div class="attachment-name">{{ currentMail.attachment.name }}</div>
              <div class="attachment-size">{{ currentMail.attachment.size || '未知大小' }}</div>
            </div>
          </div>
          <div v-if="currentMail.attachment.type === 'audio'" class="audio-card" style="margin-top:10px; transform:none; box-shadow:none; border:1px solid rgba(0,0,0,0.1);">
            <div class="play-btn">▶</div><div class="wave-container"><div class="waveform"></div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 写信页 -->
    <!-- 3. 写信页 (保持不变，覆盖在列表页上面) -->
    <div id="mail-compose-app" class="mail-app-screen" :class="{ active: isOpen && isComposing }">
      <div class="simple-header">
        <div class="header-btn" @click="isComposing = false">取消</div>
        <div class="header-title">新邮件</div>
        <div class="header-btn" style="color:#5b6d82; font-weight:bold;" @click="sendMail">发送</div>
      </div>
      <div class="mail-compose-area">
        <div style="padding: 10px 24px; border-bottom: 1px solid rgba(0,0,0,0.05); font-size:14px; color:#888;">
          收件人：<span style="color:#000; font-weight:500;">{{ contact?.name }}</span>
        </div>
        <input type="text" class="compose-input compose-subject" v-model="composeForm.subject" placeholder="主题：">
        <textarea class="compose-input compose-body" v-model="composeForm.body" placeholder="写下你想对 TA 说的话..."></textarea>
        
        <div class="time-post-office">
          <div class="tpo-label">时光邮局投递设定</div>
          <select class="tpo-select" v-model="composeForm.delay">
            <option value="0">即时投递</option>
            <option value="1">明天早晨 8:00 送达</option>
            <option value="2">深夜 2:00 偷偷塞进信箱</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { initDB } from '../utils/db.js'

const props = defineProps({ 
  isOpen: Boolean, 
  contact: Object,
  targetMailId: String // 接收外面传进来的邮件ID
})
const emit = defineEmits(['close', 'triggerGlobalMail'])

const allMails = ref([])
const activeTab = ref('inbox')
const isReading = ref(false)
const isComposing = ref(false)
const currentMail = ref(null)
const composeForm = ref({ subject: '', body: '', delay: '0' })

const closeApp = () => emit('close')
const formatTime = (ts) => { const d = new Date(ts); return `${d.getMonth()+1}-${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` }
const getAttachmentIcon = (att) => { if (att.type === 'audio' || att.name.includes('.mp3')) return '🎵'; if (att.name.includes('pdf')) return '🗺️'; return '📎' }

const filteredMails = computed(() => allMails.value.filter(m => m.box === activeTab.value))

// 确保数据加载完毕的 Promise
const loadMails = () => {
  return new Promise(async (resolve) => {
    const db = await initDB()
    db.transaction(['mail_db'], 'readonly').objectStore('mail_db').get(props.contact.id).onsuccess = (e) => {
      allMails.value = e.target.result?.mails || []
      resolve()
    }
  })
}

// 监听打开状态
watch(() => props.isOpen, async (newVal) => {
  if (newVal && props.contact) {
    // 进门时先重置状态，让阅读页和写信页都藏起来
    isReading.value = false; 
    isComposing.value = false;
    await loadMails()
    
    // 如果外面传了目标邮件ID，直接翻出那封信盖在列表上面！
    if (props.targetMailId) {
      const target = allMails.value.find(m => String(m.id || m.timestamp) === String(props.targetMailId))
      if (target) {
        openRead(target)
      }
    }
  }
})

const switchTab = (tab) => { activeTab.value = tab }

const openRead = async (mail) => {
  currentMail.value = mail
  isReading.value = true
  if (!mail.isRead) {
    mail.isRead = true
    const db = await initDB()
    const tx = db.transaction(['mail_db'], 'readwrite')
    tx.objectStore('mail_db').put({ charId: props.contact.id, mails: JSON.parse(JSON.stringify(allMails.value)) })
  }
}

const openCompose = () => {
  composeForm.value = { subject: '', body: '', delay: '0' }
  isReading.value = false; isComposing.value = true
}

const sendMail = () => {
  if (!composeForm.value.body.trim()) { alert("信件内容不能为空哦！"); return }
  const content = `主题：${composeForm.value.subject}\n正文：${composeForm.value.body}`
  isComposing.value = false
  
  if (composeForm.value.delay === '0') {
    alert("信件已嗖地一下飞到 TA 的案头！\n请稍后留意聊天室的新信件掉落提示卡！")
    emit('triggerGlobalMail', { charId: props.contact.id, isUserReply: true, customPrompt: content })
  } else {
    alert("信件已成功装入时光胶囊！\n系统将在你设定的时间准时投递。")
    setTimeout(() => { emit('triggerGlobalMail', { charId: props.contact.id, isUserReply: true, customPrompt: content }) }, 8000)
  }
}
</script>

<style scoped>
/* ==========================================
   📧 【专属邮箱 App】全套视觉样式
   ========================================== */
/* 邮箱通用外壳 */
.mail-app-screen {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: #f5f6f8; z-index: 105; /* 层级比手账还高一点 */
    display: flex; flex-direction: column;
    padding-top: max(50px, calc(env(safe-area-inset-top) + 20px));
    transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.mail-app-screen.active { transform: translateX(0); }

/* 极简顶栏 */
.simple-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 24px 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.05); }
.header-title { font-size: 18px; font-weight: bold; color: #5b6d82; }
.header-btn { font-size: 15px; color: #5b6d82; cursor: pointer; font-weight: 500; }

/* --- 1. 列表页样式 --- */
.mail-tabs { display: flex; padding: 0 24px 10px 24px; gap: 15px; border-bottom: 1px solid rgba(0,0,0,0.05); }
.mail-tab { font-size: 15px; font-weight: bold; color: #999; cursor: pointer; transition: 0.2s; }
.mail-tab.active { color: #2c3e50; font-size: 18px; }
.mail-list { flex: 1; overflow-y: auto; padding: 10px 0; }
.mail-item { padding: 15px 24px; border-bottom: 1px solid rgba(0,0,0,0.03); background: #fff; cursor: pointer; }
.mail-item:active { background: #f9f9f9; }
.mail-item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.mail-sender { font-size: 15px; font-weight: bold; color: #000; display: flex; align-items: center; gap: 6px; }
.unread-dot { width: 8px; height: 8px; background: #007aff; border-radius: 50%; }
.mail-time { font-size: 12px; color: #888; }
.mail-subject { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 4px; }
.mail-snippet { font-size: 13px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* --- 2. 沉浸阅读页样式 --- */
.mail-reader-meta { background: #fff; padding: 15px 24px; border-bottom: 1px solid rgba(0,0,0,0.05); }
.meta-row { font-size: 13px; color: #555; margin-bottom: 4px; display: flex; }
.meta-label { width: 50px; color: #888; }
.meta-value { flex: 1; font-weight: 500; color: #000; }
.mail-reader-body { flex: 1; overflow-y: auto; padding: 24px; background: #fff; font-family: "Songti SC", "STSong", serif; font-size: 16px; line-height: 1.8; color: #222; }

/* 附件卡片区 */
.mail-attachments { margin-top: 30px; padding-top: 20px; border-top: 1px dashed rgba(0,0,0,0.1); }
.attachment-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f5f6f8; border-radius: 10px; margin-bottom: 10px; cursor: pointer; }
.attachment-icon { font-size: 24px; }
.attachment-info { flex: 1; }
.attachment-name { font-size: 13px; font-weight: bold; color: #333; }
.attachment-size { font-size: 11px; color: #888; }

/* 原有保留：附件里的内嵌语音样式（用于显示纯语音附件） */
.audio-card { background: rgba(255,255,255,0.8); padding: 15px; border-radius: 30px; display: flex; align-items: center; gap: 15px; }
.play-btn { width: 40px; height: 40px; border-radius: 50%; background: #5b6d82; color: #fff; display: flex; justify-content: center; align-items: center; }
.wave-container { flex: 1; }
.waveform { height: 15px; background: repeating-linear-gradient(90deg, #5b6d82, #5b6d82 3px, transparent 3px, transparent 5px); width: 80%; opacity: 0.7;}

/* --- 3. 写信/时光邮局页样式 --- */
.mail-compose-area { flex: 1; display: flex; flex-direction: column; background: #fff; }
.compose-input { width: 100%; border: none; outline: none; font-size: 15px; color: #000; font-family: inherit; }
.compose-subject { padding: 15px 24px; border-bottom: 1px solid rgba(0,0,0,0.05); font-weight: bold; }
.compose-body { flex: 1; padding: 20px 24px; resize: none; line-height: 1.6; }
/* 底部时光邮局设置 */
.time-post-office { background: #f9f9fa; padding: 15px 24px; border-top: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; padding-bottom: max(15px, env(safe-area-inset-bottom)); }
.tpo-label { font-size: 13px; font-weight: bold; color: #5b6d82; display: flex; align-items: center; gap: 6px; }
.tpo-select { border: none; background: rgba(0,0,0,0.05); padding: 6px 10px; border-radius: 8px; font-size: 13px; color: #333; outline: none; }
</style>