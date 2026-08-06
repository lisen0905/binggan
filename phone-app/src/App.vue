<!-- App.vue (终极满血版：串联所有组件与全局邮件心跳) -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 导入所有九大核心组件
import ThemeApp from './components/ThemeApp.vue'
import SettingsApp from './components/SettingsApp.vue'
import ContactsApp from './components/ContactsApp.vue'
import WorldbookApp from './components/WorldbookApp.vue'
import MessagesApp from './components/MessagesApp.vue'
import ChatRoom from './components/ChatRoom.vue'
import CharSettingsApp from './components/CharSettingsApp.vue'
import DiaryApp from './components/DiaryApp.vue'
import MailApp from './components/MailApp.vue'
import MemoryApp from './components/MemoryApp.vue'
import MagazineApp from './components/MagazineApp.vue'
const targetMailId = ref(null)

import { bootUpTheme } from './utils/theme.js'
import { initDB, saveSettingData, getSettingValue } from './utils/db.js'

// 所有 App 的面板开关
const isThemeAppOpen = ref(false)
const isSettingsAppOpen = ref(false)
const isContactsAppOpen = ref(false)
const isWorldbookAppOpen = ref(false)
const isMessagesAppOpen = ref(false)
const isChatRoomOpen = ref(false)
const isCharSettingsOpen = ref(false)
const isDiaryAppOpen = ref(false)



const isMailAppOpen = ref(false)
const isMemoryAppOpen = ref(false)

// ==========================================
// 👇 把这段弄丢的拼图完整复制补回来 👇
// ==========================================
const isMagazineAppOpen = ref(false)
const reviewMagData = ref(null)

const closeMagazineApp = () => {
  isMagazineAppOpen.value = false
  setTimeout(() => {
    reviewMagData.value = null
  }, 400)
}

onMounted(() => {
  // 暴露给卡片点击调用的全局方法 (注意这里没有 atob 啦)
  window.openMagazineReview = (encodedData) => {
    try {
      reviewMagData.value = JSON.parse(decodeURIComponent(encodedData))
      isMagazineAppOpen.value = true
    } catch(e) { 
      console.error("卡片数据读取失败", e) 
    }
  }
})
// ==========================================
// 👆 补到这里结束 👆
// ==========================================



// 聊天室当前对象与消息列表刷新信号
const currentChatContact = ref(null)
const msgUpdateTick = ref(0)

// 主题与状态栏数据
const customIcons = ref({})
const currentTime = ref('00:00')
const batteryLevel = ref('100%')
const batteryColor = ref('#5b6d82')
let timeInterval = null

