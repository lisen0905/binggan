<!-- components/DiaryApp.vue -->
<template>
  <div id="diary-app" :class="{ active: isOpen }">
    <div class="simple-header" style="background: transparent; border-bottom: none; padding-bottom: 10px;">
      <div class="header-btn" @click="closeApp">‹ 返回</div>
      <div class="header-title" style="letter-spacing: 2px; font-size: 18px;">我的手账</div>
      <div class="header-btn" style="opacity: 0;">占位</div>
    </div>

    <div class="diary-canvas">
      <div class="flower-specimen" style="position:fixed; font-size: 60px; right: -10px; top: 20px; filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.1)) sepia(0.5); opacity: 0.6;">🍂</div>
      
      <div v-if="pages.length === 0" style="width: 100%; display:flex; justify-content:center; align-items:center; text-align:center; color:#999; font-size:13px; margin-top:50px;">
        手账本空空如也...<br><br>点击右下角的羽毛笔，<br>让 TA 悄悄记录今天吧 ✨
      </div>

      <div class="diary-page" v-for="(page, index) in pages" :key="page.id">
        <div class="page-header">
          <div class="page-date">📅 {{ formatTime(page.timestamp) }} <span style="font-size:10px;font-weight:normal;opacity:0.6;">(第 {{ pages.length - index }} 篇)</span></div>
          <div class="page-star" :class="{ active: page.isFavorited }" @click="toggleFavorite(page)">{{ page.isFavorited ? '🌟' : '⭐' }}</div>
        </div>
        
        <div v-for="(card, cIdx) in page.cards" :key="cIdx">
          <!-- 拍立得 -->
          <div v-if="card.type === 'polaroid'" class="polaroid-card">
            <div class="tape"></div>
            <div class="polaroid-img" :style="`background-image: url('https://loremflickr.com/400/400/cute,pet,scenery?lock=${page.timestamp}'); background-size: cover; background-position: center;`"></div>
            <div class="polaroid-text"><span style="font-weight:bold; font-size:12px; color:#888;">{{ card.content.weather }}</span><br>{{ card.content.text }}</div>
          </div>
          <!-- 便利贴 -->
          <div v-else-if="card.type === 'sticky'" class="sticky-note">
            <div class="tape" style="transform: translateX(-50%) rotate(2deg); background: rgba(255,193,7,0.3);"></div>
            <div class="user-writing"><span style="font-size:11px; color:#888;">你 留言：</span><br>{{ card.content.userMsg }}</div>
            <div class="char-reply">{{ card.content.charReply }}</div><div class="pen-mark">已阅 ✔</div>
          </div>
          <!-- 剪报 -->
          <div v-else-if="card.type === 'clipping'" class="clipping-card">
            <div class="tape" style="transform: translateX(-50%) rotate(5deg); background: rgba(255,255,255,0.7);"></div>
            <div class="clipping-title">💬 聊天金句打捞</div>
            <div style="font-size:15px; line-height:1.5;">“<span class="highlighter">{{ card.content.quote }}</span>”</div>
            <div class="clipping-comment">📝 批注：{{ card.content.comment }}</div>
          </div>
          <!-- 待办清单 -->
          <div v-else-if="card.type === 'checklist'" class="checklist-card">
            <div class="tape" style="transform: translateX(-50%) rotate(-1deg); background: rgba(255,255,255,0.6);"></div>
            <div class="check-title">📋 {{ card.content.title }}</div>
            <div class="check-item" v-for="(item, i) in card.content.items" :key="i" :class="{ strike: item.done }">
              <div class="box" :class="{ done: item.done }">{{ item.done ? '✔' : '' }}</div><div>{{ item.text }}</div>
            </div>
          </div>
          <!-- 票根 -->
          <div v-else-if="card.type === 'ticket'" class="ticket-card">
            <div class="tape" style="transform: translateX(-50%) rotate(4deg); background: rgba(255,255,255,0.3);"></div>
            <div class="ticket-left"><div class="ticket-type">VIRTUAL TICKET 🎫</div><div class="ticket-main">{{ card.content.title }}</div><div class="ticket-info">{{ card.content.info }}</div></div><div class="ticket-right"><div class="barcode"></div></div>
          </div>
          <!-- 深夜碎碎念 -->
          <div v-else-if="card.type === 'midnight'" class="midnight-card">
            <div class="tape" style="background: rgba(255,255,255,0.15);"></div><div class="star-sparkle">✨</div><div class="midnight-time">睡不着的碎碎念</div><div class="midnight-text">{{ card.content.text }}</div>
          </div>
          <!-- 语音卡片 -->
          <div v-else-if="card.type === 'audio'" class="audio-card">
            <div class="tape" style="transform: translateX(-50%) rotate(-4deg); background: rgba(255,255,255,0.8);"></div><div class="play-btn">▶</div><div class="wave-container"><div class="waveform"></div><div class="audio-text">“{{ card.content.text }}”</div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 羽毛笔按钮 -->
    <div class="diary-fab" @click="generateDiaryEntry" :style="isGenerating ? 'animation:none;' : ''">
      <div v-if="isGenerating" class="typing-indicator" style="transform:scale(1.2);"><div class="typing-dot" style="background:#5b6d82;"></div><div class="typing-dot" style="background:#5b6d82;"></div><div class="typing-dot" style="background:#5b6d82;"></div></div>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:22px; height:22px;"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { initDB } from '../utils/db.js'

