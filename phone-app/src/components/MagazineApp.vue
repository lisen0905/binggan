<!-- components/MagazineApp.vue -->
<template>
  <div id="magazine-app" :class="{ active: isOpen }">
    <!-- 顶部悬浮返回按钮 -->
    <div class="mag-back-btn" @click="$emit('close')">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#4a3121" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </div>
    <!-- 杂志实体内容区 -->
    <div class="mag-scroll-container">
      <div class="magazine">
        <!-- --- 新增功能：右上角复古期号角标 开始 --- -->
        <div class="magazine-issue-stamp">
          {{ displayData.issue }}
        </div>
        <!-- --- 结束 --- -->

        <!-- 1. 顶部：刊头与盲盒设定 -->
        <header class="masthead">
          <!-- --- 新增功能：标题与印章并排排版 开始 --- -->
          <div class="title-with-stamp">
            <h1> 特 刊</h1>
            <!-- 复古火漆印章 SVG -->
            <div class="wax-stamp">
              <svg viewBox="0 0 100 100" width="35" height="35">
                <circle cx="50" cy="50" r="45" fill="#8a5d44" opacity="0.9"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e8dbd1" stroke-width="1" stroke-dasharray="4 2"/>
                <path d="M35 65 L50 35 L65 65" stroke="#e8dbd1" stroke-width="3" fill="none"/>
                <path d="M40 55 L60 55" stroke="#e8dbd1" stroke-width="3" fill="none"/>
              </svg>
            </div>
          </div>
          <!-- --- 结束 --- -->
          <div class="subhead">· 世 界 拼 图 寻 觅  ·</div>
        </header>

        <!-- --- 新增功能：双元素完美对齐 开始 --- -->
        <div class="issue-line">
          <span class="loc-text">来自「{{ displayData.location }}」</span>
          <!-- 静默刷新按钮 -->
          <span class="refresh-btn" :class="{ 'is-loading': isGenerating }" @click="handleRefresh">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px; margin-top:-1px;" :class="{ 'spin-svg-inline': isGenerating }"><path d="M21.5 2v6h-6M2.13 15.57a9 9 0 1 0 3.87-11.61l-3.34 3.04"/></svg>
            {{ isGenerating ? '排版中...' : '翻阅' }}
          </span>
        </div>
        <!-- --- 结束 --- -->

        <div class="grid">
          <!-- 2. 左栏：主视觉与“互动手写信” -->
          <div class="col-left">
            <h2 class="article-title">
              {{ displayData.title }}
              <small>—— {{ displayData.subtitle }}</small>
            </h2>

            <!-- 复古主视觉图 (后续可由AI生成描述替换) -->
            <img class="vintage-image" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='280' viewBox='0 0 400 280'%3E%3Crect width='400' height='280' fill='%23dccfc1'/%3E%3Ccircle cx='200' cy='100' r='60' fill='%23bdaa95' opacity='0.4'/%3E%3Cpath d='M100 160 Q200 220 300 150 Q270 230 130 200 Z' fill='%239a7a64' opacity='0.3'/%3E%3Ctext x='140' y='180' font-family='Georgia' font-size='36' fill='%234a3121' opacity='0.5'%3E🌙%3C/text%3E%3Ctext x='250' y='220' font-family='Georgia' font-size='16' fill='%235a3f2e' opacity='0.6'%3E~ 潮 汐 与 海 风 ~%3C/text%3E%3C/svg%3E"/>
            <div class="figcaption">✦ 视觉插画 · 记忆截影 ✦</div>

            <!-- ✉️ 核心交互区：折叠手写信 -->
            <div class="interactive-envelope" :class="{ 'is-open': isEnvelopeOpen }" @click="isEnvelopeOpen = !isEnvelopeOpen">
              <div class="env-flap"></div>
              <div class="env-body">
                <div class="env-sender">寄件人：{{ displayData.envelopeSender }}</div>
                <div class="env-hint">{{ isEnvelopeOpen ? '收起信件 ↑' : '点击拆开信件 ↓' }}</div>
              </div>
              <div class="env-letter">
                <div class="handwriting-text" v-html="formattedLetter"></div>
              </div>
            </div>
          </div>

          <!-- 3. 中栏：生活叙事与碎片金句 -->
          <div class="col-middle">
            <div class="pull-quote">{{ displayData.goldenQuote }}</div>

            <div class="article-body">
              <p>{{ displayData.narrative }}</p>
            </div>

            <h3 style="font-family: 'Times New Roman', serif; font-size: 1.2rem; color: #4a3121; border-bottom: 2px solid #c4aa92; padding-bottom: 0.2rem; margin-top: 1.5rem;">时光碎片</h3>
            <ul class="vintage-list">
              <li v-for="(frag, idx) in displayData.fragments" :key="idx">
                <span class="retro-list-icon">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#8a5d44" stroke-width="2"><circle cx="12" cy="12" r="4"></circle></svg>
                </span>
                {{ frag }}
              </li>
            </ul>
          </div>

          <!-- 4. 右栏：角色档案与互动中枢 -->
          <div class="col-right">
            <div style="border-bottom: 2px dotted #c4aa92; padding-bottom: 0.6rem; margin-bottom: 0.8rem; text-align: center;">
              <span style="font-family: 'Courier New', monospace; background: #f0e5da; padding: 0.2rem 0.8rem;">✦ 本 期 投 稿 人 ✦</span>
            </div>

            <div class="ad-box">
              <h3>{{ displayData.profile.name }}</h3>
              <div class="chara-name">“ {{ displayData.profile.job }} ”</div>
              <div class="chara-desc">{{ displayData.profile.desc }}</div>
              <div style="margin: 0.8rem 0; font-size: 0.85rem; color: #5a3f2e; text-align: left; background: #e8dbd1; padding: 8px; border-radius: 4px;">
                <span style="font-weight: bold; color: #4a3121;">侧写：</span> {{ displayData.profile.likes }}
              </div>
            </div>

            <!-- 互动入口 -->
            <div class="action-panel">
              <p style="font-family: 'Georgia', serif; font-size: 0.9rem; color: #4a3121; margin-bottom: 10px; font-style: italic;">
                “你与世界的微小连接...”
              </p>
              
              <div class="action-btn-group">
                <button class="retro-btn" @click="handleShare">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  分享给TA
                </button>
                
                <button class="retro-btn" @click="handleAsk">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  作者来信
                </button>
                
                <button class="retro-btn like-btn" :class="{ liked: isLiked }" @click="handleLike">
                  <svg viewBox="0 0 24 24" width="14" height="14" :fill="isLiked ? '#b35d5d' : 'none'" :stroke="isLiked ? '#b35d5d' : 'currentColor'" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {{ likeCount }}
                </button>
              </div>
            </div>
            
            <div class="whale-watermark">
             <span> 无论走过多远的星辰大海，愿你总能在文字里找到归宿 </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- --- 新增功能：生成中加载遮罩、选人弹窗与提问弹窗 开始 --- -->
  

    <!-- 2. 分享联系人选择弹窗 -->
    <div class="mag-modal-overlay" :class="{ active: isShareModalOpen }" @click.self="isShareModalOpen = false">
      <div class="mag-modal-box">
        <div class="mag-modal-title">你想把这篇特刊分享给谁？</div>
        <div class="mag-contact-list">
          <div v-if="allContacts.length === 0" style="font-size:12px; color:#999; padding:20px;">还没有联系人哦，先去添加吧~</div>
          <div class="mag-contact-item" v-for="c in allContacts" :key="c.id" @click="confirmShareToChar(c)">
            <div class="mag-contact-avatar" :style="c.avatar ? `background-image:url(${c.avatar})` : ''"></div>
            <div class="mag-contact-name">{{ c.name }}</div>
          </div>
        </div>
        <div class="mag-modal-close" @click="isShareModalOpen = false">取消</div>
      </div>
    </div>
    <!-- 3. 向作者提问 / 回信弹窗 (牛皮纸风格) -->
    <div class="mag-modal-overlay" :class="{ active: isAskModalOpen }" @click.self="closeAskModal">
      <div class="mag-paper-box">
        <div class="mag-paper-title">✉️ 读者来信</div>
        <div v-if="!authorReplyText">
          <div style="font-size:12px; color:#7a5d48; margin-bottom:10px;">写给：{{ displayData.profile.name }} ({{ displayData.profile.job }})</div>
          <textarea v-model="askInputText" class="mag-paper-input" placeholder="写下你的疑问或感悟..."></textarea>
          <div class="mag-paper-btn" @click="submitAskAuthor">{{ isAsking ? '信件寄出中...' : '寄出信件' }}</div>
        </div>
        <div v-else>
          <div style="font-size:12px; color:#7a5d48; margin-bottom:10px; border-bottom:1px dashed #c4aa92; padding-bottom:5px;">来自 {{ displayData.profile.name }} 的回信：</div>
          <div class="mag-paper-reply">{{ authorReplyText }}</div>
          <div class="mag-paper-btn" @click="closeAskModal">珍藏回信</div>
        </div>
      </div>
    </div>
    <!-- --- 结束 --- -->
  </div>