// ==========================================
// 全局邮件心跳引擎：薛定谔的掉落
// ==========================================
const handleTriggerGlobalMail = async (data) => {
  const { charId, isUserReply, customPrompt } = data
  const db = await initDB()
  
  const charReq = await new Promise(res => db.transaction(['contacts_profiles'], 'readonly').objectStore('contacts_profiles').get(charId).onsuccess = e => res(e.target.result))
  if (!charReq) return
  const st = charReq.settings || {}

  const histReq = await new Promise(res => db.transaction(['chat_history_db'], 'readonly').objectStore('chat_history_db').get(charId).onsuccess = e => res(e.target.result))
  const history = histReq?.messages?.slice(-150) || []
  let chatLog = history.map(m => `${m.sender === 'user' ? 'User' : charReq.name}: ${m.text}`).join('\n')

  let apiId = st.mailApiId || st.apiId
  const allApis = await new Promise(res => db.transaction(['api_profiles'], 'readonly').objectStore('api_profiles').getAll().onsuccess = e => res(e.target.result || []))
  let api = allApis.find(a => a.id === apiId) || allApis[0]
  if (!api) return

  let prompt = `你现在是“${charReq.name}”。\n`
  if (isUserReply && customPrompt) prompt += `User刚给你寄信：\n${customPrompt}\n请回信。\n`
  else {
    prompt += `根据近期聊天写信。\n【聊天记录】:\n${chatLog}\n`
    let types = ['漫时光情书', '草稿箱碎碎念']
    if (Math.random()*100 <= (st.probEmotion ?? 80)) types.push('破冰信')
    if (Math.random()*100 <= (st.probSpace ?? 5)) types.push('时空信')
    prompt += `从这选一个主题：${types.join(', ')}\n`
  }
  prompt += `必须输出纯 JSON 格式！\n{"box": "inbox 或 drafts", "sender": "发件人名字", "subject": "标题", "body": "正文", "attachment": {"name": "语音.mp3", "size": "2MB", "type": "audio"}(可选)}\n`

  try {
    const res = await fetch(api.url.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` },
      body: JSON.stringify({ model: api.model, messages: [{ role: "user", content: prompt }], temperature: 0.9 })
    })
    const d = await res.json()
    const jsonMatch = d.choices[0].message.content.match(/\{[\s\S]*\}/)
    const mailData = JSON.parse(jsonMatch[0])
    
    mailData.box = (mailData.box.includes('draft') || mailData.box.includes('草稿')) ? 'drafts' : 'inbox'
    mailData.id = 'mail_' + Date.now(); mailData.timestamp = Date.now(); mailData.isRead = false

    const mReq = await new Promise(res => db.transaction(['mail_db'], 'readonly').objectStore('mail_db').get(charId).onsuccess = e => res(e.target.result))
    let existingMails = mReq?.mails || []
    existingMails.unshift(mailData)
    
    await new Promise((res, rej) => {
      const tx = db.transaction(['mail_db'], 'readwrite')
      tx.objectStore('mail_db').put({ charId, mails: JSON.parse(JSON.stringify(existingMails)) }).onsuccess = res; tx.onerror = rej
    })

    if (!isUserReply) {
      const hTx = db.transaction(['chat_history_db'], 'readwrite')
      const hStore = hTx.objectStore('chat_history_db')
      const targetHist = await new Promise(res => hStore.get(charId).onsuccess = e => res(e.target.result)) || { charId, messages: [] }
      targetHist.messages.push({ id: 'msg_mail_'+Date.now(), sender: 'system-mail', text: mailData.sender || charReq.name, boxType: mailData.box, time: Date.now() })
      hStore.put(JSON.parse(JSON.stringify(targetHist)))
      
      // 如果你正在和TA聊天，强刷聊天室，信件卡片掉落！
      if (isChatRoomOpen.value && currentChatContact.value?.id === charId) {
        msgUpdateTick.value++
      }
    }
  } catch (err) { console.error("信件生成失败", err) }
}

// ==========================================
// 天气静默自动刷新引擎 (每天只更新一次)
// ==========================================
const refreshWeatherIfStale = async () => {
  const getLocalDateKey = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const lastDate = await getSettingValue('env_weather_date')
  if (lastDate === getLocalDateKey()) return // 今天已经拉取过了，直接跳过
  
  let coords = await getSettingValue('env_coords')
  if (!coords) return // 用户还没有授权过定位，无法拉取
  
  try {
    // 调用免费开源的天气接口
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`)
    const data = await res.json()
    if (data && data.current_weather) {
      const t = data.current_weather.temperature, code = data.current_weather.weathercode
      let desc = "多云"; if (code === 0) desc = "晴朗"; if (code > 50 && code < 70) desc = "下雨"; if (code >= 70 && code < 80) desc = "下雪"
      const weatherText = `气温 ${t}°C | ${desc}`
      await saveSettingData('env_weather', weatherText)
      await saveSettingData('env_weather_date', getLocalDateKey())
    }
  } catch (e) {
    console.error("静默刷新天气失败")
  }
}