const props = defineProps({ isOpen: Boolean, contact: Object })
const emit = defineEmits(['close'])

const pages = ref([])
const isGenerating = ref(false)

const closeApp = () => emit('close')
const formatTime = (ts) => { const d = new Date(ts); return `${d.getFullYear()}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` }

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.contact) loadDiary()
})

const loadDiary = async () => {
  const db = await initDB()
  db.transaction(['diary_db'], 'readonly').objectStore('diary_db').get(props.contact.id).onsuccess = (e) => {
    let data = e.target.result?.entries || []
    if (data.length > 0 && !data[0].cards) data = [{ id: 'page_old', timestamp: data[0].timestamp || Date.now(), isFavorited: false, cards: data }]
    pages.value = data
  }
}

const toggleFavorite = async (page) => {
  page.isFavorited = !page.isFavorited
  const db = await initDB()
  const tx = db.transaction(['diary_db'], 'readwrite')
  const store = tx.objectStore('diary_db')
  const data = await new Promise(res => store.get(props.contact.id).onsuccess = e => res(e.target.result))
  if (data) {
    const p = data.entries.find(x => x.id === page.id)
    if (p) { p.isFavorited = page.isFavorited; store.put(data) }
  }
}

const generateDiaryEntry = async () => {
  if (!props.contact || isGenerating.value) return
  const charId = props.contact.id
  isGenerating.value = true

  try {
    const db = await initDB()
    const historyData = await new Promise(res => db.transaction(['chat_history_db'], 'readonly').objectStore('chat_history_db').get(charId).onsuccess = e => res(e.target.result))
    const history = historyData?.messages?.slice(-150) || []
    if (history.length < 3) { alert("你们聊得太少啦，TA 实在写不出一整套手账，去多聊几句吧！"); isGenerating.value = false; return }

    let chatLog = history.map(m => `${m.sender === 'user' ? 'User' : props.contact.name}: ${m.text.replace(/\[STK:.*?\]/g, '[表情/图片]')}`).join('\n')
    const st = props.contact.settings || {}
    const apis = await new Promise(res => db.transaction(['api_profiles'], 'readonly').objectStore('api_profiles').getAll().onsuccess = e => res(e.target.result || []))
    let api = apis.find(a => a.id === st.apiId) || apis[0]
    if (!api) throw new Error("未绑定有效 API")

    let prompt = `你现在是“${props.contact.name}”。请根据你和User的近期聊天记录，在私密手账本上进行一次【完整的全套手账排版】。\n【聊天记录】:\n${chatLog}\n\n`
    prompt += `【强制要求】:\n1. 必须输出一个纯 JSON 数组格式，不要 markdown！\n2. 包含以下7种卡片各一张！\n`
    prompt += `[\n  {"type": "polaroid", "content": {"weather": "晴天", "text": "日记正文"}},\n  {"type": "sticky", "content": {"userMsg": "摘抄User的话", "charReply": "回复"}},\n  {"type": "clipping", "content": {"quote": "金句", "comment": "批注"}},\n  {"type": "checklist", "content": {"title": "恋爱清单", "items": [{"text":"事1","done":false},{"text":"事2","done":true}]}},\n  {"type": "ticket", "content": {"title": "标题", "info": "地点"}},\n  {"type": "midnight", "content": {"text": "碎碎念"}},\n  {"type": "audio", "content": {"text": "一句低语"}}\n]`

    const res = await fetch(api.url.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` },
      body: JSON.stringify({ model: api.model, messages: [{ role: "user", content: prompt }], temperature: 0.85 })
    })
    
    if (!res.ok) throw new Error("API 请求失败")
    const data = await res.json()
    const jsonMatch = data.choices[0].message.content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error("未按格式返回数组")
    
    const newPage = { id: 'page_' + Date.now(), timestamp: Date.now(), isFavorited: false, cards: JSON.parse(jsonMatch[0]) }
    
    let existing = [...pages.value]
    existing.unshift(newPage)
    
    let favs = existing.filter(p => p.isFavorited)
    let unfavs = existing.filter(p => !p.isFavorited)
    if (unfavs.length > 10) unfavs = unfavs.slice(0, 10)
    existing = [...favs, ...unfavs].sort((a, b) => b.timestamp - a.timestamp)

    await new Promise((res, rej) => {
      const tx = db.transaction(['diary_db'], 'readwrite')
      tx.objectStore('diary_db').put({ charId: charId, entries: JSON.parse(JSON.stringify(existing)) })
      tx.oncomplete = res; tx.onerror = rej
    })
    pages.value = existing

  } catch (err) {
    alert("书写手账失败了：" + err.message + "\n可能是大模型格式错了，再点一次吧！")
  } finally {
    isGenerating.value = false
  }
}
</script>
<style scoped>
/* ==========================================
   📖 【TA 的私密恋爱手账专属 CSS】
   ========================================== */
#diary-app {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background-color: #fdfbf7;
    background-image: linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
    background-size: 20px 20px;
    z-index: 100; /* 层级最高，盖住所有东西 */
    display: flex; flex-direction: column;
    padding-top: max(50px, calc(env(safe-area-inset-top) + 20px));
    transform: translateX(100%); /* 从右侧滑出 */
    transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
#diary-app.active { transform: translateX(0); }

/* 极简顶栏 */
.simple-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 24px 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.05); }
.header-title { font-size: 18px; font-weight: bold; color: #5b6d82; }
.header-btn { font-size: 15px; color: #5b6d82; cursor: pointer; font-weight: 500; }

/* --- 全新左右滑动翻页引擎 CSS --- */
.diary-canvas { 
    flex: 1; display: flex; overflow-x: auto; overflow-y: hidden; 
    scroll-snap-type: x mandatory; scrollbar-width: none; 
}
.diary-canvas::-webkit-scrollbar { display: none; }

/* 每一页手账 (Page) */
.diary-page {
    flex: 0 0 100%; width: 100%; height: 100%; 
    overflow-y: auto; scrollbar-width: none;
    padding: 10px 24px 100px 24px; box-sizing: border-box;
    scroll-snap-align: center; /* 滑动时自动吸附对齐 */
    display: flex; flex-direction: column; gap: 35px;
    position: relative;
}
.diary-page::-webkit-scrollbar { display: none; }

/* 页眉：日期与收藏星星 */
.page-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: -15px; z-index: 10;
}
.page-date { font-size: 13px; font-weight: bold; color: #7a94a9; letter-spacing: 1px; background: rgba(255,255,255,0.6); padding: 4px 12px; border-radius: 12px;}
.page-star { font-size: 24px; color: #ddd; cursor: pointer; transition: 0.3s; filter: grayscale(100%); }
.page-star.active { color: #fbc02d; filter: grayscale(0%); transform: scale(1.1); text-shadow: 0 0 15px rgba(251,192,45,0.6); }

/* 极致优雅的毛玻璃羽毛笔按钮 */
.diary-fab {
    position: absolute; bottom: max(30px, env(safe-area-inset-bottom)); right: 24px;
    width: 54px; height: 54px; border-radius: 50%;
    background: rgba(255,255,255,0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.8);
    display: flex; justify-content: center; align-items: center; color: #7a94a9;
    cursor: pointer; z-index: 10; animation: diaryBreath 3s infinite ease-in-out;
    transition: transform 0.2s;
}
.diary-fab:active { transform: scale(0.9); }
@keyframes diaryBreath { 0%, 100% { box-shadow: 0 8px 25px rgba(0,0,0,0.08); } 50% { box-shadow: 0 8px 30px rgba(122,148,169,0.35); } }

/* --- 7种神仙卡片样式集合 --- */
.tape { position: absolute; top: -12px; left: 50%; transform: translateX(-50%) rotate(-3deg); width: 70px; height: 22px; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-radius: 2px; z-index: 2; }
.polaroid-card { position: relative; background: #fff; padding: 12px 12px 35px 12px; box-shadow: 2px 6px 15px rgba(0,0,0,0.06); transform: rotate(1.5deg); border-radius: 4px; }
.polaroid-img { width: 100%; height: 180px; border-radius: 2px; background-size: cover !important; background-position: center !important; background-color: #eee;}
.polaroid-text { margin-top: 15px; font-size: 14px; color: #444; line-height: 1.6; font-family: "Kaiti", "STKaiti", serif; }
.water-stain { position: absolute; bottom: 20px; right: 20px; width: 50px; height: 50px; border-radius: 50%; background: radial-gradient(circle, rgba(122,148,169,0.15) 0%, rgba(122,148,169,0) 70%); pointer-events: none; }
.sticky-note { position: relative; background: #fff9c4; padding: 20px; border-radius: 2px 20px 2px 2px; box-shadow: -2px 4px 12px rgba(0,0,0,0.05); transform: rotate(-2deg); }
.user-writing { font-size: 14px; color: #333; line-height: 1.5; margin-bottom: 12px; }
.char-reply { font-size: 15px; color: #283593; font-family: "Kaiti", "STKaiti", serif; border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 12px; transform: rotate(1deg); }
.pen-mark { font-size: 12px; color: #e53935; position: absolute; right: 15px; bottom: 12px; transform: rotate(-10deg); font-weight: bold; border: 1px solid #e53935; padding: 2px 6px; border-radius: 4px;}
.clipping-card { position: relative; background: #f4f1ea; padding: 15px; transform: rotate(-2.5deg); border: 1px dashed #d7ccc8; box-shadow: 1px 3px 10px rgba(0,0,0,0.05); font-family: serif; color: #3e2723; }
.clipping-title { font-size: 11px; color: #8d6e63; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
.highlighter { background: linear-gradient(180deg, transparent 50%, rgba(255, 235, 59, 0.8) 50%); font-weight: bold; padding: 0 4px; }
.clipping-comment { font-family: "Kaiti", "STKaiti", serif; font-size: 14px; color: #1565c0; margin-top: 10px; transform: rotate(1deg); }
.checklist-card { position: relative; background: #fff; padding: 20px 20px 25px 20px; border-top: 4px dashed #e0e0e0; box-shadow: 0 5px 15px rgba(0,0,0,0.04); transform: rotate(1.5deg); font-family: monospace; }
.check-title { font-size: 16px; font-weight: bold; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; letter-spacing: 1px; }
.check-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; font-size: 13px; color: #555; }
.box { width: 16px; height: 16px; border: 2px solid #aaa; border-radius: 3px; flex-shrink: 0; display: flex; justify-content: center; align-items: center; }
.box.done { border-color: #e53935; color: #e53935; font-weight: bold; font-size: 14px; }
.strike { text-decoration: line-through; color: #aaa; }
.ticket-card { position: relative; display: flex; background: #c62828; color: #fff; border-radius: 8px; transform: rotate(-3deg); box-shadow: 2px 5px 15px rgba(229,57,53,0.3); background-image: radial-gradient(circle at 0 50%, transparent 8px, #c62828 9px), radial-gradient(circle at 100% 50%, transparent 8px, #c62828 9px); background-size: 100% 100%; background-position: center; background-repeat: no-repeat; }
.ticket-left { flex: 1; padding: 15px 20px; border-right: 2px dashed rgba(255,255,255,0.4); }
.ticket-right { width: 60px; padding: 15px 5px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.ticket-type { font-size: 10px; opacity: 0.8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 5px; }
.ticket-main { font-size: 18px; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; }
.ticket-info { font-size: 11px; opacity: 0.9; }
.barcode { width: 30px; height: 100%; background: repeating-linear-gradient(90deg, #fff, #fff 2px, transparent 2px, transparent 4px); opacity: 0.8; }
.midnight-card { position: relative; background: linear-gradient(135deg, #1a237e, #311b92); padding: 20px; border-radius: 12px; box-shadow: 0 8px 20px rgba(49,27,146,0.3); transform: rotate(1deg); color: #e8eaf6; }
.midnight-time { font-size: 11px; opacity: 0.7; margin-bottom: 10px; letter-spacing: 1px; text-transform: uppercase; }
.midnight-text { font-size: 14px; line-height: 1.6; text-shadow: 0 0 5px rgba(255,255,255,0.2); }
.star-sparkle { position: absolute; top: 15px; right: 15px; font-size: 18px; animation: twinkle 2s infinite; }
.audio-card { position: relative; background: #fff; padding: 15px; border-radius: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); display: flex; align-items: center; gap: 15px; transform: rotate(-1deg); border: 1px solid rgba(0,0,0,0.03); }
.play-btn { width: 40px; height: 40px; border-radius: 50%; background: #5b6d82; color: #fff; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 2px 8px rgba(91,109,130,0.4); padding-left: 3px;}
.wave-container { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.waveform { height: 15px; background: repeating-linear-gradient(90deg, #5b6d82, #5b6d82 3px, transparent 3px, transparent 5px); width: 80%; border-radius: 2px; opacity: 0.7;}
.audio-text { font-size: 11px; color: #888; font-family: "Kaiti", "STKaiti", serif; }

.typing-indicator { display: flex; gap: 4px; align-items: center; justify-content: center; height: 18px; padding: 2px 4px; }
.typing-dot { width: 5px; height: 5px; background: #5b6d82; border-radius: 50%; opacity: 0.5; animation: typingJump 1.4s infinite ease-in-out both; }
.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes typingJump { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-4px); opacity: 1; } }
</style>