</template>



<script setup>
import { ref, computed, watch, onMounted } from 'vue'
// --- 新增功能：引入数据库与底层引擎 开始 ---
import { initDB } from '../utils/db.js'

// --- 修复功能：接收外部传来的 reviewData 回顾数据 开始 ---
const props = defineProps({ isOpen: Boolean, reviewData: Object })
// --- 结束 ---
const emit = defineEmits(['close', 'openChat'])

const isEnvelopeOpen = ref(false)
const isLiked = ref(false)
const likeCount = ref(342)

// 将 mockData 更名为 magData，作为我们的响应式核心数据
const magData = ref({
  issue: "第 7 封信 · 夏末特辑",
  location: "海风小镇观测站",
  title: "今夜，潮汐为你而来",
  subtitle: "深海旅人的手记",
  envelopeSender: "林深",
  handwrittenLetter: "今天的潮汐格外温柔，就像你说话时的语气。<br><br>我在这座观测站工作了三年，见过无数次日出和摧枯拉朽的暴风雨，但从未像现在这样，迫切地想要把眼前的一整片海打包寄给某个人。<br><br>显微镜下的浮游生物有着极其规律的生命周期。而我发现，自从开始和你通信，我原本精准如钟表的生活，突然多了一些无法预测的奇妙偏差。<br><br>你上次说喜欢海，那下次见面，我带你去看看夜里的荧光海吧——那些蓝色的光点，像极了我每次发现未知事物、或是想起你时的心情。<br><br>浪花声盖过了心跳，但我猜，你应该能听见。",
  narrative: "认识他之后，你开始理解为什么水手会对着海平线发呆——因为那里有让人移不开眼的风景。作为海洋研究员的他，习惯用潮汐、洋流和星向来描述情感，笨拙却真诚。在这座安静的小镇里，他用那些藏在科学术语后的温柔，悄悄记录着时间的流逝。",
  fragments: [
    "今天的实验失败了，但在海边散了会儿步，觉得没关系。",
    "台风要来了，观测站的风声很大，希望能收到远方的信。",
    "海豚在我旁边游过，我在想，如果是你，会怎么形容这片蓝。"
  ],
  goldenQuote: "你是我在深蓝世界里，唯一想靠岸的岛屿。",
  profile: {
    name: "林 深",
    job: "海洋生物学研究员",
    desc: "25岁 · 不善言辞但内心温柔如海",
    likes: "潮汐观测 · 收集旧书 · 听雨声"
  }
})