// --- 新增功能：精细化通知与上帝视角搭话引擎 开始 ---
const isAppNotificationActive = ref(false)
const appNotificationData = ref({ charId: '', title: '', text: '', avatar: '' })
let appNotificationTimer = null
const triggerGlobalNotification = async (charId, charName, avatar, msgText) => {
  const mode = await getSettingValue('notification_mode') || 'all'
  if (mode === 'off') return
  
  const isForeground = document.visibilityState === 'visible'
  
  // 拦截：如果你当前正在这个人的聊天室里，绝对不弹任何通知，只悄悄通知聊天室刷新（如果它暴露了方法）
  if (isForeground && isChatRoomOpen.value && currentChatContact.value?.id === charId) {
    msgUpdateTick.value++
    return
  }
  // 模式1：双重通知（前台悬浮窗，后台系统推送）
  if (mode === 'all' && isForeground) {
    appNotificationData.value = { charId, title: charName, text: msgText, avatar }
    isAppNotificationActive.value = true
    if (appNotificationTimer) clearTimeout(appNotificationTimer)
    appNotificationTimer = setTimeout(() => isAppNotificationActive.value = false, 4500)
  } 
  // 模式2：系统推送（网页切后台时，或者是选了 os_only 模式）
  else if ((mode === 'all' && !isForeground) || mode === 'os_only') {
    if ('Notification' in window && Notification.permission === 'granted') {
      const noti = new Notification(charName, { body: msgText, icon: avatar || '' })
      noti.onclick = () => {
        window.focus()
        handleNotificationClickFromOS(charId)
        noti.close()
      }
    }
  }
}
const handleNotificationClick = async () => {
  isAppNotificationActive.value = false
  await handleNotificationClickFromOS(appNotificationData.value.charId)
}
const handleNotificationClickFromOS = async (charId) => {
  const db = await initDB()
  const charReq = await new Promise(res => db.transaction(['contacts_profiles'], 'readonly').objectStore('contacts_profiles').get(charId).onsuccess = e => res(e.target.result))
  if (charReq) {
    // 自动关掉所有小应用，直达聊天室
    isThemeAppOpen.value = false; isSettingsAppOpen.value = false; isContactsAppOpen.value = false; 
    isWorldbookAppOpen.value = false; isMessagesAppOpen.value = false; isCharSettingsOpen.value = false; 
    isDiaryAppOpen.value = false; isMailAppOpen.value = false; isMemoryAppOpen.value = false;
    currentChatContact.value = charReq
    isChatRoomOpen.value = true
  }
}

// --- 新增功能：暴露全局测试接口 开始 ---
onMounted(() => {
  window.testAppBanner = () => {
    appNotificationData.value = { charId: 'system_test', title: '系统测试', text: '这是一个悬浮通知测试。', avatar: '' }
    isAppNotificationActive.value = true
    if (appNotificationTimer) clearTimeout(appNotificationTimer)
    appNotificationTimer = setTimeout(() => isAppNotificationActive.value = false, 4500)
  }
  
  window.testOsNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const noti = new Notification('系统测试', { body: '这是手机推送通知测试' })
      setTimeout(() => noti.close(), 4500)
    } else {
      alert('系统推送未开启或浏览器未授权哦！请先在上方下拉框开启并授权。')
    }
  }
})
// --- 结束 ---

// 核心：上帝视角的后台心跳（1:1克隆聊天室灵魂）
let autoChatGlobalTimer = null
const startGlobalAutoChatEngine = () => {
  if (autoChatGlobalTimer) clearInterval(autoChatGlobalTimer)
  autoChatGlobalTimer = setInterval(async () => {
    const db = await initDB()
    const contacts = await new Promise(res => db.transaction(['contacts_profiles'], 'readonly').objectStore('contacts_profiles').getAll().onsuccess = e => res(e.target.result || []))
    const allApis = await new Promise(res => db.transaction(['api_profiles'], 'readonly').objectStore('api_profiles').getAll().onsuccess = e => res(e.target.result || []))
    
    for (const c of contacts) {
      const autoSt = c.settings?.autoChat
      if (!autoSt || !autoSt.enabled) continue
      
      const tx = db.transaction(['chat_history_db'], 'readonly')
      const histData = await new Promise(res => tx.objectStore('chat_history_db').get(c.id).onsuccess = e => res(e.target.result))
      const messages = histData?.messages || []
      if (messages.length === 0) continue
      
      const lastMsg = messages[messages.length - 1]
      // 逻辑判断：如果最后一条已经是 AI 说的，且 User 没回，我们要不要连发？
      // 为了自然，如果 AI 已经被冷落了，也可以连发，但需要加个超长冷却（避免轰炸）。这里我们直接用冷却时间判断。
      const thresholdMs = autoSt.unit === 'hours' ? autoSt.interval * 3600000 : autoSt.interval * 60000
      const lastTriggerTime = c.settings?.lastAutoChatTime || lastMsg.time // 记录上次触发的时间
      const diffMs = Date.now() - lastTriggerTime
      
      if (diffMs >= thresholdMs) {
        // 先给冷却打上时间戳，防止重入轰炸
        c.settings.lastAutoChatTime = Date.now()
        const updateTx = db.transaction(['contacts_profiles'], 'readwrite')
        updateTx.objectStore('contacts_profiles').put(JSON.parse(JSON.stringify(c)))
        let apiId = c.settings?.apiId
        let api = allApis.find(a => a.id === apiId) || allApis[0]
        if (!api) continue
        
        // 【1:1 克隆上帝视角提示词】
        let sp = `你现在是“${c.name}”。\n`
        if (c.prompt) sp += `【角色设定】：\n${c.prompt}\n\n`
        sp += `【特殊情境指令】：User已经有 ${autoSt.interval} ${autoSt.unit === 'hours' ? '小时' : '分钟'} 没有理你了。请结合你们近期的聊天记录，用完全符合你人设的口吻，主动发消息找TA。可以顺着之前的话题，也可以开启新话题。\n\n`
        sp += `====================\n【终极正文排版协议：XML双重包裹】\n此时此刻，你正在用手机打字。\n`
        sp += `【发送键协议】：你习惯连发短消息（约 2 到 3 条）。"|||" 等同于你按下了手机的“发送键”！你正文里的每一句短话，必须用 "|||" 隔开！\n`
        sp += `【包裹红线】：你真正要发送给User的台词，必须且只能放在 <reply> 和 </reply> 标签之间！\n`
        sp += `【绝对禁止】：<reply> 标签内绝对禁止写 "1. 2. 3." 等列表序号！绝对禁止使用 "(动作)" 等括号描写！\n`
        sp += `【绝对正确示例】：\n<reply>在干嘛呢|||怎么不理我了|||是不是在忙呀</reply>\n`
        
        let historyForApi = messages.slice(-20).map(msg => ({ 
          role: msg.sender === 'user' ? 'user' : 'assistant', 
          content: msg.text 
        }))
        
        try {
          const res = await fetch(api.url.replace(/\/+$/, '') + '/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` },
            body: JSON.stringify({ model: api.model, messages: [ { role: "system", content: sp }, ...historyForApi ], temperature: 0.8 })
          })
          const d = await res.json()
          let rawText = d.choices[0].message.content || ""
          
          // 【1:1 后台静默剥离逻辑】
          let cleanText = rawText.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim()
          const replyMatch = cleanText.match(/<reply>([\s\S]*?)(?:<\/reply>|$)/i);
          if (replyMatch) cleanText = replyMatch[1].trim();
          cleanText = cleanText.replace(/[\(（\*].*?[\)）\*]/g, '').trim(); 
          cleanText = cleanText.replace(/^\s*\d+[\.、]\s*/gm, '').trim();
          
          let parts = cleanText.split('|||').map(p => p.trim()).filter(p => p);
          if (parts.length > 0) {
            // 存入数据库
            const writeTx = db.transaction(['chat_history_db'], 'readwrite')
            const store = writeTx.objectStore('chat_history_db')
            const freshHist = await new Promise(r => store.get(c.id).onsuccess = e => r(e.target.result))
            
            for (let chunk of parts) {
              freshHist.messages.push({ id: 'msg_auto_'+Date.now()+Math.random(), sender: 'char', text: chunk, time: Date.now() })
            }
            await new Promise(r => { store.put(freshHist).onsuccess = r })
            
            // 触发双重通知！用拼起来的内容展示，或者只展示第一句作为预览
            triggerGlobalNotification(c.id, (c.settings?.remark || c.name), c.avatar, parts.join(' '))
          }
        } catch (err) { console.error("上帝视角搭话生成失败", err) }
      }
    }
  }, 30000) // 每 30 秒扫描一次全局
}
// --- 结束 ---

// ==========================================
// 初始化与生命周期
// ==========================================
const updateTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
}

let globalMailHeartbeatTimer = null