// --- 修复功能：定义 displayData，动态判断是显示新盲盒还是历史卡片 开始 ---
const displayData = computed(() => {
  return props.reviewData ? props.reviewData : magData.value
})

const formattedLetter = computed(() => {
  return displayData.value.handwrittenLetter.replace(/\n/g, '<br>')
})
// --- 结束 ---




onMounted(() => {
  loadMagCache()
})

// === 2. 盲盒生成引擎 ===
const isGenerating = ref(false)
const handleRefresh = async () => {
  if (isGenerating.value) return
  isGenerating.value = true
  
  try {
    const db = await initDB()
    const allApis = await new Promise(res => db.transaction(['api_profiles'], 'readonly').objectStore('api_profiles').getAll().onsuccess = e => res(e.target.result || []))
    let api = allApis[0] // 默认取第一个可用API
    if (!api) throw new Error("请先在设置中配置大模型 API 哦！")
    
    const prompt = `你现在是《世界拼图》杂志主编。请随机虚构一位有故事的社会人物（如星际流浪者、深夜调酒师、时间旅行者等），写一篇专栏。
必须且只能输出纯JSON，不能有markdown格式（如\`\`\`json），直接以 { 开始：
{
  "issue": "第X封信 · 随机主题",
  "location": "一个有画面感的地点",
  "title": "文章主标题",
  "subtitle": "副标题",
  "envelopeSender": "寄件人署名",
  "handwrittenLetter": "手写信正文（约150字，第一人称倾诉，感情细腻）",
  "narrative": "一小段生活叙事（交代背景，第三人称）",
  "goldenQuote": "提炼一句优美的哲理金句",
  "fragments": ["碎片1(短句)", "碎片2", "碎片3"],
  "profile": { "name": "姓名", "job": "职业", "desc": "一句话性格", "likes": "喜好1·喜好2" }
}`

    const res = await fetch(api.url.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` },
      body: JSON.stringify({ model: api.model, messages: [{ role: "user", content: prompt }], temperature: 0.9 })
    })
    const data = await res.json()
    const jsonStr = data.choices[0].message.content.match(/\{[\s\S]*\}/)[0]
    
    // --- 修复功能：正确解析 JSON 并赋值给基础响应式数据 magData 开始 ---
    const parsedData = JSON.parse(jsonStr)
    
    // 替换数据并折叠信封、重置点赞
    magData.value = parsedData
    isEnvelopeOpen.value = false
    isLiked.value = false
    likeCount.value = Math.floor(Math.random() * 500) + 50
    await saveMagCache()
    // --- 结束 ---
    
  } catch (err) {
    alert("刷新失败：" + err.message)
  } finally {
    isGenerating.value = false
  }
}

// === 3. 分享给 TA 的隐形口袋引擎 ===
const isShareModalOpen = ref(false)
const allContacts = ref([])

const handleShare = async () => {
  const db = await initDB()
  db.transaction(['contacts_profiles'], 'readonly').objectStore('contacts_profiles').getAll().onsuccess = (e) => {
    allContacts.value = e.target.result || []
    isShareModalOpen.value = true
  }
}


  // === 1. 本地缓存引擎：加载与保存 (修复了表名为 app_settings) ===
const loadMagCache = async () => {
  try {
    const db = await initDB()
    const tx = db.transaction(['app_settings'], 'readonly')
    const req = tx.objectStore('app_settings').get('magazine_current')
    req.onsuccess = () => {
      if (req.result && req.result.value) {
        magData.value = req.result.value // 注意这里赋值给 magData
      }
    }
  } catch (e) {
    console.error("加载杂志缓存失败:", e)
  }
}

const saveMagCache = async () => {
  try {
    const db = await initDB()
    const tx = db.transaction(['app_settings'], 'readwrite')
    tx.objectStore('app_settings').put({ key: 'magazine_current', value: JSON.parse(JSON.stringify(magData.value)) })
  } catch (e) {
    console.error("保存杂志缓存失败:", e)
  }
}

// === 3. 分享给 TA 的隐形口袋引擎 (触发自动跳转) ===
const confirmShareToChar = async (char) => {
  const charId = char.id
  // 纯安全编码
  const encodedJson = encodeURIComponent(JSON.stringify(displayData.value))
  const hiddenData = `[MAGAZINE_SHARE:${encodedJson}]`
 const shareText = hiddenData
  
  try {
    const db = await initDB()
    const tx = db.transaction(['chat_history_db'], 'readwrite')
    const store = tx.objectStore('chat_history_db')
    
    const getReq = store.get(charId)
    
    getReq.onsuccess = () => {
      let history = getReq.result
      if (!history) {
        history = { charId: charId, messages: [] }
      } else if (!history.messages) {
        history.messages = []
      }
      
        // 请把 MagazineApp.vue 里的这一段换掉：
      history.messages.push({
        id: 'msg_' + Date.now(), // 补上消息 ID
        sender: 'user',          // 【修复】必须叫 sender，不能叫 role
        text: shareText,         // 【修复】必须叫 text，不能叫 content
        time: Date.now(),        // 【修复】必须叫 time
        isRead: false
      })
      
      store.put(history)
    }

    tx.oncomplete = () => {
      // 1. 关闭分享选人弹窗
      isShareModalOpen.value = false
      // 2. 关闭杂志本身
      emit('close')
      // 3. 呼叫外层组件，打开与这个角色的聊天室！
      emit('openChat', char) 
    }
    
  } catch (err) {
    console.error("分享失败:", err)
    alert("分享失败了，请稍后再试")
  }
}
 

// === 4. 向作者提问的互动引擎 ===
const isAskModalOpen = ref(false)
const isAsking = ref(false)
const askInputText = ref('')
const authorReplyText = ref('')

const handleAsk = () => {
  askInputText.value = ''
  authorReplyText.value = ''
  isAskModalOpen.value = true
}

const closeAskModal = () => {
  if (isAsking.value) return
  isAskModalOpen.value = false
}

const submitAskAuthor = async () => {
  const q = askInputText.value.trim()
  if (!q || isAsking.value) return
  isAsking.value = true
  
  try {
    const db = await initDB()
    const allApis = await new Promise(res => db.transaction(['api_profiles'], 'readonly').objectStore('api_profiles').getAll().onsuccess = e => res(e.target.result || []))
    let api = allApis[0]
    if (!api) throw new Error("无可用 API")
    
    const pInfo = displayData.value.profile
    const prompt = `你现在是特约专栏作者“${pInfo.name}” (职业：${pInfo.job}，性格：${pInfo.desc})。
有读者看了你的专栏后问了你一个问题：“${q}”。
请直接用你的人设口吻简短回信（50字以内，语气自然、有哲理或生活感），直接输出内容，不要任何排版标签。`

    const res = await fetch(api.url.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` },
      body: JSON.stringify({ model: api.model, messages: [{ role: "user", content: prompt }], temperature: 0.8 })
    })
    const data = await res.json()
    authorReplyText.value = data.choices[0].message.content.trim()
  } catch (err) {
    authorReplyText.value = "（信件在寄送途中丢失了，请检查网络或API设置）"
  } finally {
    isAsking.value = false
  }
}