onMounted(async () => {
  bootUpTheme()
  const savedIcons = await getSettingValue('theme_icons')
  if (savedIcons) customIcons.value = savedIcons

  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  
 // 新增：激活天气刷新引擎
  refreshWeatherIfStale()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshWeatherIfStale()
  })
  // 新增结束



  if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
      const updateBattery = () => {
        batteryLevel.value = Math.round(battery.level * 100) + '%'
        batteryColor.value = battery.level <= 0.2 ? '#e57373' : 'var(--status-bar-color)'
      }
      updateBattery()
      battery.addEventListener('levelchange', updateBattery)
    })
  }

  // 启动全局邮箱心跳
  globalMailHeartbeatTimer = setInterval(async () => {
    const db = await initDB()
    const contacts = await new Promise(res => db.transaction(['contacts_profiles'], 'readonly').objectStore('contacts_profiles').getAll().onsuccess = e => res(e.target.result || []))
    for (const c of contacts) {
      const hist = await new Promise(res => db.transaction(['chat_history_db'], 'readonly').objectStore('chat_history_db').get(c.id).onsuccess = e => res(e.target.result?.messages || []))
      if (hist.length < 5) continue
      
      const st = c.settings || {}
      let cdMs = (st.mailCdNum ?? 3) * (st.mailCdUnit === 'seconds' ? 1000 : st.mailCdUnit === 'minutes' ? 60000 : 3600000)
      
      const mReq = await new Promise(res => db.transaction(['mail_db'], 'readonly').objectStore('mail_db').get(c.id).onsuccess = e => res(e.target.result))
      const existM = mReq?.mails || []
      
      if (existM.length > 0 && Date.now() - existM[0].timestamp < cdMs) continue
      if (existM.length === 0 && Date.now() - hist[0].time < cdMs) continue
      
      if (Math.random() * 100 <= (st.probDaily ?? 20)) {
        setTimeout(() => handleTriggerGlobalMail({ charId: c.id, isUserReply: false }), Math.floor(Math.random()*7000)+8000)
      }
    }
  }, 10000)

  // --- 新增功能：启动上帝视角搭话引擎 ---
  startGlobalAutoChatEngine()
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (globalMailHeartbeatTimer) clearInterval(globalMailHeartbeatTimer)
  if (autoChatGlobalTimer) clearInterval(autoChatGlobalTimer)
})

const openApp = (appName) => {
  if (appName === '主题美化') isThemeAppOpen.value = true 
  else if (appName === '设置') isSettingsAppOpen.value = true 
  else if (appName === '联系人') isContactsAppOpen.value = true 
  else if (appName === '世界书') isWorldbookAppOpen.value = true 
  else if (appName === '消息') isMessagesAppOpen.value = true 
  // --- 新增功能：将旧的聊天室调用改为打开独立 App 开始 ---
  else if (appName === '记忆库') isMemoryAppOpen.value = true 
  // --- 结束 ---
  else alert(`你点击了打开：${appName}！`)
}

const handleIconChange = async (data) => {
  const { appName, url } = data
  customIcons.value[appName] = url
  await saveSettingData('theme_icons', JSON.parse(JSON.stringify(customIcons.value)))
}

const handleOpenChat = (contact) => {
  currentChatContact.value = contact
  isChatRoomOpen.value = true
}

const handleCloseChatRoom = () => {
  isChatRoomOpen.value = false
  msgUpdateTick.value++ 
}

// 从聊天室打开角色设定
const handleOpenCharSettings = () => {
  isCharSettingsOpen.value = true
}
const handleCharSettingSaved = (updatedContact) => {
  currentChatContact.value = updatedContact
}
const handleCharDeleted = () => {
  isCharSettingsOpen.value = false
  isChatRoomOpen.value = false
  msgUpdateTick.value++ 
}

// ！！！ 这里就是刚才漏掉的打开手账本和邮箱的函数 ！！！
const handleOpenDiary = () => { isDiaryAppOpen.value = true }
const handleOpenMail = () => { isMailAppOpen.value = true }

</script>

<template>
  <div id="phone-screen">
  <!-- --- 新增功能：App 内悬浮通知横幅 开始 --- -->
    <div class="app-notification-banner" :class="{ active: isAppNotificationActive }" @click="handleNotificationClick">
      <div class="app-noti-avatar" :style="appNotificationData.avatar ? `background-image:url(${appNotificationData.avatar})` : ''"></div>
      <div class="app-noti-content">
        <div class="app-noti-title">{{ appNotificationData.title }}</div>
        <div class="app-noti-desc">{{ appNotificationData.text }}</div>
      </div>
    </div>
    <!-- --- 结束 --- -->

    <!-- 顶部状态栏 -->
    <div id="status-bar">
      <div class="time">{{ currentTime }}</div>
      <div class="battery-container">
        <div class="battery-body" :style="{ borderColor: batteryColor }">
          <div class="battery-level" :style="{ width: batteryLevel, backgroundColor: batteryColor }"></div>
        </div>
      </div>
    </div>

    <!-- 桌面内容区 -->
    <div id="desktop-content">
      <div class="app-item" @click="openApp('联系人')">
        <div class="app-icon" :style="customIcons['联系人'] ? { background: `url(${customIcons['联系人']}) center/cover no-repeat`, backgroundColor: 'transparent', boxShadow: 'none' } : {}">
          <svg v-if="!customIcons['联系人']" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5l-1.45-1.32C7.4 10.36 4 7.28 4 3.5 4 2.42 6.42 0 9.5 0c1.74 0 3.41.81 4.5 2.09C15.09 1.81 16.76 1 18.5 1 21.58 1 24 3.42 24 6.5c0 3.78-3.4 6.86-8.55 11.54L12 14.5z" transform="scale(0.8) translate(3, 4)"/></svg>
        </div>
        <div class="app-name">联系人</div>
      </div>
      
      <div class="app-item" @click="openApp('消息')">
        <div class="app-icon" :style="customIcons['消息'] ? { background: `url(${customIcons['消息']}) center/cover no-repeat`, backgroundColor: 'transparent', boxShadow: 'none' } : {}">
          <svg v-if="!customIcons['消息']" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
        </div>
        <div class="app-name">消息</div>
      </div>

      <div class="app-item" @click="openApp('世界书')">
        <div class="app-icon" :style="customIcons['世界书'] ? { background: `url(${customIcons['世界书']}) center/cover no-repeat`, backgroundColor: 'transparent', boxShadow: 'none' } : {}">
          <svg v-if="!customIcons['世界书']" viewBox="0 0 24 24" fill="currentColor"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-.1zM12 18.5c-1.15-.45-2.85-.9-4.5-.9-1.3 0-2.8.2-4 .7V7c1.2-.5 2.7-.7 4-.7 1.65 0 3.35.45 4.5.9v11.3zM14.5 12h5v-2h-5v2zm0 4h5v-2h-5v2zm0-8h5V6h-5v2z"/></svg>
        </div>
        <div class="app-name">世界书</div>
      </div>

      <!-- --- 新增功能：桌面记忆库图标替换 开始 --- -->
      <div class="app-item" @click="openApp('记忆库')">
        <div class="app-icon" :style="customIcons['记忆库'] ? { background: `url(${customIcons['记忆库']}) center/cover no-repeat`, backgroundColor: 'transparent', boxShadow: 'none' } : {}">
          <!-- 极简日记本/书签 SVG 图标 -->
          <svg v-if="!customIcons['记忆库']" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-6 13.2l-3-1.6-3 1.6V4h6v11.2z"/>
          </svg>
        </div>
        <div class="app-name">记忆库</div>
      </div>
      <!-- --- 结束 --- -->

       <!-- --- 新增功能：桌面杂志特刊图标 开始 --- -->
      <div class="app-item" @click="isMagazineAppOpen = true">
        <div class="app-icon" :style="customIcons['特刊'] ? { background: `url(${customIcons['特刊']}) center/cover no-repeat`, backgroundColor: 'transparent', boxShadow: 'none' } : {}">
          <!-- 复古报纸/阅读 SVG 图标 -->
          <svg v-if="!customIcons['特刊']" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 4h2l1-4h6l1 4h2l-1-4h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11zM6 7h5v2H6zm0 4h12v2H6z"/>
          </svg>
        </div>
        <div class="app-name">特刊</div>
      </div>
      <!-- --- 结束 --- -->

    </div>

    <!-- 底部 Dock 栏 -->
    <div id="dock">
      <div class="app-item" @click="openApp('主题美化')">
        <div class="app-icon" style="background-color: rgba(255,255,255,0.6);"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7l2.5-1.4zM19.5 15.4L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14l2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zm-7.63 5.29c-.39-.39-1.02-.39-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.71 11.04c.39-.39.39-1.02 0-1.41l-2.34-2.34z"/></svg></div>
      </div>
      <div class="app-item" @click="openApp('设置')">
        <div class="app-icon" style="background-color: rgba(255,255,255,0.6);"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.4 13c.1-.3.1-.6.1-1s0-.7-.1-1l2.1-1.7c.2-.2.2-.4.1-.6l-2-3.5c-.1-.2-.3-.3-.5-.2l-2.5 1c-.5-.4-1.1-.7-1.7-1l-.4-2.6c0-.2-.2-.4-.4-.4h-4c-.2 0-.4.2-.4.4l-.4 2.7c-.6.3-1.2.6-1.7 1L5 5.1c-.2-.1-.4 0-.5.2l-2 3.4c-.1.2-.1.5.1.6L4.7 11c-.1.3-.1.6-.1 1s0 .7.1 1l-2.1 1.7c-.2.2-.2.4-.1.6l2 3.5c.1.2.3.3.5.2l2.5-1c.5.4 1.1.7 1.7 1l.4 2.6c0 .2.2.4.4.4h4c.2 0 .4-.2.4-.4l.4-2.7c.6-.3 1.2-.6 1.7-1l2.5 1c.2.1.4 0 .5-.2l2-3.4c.1-.2.1-.5-.1-.6l-2.1-1.6zM12 15.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/></svg></div>
      </div>
      <div class="app-item">
        <div class="app-icon" style="background-color: rgba(255,255,255,0.6);"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg></div>
      </div>
      <div class="app-item">
        <div class="app-icon" style="background-color: rgba(255,255,255,0.6);"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></div>
      </div>
    </div>

    <!-- 召唤所有面板组件 -->
    <ThemeApp :isOpen="isThemeAppOpen" @close="isThemeAppOpen = false" @changeIcon="handleIconChange" />
    <SettingsApp :isOpen="isSettingsAppOpen" @close="isSettingsAppOpen = false" />
    
    <ContactsApp 
      :isOpen="isContactsAppOpen" 
      @close="isContactsAppOpen = false" 
      @openChat="handleOpenChat"
    />
    
    <WorldbookApp :isOpen="isWorldbookAppOpen" @close="isWorldbookAppOpen = false" />

    <MessagesApp 
      :isOpen="isMessagesAppOpen" 
      :updateTick="msgUpdateTick"
      @close="isMessagesAppOpen = false" 
      @openChat="handleOpenChat"
    />
    
    <ChatRoom 
      :isOpen="isChatRoomOpen" 
      :contact="currentChatContact"
      @close="handleCloseChatRoom"
      @openSettings="handleOpenCharSettings"
      @openMail="(id) => { targetMailId = id; isMailAppOpen = true }"
      @openMagazine="(data) => { reviewMagData = data; isMagazineAppOpen = true }"
    />

    <CharSettingsApp
      :isOpen="isCharSettingsOpen"
      :contact="currentChatContact"
      @close="isCharSettingsOpen = false"
      @settingSaved="handleCharSettingSaved"
      @charDeleted="handleCharDeleted"
      @openDiary="handleOpenDiary" 
      @openMail="handleOpenMail" 
    />

    <DiaryApp
      :isOpen="isDiaryAppOpen"
      :contact="currentChatContact"
      @close="isDiaryAppOpen = false"
    />

  <MailApp
      :isOpen="isMailAppOpen"
      :contact="currentChatContact"
      :targetMailId="targetMailId"
      @close="isMailAppOpen = false; targetMailId = null"
      @triggerGlobalMail="handleTriggerGlobalMail"
    />