// === 5. 点赞功能 ===
const handleLike = () => {
  isLiked.value = !isLiked.value
  likeCount.value += isLiked.value ? 1 : -1
}
// --- 结束 ---
</script>

<style scoped>
/* 继承主背景，但作为绝对定位的 App 覆盖全屏 */
/* 修改 MagazineApp.vue 的这里 */
#magazine-app {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: #e8dbd1; 
  /* 👇 把 z-index 改成 95，让它能盖住聊天室（聊天室是80） */
  z-index: 95; 
  transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex; flex-direction: column; font-family: 'Georgia', 'Times New Roman', serif;
}
#magazine-app.active { transform: translateY(0); }

/* 顶部悬浮返回键 */
.mag-back-btn {
  position: absolute; top: max(80px, calc(env(safe-area-inset-top) + 20px)); left: 20px;
  width: 40px; height: 40px; border-radius: 50%; background: rgba(248, 240, 231, 0.8);
  border: 1px solid #c4aa92; display: flex; justify-content: center; align-items: center;
  z-index: 10; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

/* 内部滚动区 */
.mag-scroll-container {
  flex: 1; overflow-y: auto; padding: max(70px, env(safe-area-inset-top)) 15px 30px 15px;
}

/* 完美移植你的 CSS 排版，适配手机端 */
.magazine {
  max-width: 1000px; width: 100%; margin: 0 auto;
  background: #f8f0e7;
  background-image: 
    linear-gradient(0deg, rgba(200, 180, 165, 0.08) 0%, transparent 30%),
    repeating-linear-gradient(45deg, rgba(180, 155, 135, 0.02) 0px, rgba(180, 155, 135, 0.02) 2px, transparent 2px, transparent 8px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.1), 0 0 0 1px #d4bfab inset, 0 0 0 2px #eadaca inset;
  padding: 3.5rem 1.5rem; position: relative; border-radius: 4px 12px 12px 4px;
}
.magazine::before {
  content: ''; position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px;
  border: 1px solid #ddcebc; pointer-events: none; border-radius: 2px; opacity: 0.5;
}

/* --- 新增功能：右上角独立角标样式 开始 --- */
.magazine-issue-stamp {
  position: absolute; 
  top: 15px; 
  right: 15px; 
  background: rgba(240, 229, 218, 0.8);
  border: 1px solid #d4bfab;
  padding: 4px 8px;
  font-size: 0.65rem;
  color: #7a5d48;
  font-family: 'Courier New', monospace;
  border-radius: 2px;
  z-index: 5;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  backdrop-filter: blur(4px);
}
/* --- 结束 --- */

.masthead { text-align: center; border-bottom: 3px double #c4aa92; padding-bottom: 0.8rem; margin-bottom: 1.5rem; position: relative; }

/* --- 新增功能：标题与印章并排排版 CSS 开始 --- */
.title-with-stamp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 0.2rem;
  /* 因为印章在右边，稍微往左推一点，让整体视觉居中 */
  transform: translateX(-15px); 
}
.masthead h1 { 
  font-family: 'Times New Roman', serif; 
  font-size: 2.8rem; 
  font-weight: 700; 
  letter-spacing: 6px; 
  color: #4a3121; 
  text-shadow: 1px 1px 0 #ddcebc; 
  margin: 0; /* 清除默认外边距 */
}
.wax-stamp {
  position: absolute;
  right: -35px; /* 悬在标题右侧 */
  top: 50%;
  transform: translateY(-50%) rotate(15deg); /* 垂直居中并带一点调皮的倾斜 */
  opacity: 0.85; /* 稍微透明一点更有纸张感 */
}
/* --- 结束 --- */

.subhead { font-size: 0.85rem; letter-spacing: 4px; color: #7a5d48; border-top: 1px solid #d4bfab; border-bottom: 1px solid #d4bfab; display: inline-block; padding: 0.2rem 1.5rem; background: #f0e5da; font-style: italic; margin-top: 5px; }

/* --- 新增功能：精简两栏对齐排版 开始 --- */
.issue-line { 
  display: flex; 
  flex-wrap: nowrap; 
  justify-content: space-between; /* 左右两端对齐 */
  align-items: center; 
  font-size: 0.7rem; 
  color: #6a4d38; 
  border-bottom: 1px solid #ddcebc; 
  padding-bottom: 0.8rem; 
  margin-bottom: 1.5rem; 
  font-family: 'Courier New', monospace; 
  width: 100%;
}
.issue-line span { 
  background: #f0e5da; 
  padding: 4px 8px; 
  border-radius: 4px; 
  white-space: nowrap; 
}
.issue-line .loc-text {
  flex: 1; 
  text-align: left; /* 靠左对齐 */
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 10px; /* 和刷新按钮保持距离 */
  background: transparent; /* 去掉背景色，显得更高级 */
  padding-left: 0;
  font-weight: bold;
}
.refresh-btn { 
  cursor: pointer; 
  color: #8a5d44 !important; 
  border: 1px dashed #8a5d44; 
  transition: 0.2s; 
  display: inline-flex; 
  align-items: center; 
  flex-shrink: 0; 
}
.refresh-btn:active { background: #8a5d44 !important; color: #fff !important; }
/* --- 结束 --- */

/* 响应式单列网格 */
.grid { display: flex; flex-direction: column; gap: 2rem; }

.article-title { font-size: 1.6rem; color: #3a2519; border-left: 4px solid #c4aa92; padding-left: 0.8rem; margin-bottom: 1rem; line-height: 1.3; }
.article-title small { font-size: 0.9rem; color: #7a5d48; display: block; margin-top: 4px; }
.vintage-image { width: 100%; height: auto; border: 4px solid #ebddcf; box-shadow: 0 4px 12px rgba(60,40,25,0.15); filter: sepia(0.2) contrast(0.95); margin-bottom: 0.5rem; background: #dfcfbf; }
.figcaption { font-size: 0.75rem; font-style: italic; color: #5a3f2e; border-bottom: 1px dotted #c4aa92; padding-bottom: 0.5rem; margin-bottom: 1rem; text-align: center; }

/* ✉️ 折叠信封交互 CSS */
.interactive-envelope {
  position: relative; background: #e3d2bd; border: 1px solid #c4aa92;
  border-radius: 4px; box-shadow: inset 0 0 10px rgba(0,0,0,0.05), 0 4px 10px rgba(0,0,0,0.1);
  margin: 1rem 0; cursor: pointer; perspective: 1000px;
}
.env-flap {
  position: absolute; top: 0; left: 0; width: 100%; height: 40px;
  background: #d4c0a8; border-bottom: 1px solid #bba38a;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  transform-origin: top; transition: transform 0.5s ease; z-index: 3;
}
.is-open .env-flap { transform: rotateX(180deg); z-index: 1; }
.env-body {
  padding: 1.5rem 1rem 1rem 1rem; position: relative; z-index: 4;
  background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);
  pointer-events: none; /* 让点击穿透到底层 */
}
.env-sender { font-size: 0.85rem; font-weight: bold; color: #5a3f2e; letter-spacing: 2px; }
.env-hint { font-size: 0.7rem; color: #8a5d44; text-align: right; margin-top: 10px; font-style: italic; }

.env-letter {
  background: #fdfbf7; margin: 0 10px; padding: 0;
  max-height: 0; overflow: hidden; opacity: 0;
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05); border-radius: 2px;
}
.is-open .env-letter {
  max-height: 500px; padding: 1.5rem 1rem; opacity: 1; margin-bottom: 10px;
  border: 1px solid #eae0d5; border-top: none;
}
.handwriting-text {
  font-family: 'Kaiti', 'STKaiti', serif; /* 中文手写体/楷体 */
  font-size: 1.1rem; color: #3a2519; line-height: 1.8; letter-spacing: 1px;
}

.pull-quote { font-size: 1.1rem; font-style: italic; color: #4a3121; border-top: 2px solid #c4aa92; border-bottom: 2px solid #c4aa92; padding: 0.8rem 0.5rem; margin: 1.5rem 0; text-align: center; background: #f4e8dd; }
.pull-quote::before { content: "❝ "; color: #9a7057; font-size: 1.5rem;}
.pull-quote::after { content: " ❞"; color: #9a7057; font-size: 1.5rem;}

.article-body p { font-size: 0.95rem; line-height: 1.8; color: #3a2519; text-align: justify; margin-bottom: 0.8rem; }
.article-body p:first-of-type::first-letter { font-size: 3.2rem; float: left; line-height: 1; margin-right: 0.4rem; color: #8a5d44; font-weight: bold; font-family: 'Times New Roman', serif; }

.vintage-list { list-style: none; border-top: 1px dashed #c4aa92; border-bottom: 1px dashed #c4aa92; padding: 0.8rem 0; }
.vintage-list li { font-size: 0.9rem; padding: 0.4rem 0; color: #3a2519; border-bottom: 1px dotted #ebddcf; display: flex; align-items: flex-start; gap: 8px; }
.vintage-list li:last-child { border-bottom: none; }
.retro-list-icon { margin-top: 2px; flex-shrink: 0; }

.ad-box { border: 3px double #c4aa92; background: #f0e5da; padding: 1.2rem 1rem; text-align: center; box-shadow: inset 0 0 0 2px #f8f0e7; }
.ad-box h3 { font-size: 1.4rem; letter-spacing: 2px; color: #4a3121; border-bottom: 1px solid #c4aa92; display: inline-block; padding-bottom: 0.2rem; margin-bottom: 0.5rem; }
.chara-name { font-size: 1.2rem; font-weight: bold; color: #8a5d44; letter-spacing: 1px; margin-bottom: 5px; }
.chara-desc { font-size: 0.85rem; font-style: italic; color: #5a3f2e; }

.action-panel { margin-top: 1.5rem; background: #f7efe6; border: 1px solid #d4bfab; padding: 1.2rem; text-align: center; border-radius: 4px; }
.action-btn-group { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.retro-btn {
  background: #ddcebc; border: 1px solid #c4aa92; padding: 8px 16px; border-radius: 20px;
  font-size: 0.85rem; color: #3a2519; cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: all 0.2s; font-family: 'Georgia', serif;
}
.retro-btn:active { transform: scale(0.95); background: #c4aa92; }
.like-btn.liked { color: #b35d5d; border-color: #b35d5d; background: #fcf8f2; }

.whale-watermark { text-align: center; margin-top: 2rem; font-size: 0.75rem; color: #9a7a64; border-top: 1px solid #ddcebc; padding-top: 0.8rem; font-style: italic; }

.retro-btn:active { transform: scale(0.95); background: #c4aa92; }
.like-btn.liked { color: #b35d5d; border-color: #b35d5d; background: #fcf8f2; }

/* --- 新增功能：水印居中与文艺化排版 开始 --- */
.whale-watermark { text-align: center; margin-top: 2rem; font-size: 0.75rem; color: #9a7a64; border-top: 1px solid #ddcebc; padding-top: 0.8rem; font-style: italic; }
/* --- 结束 --- */

/* --- 新增功能：弹窗与加载动画 CSS 开始 --- */
/* 按钮内联旋转动画与静默状态 */
.spin-svg-inline { animation: spinInline 1.2s linear infinite; }
@keyframes spinInline { 100% { transform: rotate(360deg); } }
.refresh-btn.is-loading { opacity: 0.6; cursor: default; pointer-events: none; border-color: transparent; }

/* 通用居中弹窗遮罩 */
.mag-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 900; display: flex; justify-content: center; align-items: center; opacity: 0; visibility: hidden; transition: 0.3s; }
.mag-modal-overlay.active { opacity: 1; visibility: visible; }

/* 选人弹窗 */
.mag-modal-box { background: #f8f0e7; width: 85%; max-width: 320px; border-radius: 12px; border: 2px solid #d4bfab; padding: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); transform: scale(0.9); transition: 0.3s; }
.mag-modal-overlay.active .mag-modal-box { transform: scale(1); }
.mag-modal-title { font-size: 15px; font-weight: bold; color: #4a3121; margin-bottom: 15px; border-bottom: 1px dashed #c4aa92; padding-bottom: 10px; }
.mag-contact-list { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
.mag-contact-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: #f0e5da; border-radius: 8px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
.mag-contact-item:active { background: #e8dbd1; border-color: #c4aa92; }
.mag-contact-avatar { width: 36px; height: 36px; border-radius: 50%; background-color: #ccc; background-size: cover; background-position: center; }
.mag-contact-name { font-size: 14px; color: #333; font-weight: bold; }
.mag-modal-close { font-size: 13px; color: #8a5d44; cursor: pointer; padding: 8px; }

/* 牛皮纸信件弹窗 (提问/回信) */
.mag-paper-box { background: #e3d2bd; width: 85%; max-width: 320px; padding: 25px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2), inset 0 0 20px rgba(0,0,0,0.05); border: 1px solid #c4aa92; position: relative; transform: translateY(20px); transition: 0.3s cubic-bezier(0.25,0.8,0.25,1); }
.mag-paper-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 10px; background: repeating-linear-gradient(45deg, #c4aa92, #c4aa92 10px, transparent 10px, transparent 20px); opacity: 0.3; }
.mag-modal-overlay.active .mag-paper-box { transform: translateY(0); }
.mag-paper-title { font-size: 16px; font-weight: bold; color: #4a3121; text-align: center; margin-bottom: 15px; font-family: 'Times New Roman', serif; letter-spacing: 2px; }
.mag-paper-input { width: 100%; height: 100px; background: rgba(255,255,255,0.4); border: 1px solid #c4aa92; border-radius: 4px; padding: 10px; font-size: 14px; font-family: 'Georgia', serif; color: #3a2519; resize: none; outline: none; margin-bottom: 15px; line-height: 1.5; }
.mag-paper-btn { background: #4a3121; color: #f8f0e7; text-align: center; padding: 10px; border-radius: 4px; font-size: 13px; cursor: pointer; letter-spacing: 2px; transition: 0.2s; }
.mag-paper-btn:active { transform: scale(0.96); }
.mag-paper-reply { font-family: 'Kaiti', 'STKaiti', serif; font-size: 16px; color: #3a2519; line-height: 1.6; margin-bottom: 20px; background: rgba(255,255,255,0.2); padding: 10px; border-radius: 4px; }
/* --- 结束 --- */



</style>