<MagazineApp 
      :isOpen="isMagazineAppOpen"
      :reviewData="reviewMagData"
      @close="closeMagazineApp"
      @openChat="(contact) => { closeMagazineApp(); handleOpenChat(contact); }"
    />


<MemoryApp 
      :isOpen="isMemoryAppOpen" 
      @close="isMemoryAppOpen = false" 
    />


  </div>
</template>

<style>
/* --- 全局 CSS 保持不变 --- */
:root {
  --desktop-bg: linear-gradient(135deg, #e6eff5 0%, #d4e0eb 100%);
  --status-bar-color: #5b6d82; 
  --app-text-color: #5b6d82;
  --icon-bg-color: #f2f6f9;
  --icon-svg-color: #7a94a9;
  --dock-bg: rgba(230, 239, 245, 0.45);
  --main-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; user-select: none; -webkit-tap-highlight-color: transparent; }
input, textarea, [contenteditable] { user-select: auto !important; -webkit-user-select: auto !important; }
body, html { width: 100%; height: 100%; overflow: hidden; font-family: var(--main-font); background-color: #000; }
#phone-screen { width: 100vw; height: 100vh; background: var(--desktop-bg); display: flex; flex-direction: column; position: relative; }

/* ==========================================
   【修改点1：让状态栏绝对悬浮在最高层，且不可点击阻挡操作】
   ========================================== */
#status-bar { 
  position: absolute; 
  top: 0; 
  left: 0; 
  width: 100%; 
  z-index: 9999; 
  pointer-events: none; /* 变成幻影，不挡住底下的按钮点击 */
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: max(12px, env(safe-area-inset-top)) 24px 10px 24px; 
  font-size: 14px; 
  font-weight: 600; 
  color: var(--status-bar-color); 
}
.battery-container { display: flex; align-items: center; gap: 5px; }
.battery-body { width: 22px; height: 11px; border: 1px solid var(--status-bar-color); border-radius: 3px; position: relative; padding: 1px; }
.battery-body::after { content: ''; position: absolute; right: -4px; top: 2px; width: 2px; height: 4px; background-color: var(--status-bar-color); border-radius: 0 2px 2px 0; }
.battery-level { height: 100%; border-radius: 1px; transition: width 0.3s; }

/* ==========================================
   【修改点2：由于状态栏悬浮了，给桌面顶部让出一些空间防遮挡】
   ========================================== */
#desktop-content { flex: 1; padding: 20px; padding-top: max(50px, calc(env(safe-area-inset-top) + 20px)); display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 90px; gap: 15px 10px; }

.app-item { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
.app-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(91, 109, 130, 0.1); background-color: var(--icon-bg-color); color: var(--icon-svg-color); }
.app-icon svg { width: 28px; height: 28px; }
.app-name { margin-top: 6px; font-size: 12px; color: var(--desktop-icon-color, #5b6d82); text-shadow: 0 1px 2px rgba(255,255,255,0.4); }
#dock { margin: 0 16px max(16px, env(safe-area-inset-bottom)) 16px; height: 80px; background: var(--dock-bg); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border-radius: 28px; display: flex; justify-content: space-around; align-items: center; padding: 0 10px; border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 8px 20px rgba(91, 109, 130, 0.08); }
#dock .app-item { justify-content: center; }
#dock .app-icon { width: 50px; height: 50px; box-shadow: none; background-color: rgba(255,255,255,0.6); }
#dock .app-name { display: none; }

/* --- 新增功能：App内系统横幅美化 开始 --- */
.app-notification-banner {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  left: 4%; width: 92%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  padding: 12px 16px;
  display: flex; align-items: center; gap: 12px;
  z-index: 10000; /* 绝对置顶，盖过状态栏 */
  transform: translateY(-150%);
  opacity: 0; pointer-events: none;
  transition: all 0.5s cubic-bezier(0.25, 1.2, 0.25, 1);
  border: 1px solid rgba(0,0,0,0.05);
  cursor: pointer;
}
.app-notification-banner.active {
  transform: translateY(0);
  opacity: 1; pointer-events: auto;
}
.app-notification-banner:active { transform: scale(0.96); }

.app-noti-avatar { width: 44px; height: 44px; border-radius: 50%; background-size: cover; background-position: center; border: 1px solid rgba(0,0,0,0.05); flex-shrink: 0; }
.app-noti-content { display: flex; flex-direction: column; overflow: hidden; flex: 1; justify-content: center; }
.app-noti-title { font-size: 15px; font-weight: bold; color: #222; margin-bottom: 2px; }
.app-noti-desc { font-size: 13px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
/* --- 结束 --- */

</style>