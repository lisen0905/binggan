<!-- components/ChatRoom.vue -->
<template>
  <div id="chat-room-app" :class="{ active: isOpen }">
    <!-- 悬浮胶囊顶栏 -->
    <div class="chat-capsule-header">
      <div class="capsule-btn" @click="closeChatRoom">‹</div>
      <div class="capsule-title">{{ contact?.settings?.remark || contact?.name || '聊天' }}</div>
      <div class="capsule-btn" style="font-size:14px;" @click="$emit('openSettings')">•••</div>
    </div>

        <!-- 📞 AI 主动来电悬浮横幅 (无遮罩，随拿随放) -->
    <div class="incoming-call-banner" :class="{ active: incomingCallType }">
      <div class="ic-left">
        <div class="ic-avatar" :style="contact?.avatar ? `background-image: url(${contact.avatar})` : ''"></div>
        <div class="ic-info">
          <div class="ic-name">{{ contact?.settings?.remark || contact?.name || 'TA' }}</div>
          <div class="ic-desc">邀请你进行{{ incomingCallType === 'video' ? '视频' : '语音' }}通话...</div>
        </div>
      </div>
      <div class="ic-right">
        <!-- 红色拒绝键 (全新带斜杠的拒接专属 SVG) -->
        <div class="ic-btn reject" @click="rejectIncomingCall">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
            <line x1="23" y1="1" x2="1" y2="23"></line>
          </svg>
        </div>
        <!-- 绿色接听键 -->
        <div class="ic-btn accept" @click="acceptIncomingCall">
          <!-- 根据来电类型显示电话或摄像机图标 -->
          <svg v-if="incomingCallType === 'voice'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        </div>
      </div>
    </div>

    <!-- 消息流展示区 -->
    <div class="chat-stream" id="chat-stream-container">
      <div id="load-more-btn" class="chat-time-stamp" style="cursor:pointer; display:none; color:var(--app-text-color);" onclick="window.loadMoreMessages()">—— 点击加载更多 ——</div>
      <div id="chat-messages-wrapper" style="display:flex; flex-direction:column; gap:4px;"></div>
    </div>

    <!-- 底部输入胶囊 -->
    <form id="chat-input-form" @submit.prevent="sendMsg" style="position: absolute; bottom: max(25px, env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); width: 94%; z-index: 85; display: flex; flex-direction: column; pointer-events: none;">
      <!-- 引用横幅 -->
      <div class="quote-banner" :class="{ active: currentQuoteMsg }">
        <div class="quote-text">正在回复: {{ quotePreviewText }}</div>
        <div class="quote-close" @click="cancelQuote">×</div>
      </div>

      <!-- 真正的输入栏 -->
      <div class="chat-input-bar" id="chat-input-bar" style="pointer-events: auto;">
        <div class="chat-svg-btn" @click="triggerAIReply">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 6c4.418 0 8 3.582 8 8v6H4v-6c0-4.418 3.582-8 8-8zM9 14v2m6-2v2"/></svg>
        </div>
        <input type="text" id="chat-input" class="chat-input-field" v-model="inputText" placeholder="对 TA 说点什么..." autocomplete="off" @focus="closeAllDrawers">
        <div class="chat-svg-btn" @click="openStickerDrawer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg></div>
        <div class="chat-svg-btn" @click="openMoreDrawer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></div>
        <button type="submit" class="chat-svg-btn" style="border:none; background:none; color:#555; padding:0; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 22px; height: 22px;"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
      </div>
    </form>

    <!-- 批量删除栏 -->
    <div class="multi-select-bar" :class="{ active: isMultiSelectMode }">
      <div class="ms-btn ms-cancel" @click="exitMultiSelectMode">取消</div>
      <div class="ms-btn ms-delete" @click="confirmMultiDelete">删除选中 (<span>{{ selectedMsgIdsForDelete.size }}</span>)</div>
    </div>

    <!-- 长按悬浮菜单 -->
    <div id="bubble-popover" class="bubble-popover" :class="{ active: isPopoverOpen }" :style="{ left: popoverX + 'px', top: popoverY + 'px' }">
      <div class="popover-item" @click="handleMenuAction('quote')">引用</div>
      <div class="popover-item" @click="handleMenuAction('edit')">编辑</div>
      <div class="popover-item" @click="handleMenuAction('regenerate')">重新回复</div>
      <div class="popover-item" @click="handleMenuAction('delete')">多选删除</div>
    </div>

    <!-- ================== 抽屉与弹窗区 ================== -->

    <!-- 1. 多功能抽屉 (含隐藏照片上传) -->
    <div id="more-drawer" :class="{ active: isMoreDrawerOpen }">
      <div class="more-grid">
        <input type="file" id="chat-image-upload" class="hidden-input" accept="image/*" @change="handleChatImageUpload">
        
        <!-- 1. 照片 -->
        <div class="more-item" @click="triggerImageUpload">
          <div class="more-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
          <div class="more-text">照片</div>
        </div>
        
        <!-- 2. 文字图 -->
        <div class="more-item" @click="openTxtImgPrompt">
          <div class="more-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.8 2.3a1 1 0 0 1 1.4 0l1.8 2.5a3 3 0 0 0 1.2 1.2l2.5 1.8a1 1 0 0 1 0 1.4l-2.5 1.8a3 3 0 0 0-1.2 1.2l-1.8 2.5a1 1 0 0 1-1.4 0l-1.8-2.5a3 3 0 0 0-1.2-1.2l-2.5-1.8a1 1 0 0 1 0-1.4l2.5-1.8a3 3 0 0 0 1.2-1.2l1.8-2.5Z"/><path d="M19 14l.8 1.2a2 2 0 0 0 .8.8l1.2.8a.5.5 0 0 1 0 .8l-1.2.8a2 2 0 0 0-.8.8l-.8 1.2a.5.5 0 0 1-.8 0l-.8-1.2a2 2 0 0 0-.8-.8l-1.2-.8a.5.5 0 0 1 0-.8l1.2-.8a2 2 0 0 0 .8-.8l.8-1.2a.5.5 0 0 1 .8 0Z"/></svg></div>
          <div class="more-text">文字图</div>
        </div>
        
        <!-- 3. 语音气泡 -->
        <div class="more-item" @click="openVoiceDrawer">
          <div class="more-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg></div>
          <div class="more-text">语音</div>
        </div>

           <!-- 4. 定位 (全新萌系版入口) -->
        <div class="more-item" @click="openLocationPrompt">
          <div class="more-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
          <div class="more-text">定位</div>
        </div>

        <!-- 5. 语音通话 (入口在这里！) -->
        <div class="more-item" @click="triggerVoiceCall">
          <div class="more-icon-box"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
          <div class="more-text">语音通话</div>
        </div>

            <!-- 6. 视频通话  -->
        <div class="more-item" @click="triggerVideoCall">
          <div class="more-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div>
          <div class="more-text">视频通话</div>
        </div>

          <!-- 7. 转账功能入口 -->
        <div class="more-item" @click="openTransferPrompt">
          <div class="more-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M8 12h.01"/></svg></div>
          <div class="more-text">转账</div>
        </div>


      </div>
    </div>

    <!-- 2. 语音 2.0 抽屉 -->
    <div id="voice-drawer" :class="{ active: isVoiceDrawerOpen }">
      <div id="voice-status-text" style="font-size: 14px; font-weight: bold; color: #7a94a9; margin-bottom: 20px;">点击下方麦克风开始录音</div>
      <div style="display: flex; justify-content: center; margin-bottom: 20px;">
        <div id="mic-btn" @click="toggleSpeechRecognition" style="width: 70px; height: 70px; border-radius: 50%; background: var(--icon-svg-color); display: flex; justify-content: center; align-items: center; color: white; cursor: pointer; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          <div id="mic-pulse" :class="{ 'mic-animating': isRecognizing }" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid var(--icon-svg-color); opacity: 0; pointer-events: none;"></div>
        </div>
      </div>
      <textarea id="voice-input-area" v-model="voiceInputText" class="setting-textarea" style="width: 85%; height: 90px; margin-bottom: 20px; font-size: 15px;" placeholder="可直接打字当语音发，或点击麦克风说话..."></textarea>
      <div style="display: flex; gap: 15px; width: 85%; margin-bottom: 10px;">
        <div class="modal-btn cancel-btn" @click="closeVoiceDrawer">取消</div>
        <div class="modal-btn confirm-btn" :style="{ opacity: voiceInputText ? 1 : 0.5, pointerEvents: voiceInputText ? 'auto' : 'none' }" style="background: #07c160;" @click="sendVoiceMessage">发送</div>
      </div>
    </div>

    <!-- 3. 表情包抽屉 -->
    <div id="sticker-drawer" :class="{ active: isStickerDrawerOpen }">
      <div class="sticker-header">
        <input type="text" class="sticker-search" v-model="stickerSearch" placeholder="搜索表情" @input="filterStickers">
        <div class="sticker-close" @click="closeStickerDrawer">×</div>
      </div>
      <div class="sticker-tabs">
        <div class="st-tab" :class="{ active: stickerScope === 'global' }" @click="switchStickerTab('global', '默认分类')">默认分类</div>
        <div v-if="hasExclusiveStickers" class="st-tab" :class="{ active: stickerScope === contact?.id }" @click="switchStickerTab(contact?.id, '默认分类')">专属设定</div>
        <div style="width:1px; height:15px; background:rgba(0,0,0,0.1); flex-shrink:0;"></div>
        <div class="st-tab" v-for="cat in dynamicStickerCats" :key="cat" :class="{ active: stickerCat === cat }" @click="switchStickerTab(stickerScope, cat)">{{ cat }}</div>

      <!-- 在 v-for 循环动态分类的后面，加上这个齿轮按钮 -->
      <div class="st-manage-btn" @click="openStickerManageModal">⚙️</div>

      </div>
      <div class="sticker-body">
        <div class="sticker-grid">
          <div v-if="filteredStickers.length === 0" style="text-align:center; color:#999; font-size:12px; margin-top:30px; grid-column:1/-1;">空空如也，快去配置导入吧！</div>
          <div class="sticker-item" v-for="s in filteredStickers" :key="s.id" @click="sendSticker(s)">
            <img :src="s.url" onerror="this.src=''; this.alt='失效';">
            <div class="sticker-item-name">{{ s.name }}</div>
          </div>
        </div>
      </div>
    </div>


    <!-- 📍 定位发送专属弹窗 -->
    <div class="modal-overlay" :class="{ active: isLocationPromptOpen }" style="z-index: 110;">
      <div class="modal-box" style="width: 85%; max-width: 320px; display: flex; flex-direction: column;">
        <div class="modal-title" style="color:var(--app-text-color);">发送我的位置</div>
        
        <label style="font-size:12px; color:#666; display: flex; align-items: center; gap: 6px; margin-bottom: 12px; cursor: pointer;">
          <input type="checkbox" v-model="useRealLocation" @change="handleLocationTypeChange">
          获取真实城市定位
        </label>
        
        <input type="text" v-model="locationInputText" class="setting-textarea" style="height: 40px; margin-bottom: 20px; padding: 0 10px;" :placeholder="useRealLocation ? '定位中...' : '输入你所在的地点(如: 魔法部)...'">
        
        <div class="modal-buttons">
          <div class="modal-btn cancel-btn" @click="isLocationPromptOpen = false">取消</div>
          <div class="modal-btn confirm-btn" style="background:#5b6d82;" @click="sendLocationMessage">发送</div>
        </div>
      </div>
    </div>

    <!-- 4. 文字图专属弹窗 -->
    <div class="modal-overlay" :class="{ active: isTxtImgInputOpen }" style="z-index: 110;">
      <div class="modal-box" style="width: 85%; max-width: 320px; display: flex; flex-direction: column;">
        <div class="modal-title" style="color:var(--app-text-color);">发送文字图</div>
        <textarea v-model="txtImgInput" class="setting-textarea" style="height: 120px; margin-bottom: 20px;" placeholder="请输入你要发送的画面描述..."></textarea>
        <div class="modal-buttons">
          <div class="modal-btn cancel-btn" @click="isTxtImgInputOpen = false">取消</div>
          <div class="modal-btn confirm-btn" @click="sendTxtImg">发送</div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" :class="{ active: isTxtImgViewOpen }" style="z-index: 110;">
      <div class="modal-box" style="width: 80%; max-width: 300px; display: flex; flex-direction: column; background: rgba(245,247,250,0.95);">
        <div class="modal-title" style="color:var(--app-text-color);">画面描述</div>
        <div style="flex: 1; overflow-y: auto; text-align: left; font-size: 14px; color: #555; line-height: 1.6; padding: 12px; background: rgba(255,255,255,0.6); border-radius: 12px; margin-bottom: 20px; white-space: pre-wrap; word-wrap: break-word;">
          {{ txtImgViewContent }}
        </div>
        <div class="modal-buttons">
          <div class="modal-btn confirm-btn" @click="isTxtImgViewOpen = false">关闭</div>
        </div>
      </div>
    </div>

    <!-- 5. 思维链弹窗 -->
    <div class="modal-overlay" :class="{ active: isThinkModalOpen }" style="z-index: 110;">
      <div class="modal-box" style="width: 85%; max-height: 70vh; display: flex; flex-direction: column; background: rgba(245,247,250,0.95);">
        <div class="modal-title" style="color:var(--app-text-color);">思考中</div>
        <div style="flex: 1; overflow-y: auto; text-align: left; font-size: 14px; color: #555; line-height: 1.6; padding: 12px; background: rgba(255,255,255,0.6); border-radius: 12px; margin-bottom: 15px; white-space: pre-wrap;">
          {{ thinkContent }}
        </div>
        <div class="modal-buttons">
          <div class="modal-btn confirm-btn" @click="isThinkModalOpen = false">关闭</div>
        </div>
      </div>
    </div>

    <!-- ==========================================
         🎙️ 冰川蓝排版：沉浸式语音通话全息界面
         ========================================== -->
    <div class="call-screen-overlay light-theme" :class="{ active: isCallScreenOpen }">
      <!-- 极简背景（CSS已换成冰川蓝渐变） -->
      <div class="call-bg-light"></div>
      
      <!-- 顶部：左右布局高级信息区 -->
      <div class="call-top-row">
        <!-- 左侧：呼吸灯头像 -->
        <div class="call-avatar-wrapper">
          <div class="call-avatar-pulse"></div>
          <div class="call-avatar-inner" :style="contact?.avatar ? `background-image: url(${contact.avatar})` : ''"></div>
        </div>
        
        <!-- 右侧：文字与声波 -->
        <div class="call-info-right">
          <h2 class="call-char-name-light">{{ contact?.settings?.remark || contact?.name || 'TA' }}</h2>
          <div class="call-status-line">
            <span class="call-status-text">{{ callStatusText === '正在等待 TA接听...' ? callStatusText : '通话中' }}</span>
            <span class="call-timer-text" v-show="callStatusText !== '正在等待 TA 接听...'">{{ callStatusText }}</span>
          </div>
          <!-- 动态音频波动条 -->
          <div class="call-audio-waves" v-show="callStatusText !== '正在等待 TA 接听...'">
            <span class="audio-wave"></span>
            <span class="audio-wave wave-delay-1"></span>
            <span class="audio-wave wave-delay-2"></span>
            <span class="audio-wave wave-delay-3"></span>
            <span class="audio-wave wave-delay-1"></span>
          </div>
        </div>
      </div>

      <!-- 中间大区域：左右对话气泡字幕 -->
      <div class="call-chat-area-light" id="call-subtitles-container">
        <div v-for="(sub, idx) in callSubtitles" :key="idx" class="call-msg-row-light" :class="sub.sender">
          <div class="call-bubble-light">
            <!-- AI 等待呼吸灯 -->
            <template v-if="sub.isTyping">
              <div class="typing-indicator" style="margin:0;"><div class="typing-dot" style="background:#94a3b8;"></div><div class="typing-dot" style="background:#94a3b8;"></div><div class="typing-dot" style="background:#94a3b8;"></div></div>
            </template>
            <!-- 真实字幕 -->
            <template v-else>
              {{ sub.text }}
            </template>
          </div>
        </div>
      </div>

      <!-- 底部操作区 -->
      <div class="call-bottom-wrapper">
        <!-- 隐藏的输入胶囊 (点击左侧麦克风弹出) -->
        <div class="call-input-capsule" :class="{ active: isCallInputOpen }">
          <input type="text" v-model="callInputText" class="call-input-light" placeholder="打字或语音转文字..." @keydown.enter.prevent="sendCallMessage" />
          <div class="call-mic-btn" :class="{ active: isCallRecognizing }" @click="toggleCallSpeech">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </div>
          <div class="call-send-btn" @click="sendCallMessage">发送</div>
        </div>

        <!-- 底部三大金刚键 -->
        <div class="call-controls-light">
          <!-- 左侧：麦克风(打开输入) -->
          <button class="call-btn-light shadow-btn" @click="isCallInputOpen = !isCallInputOpen">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
          
          <!-- 中间：红色挂断 -->
          <button class="call-btn-danger shadow-btn" @click="hangUpCall">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="2" style="transform: rotate(135deg);"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>

          <!-- 右侧：扬声器(触发TA说话) -->
          <button class="call-btn-light shadow-btn" @click="triggerCallAIReply">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#94a3b8" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 通话记录查看弹窗 -->
    <div class="modal-overlay" :class="{ active: isCallHistoryOpen }" style="z-index: 110; background: rgba(0,0,0,0.4); backdrop-filter: none;">
      <div class="modal-box" style="width: 85%; max-height: 70vh; display: flex; flex-direction: column; background: #fff;">
        <div class="modal-title" style="color:#000;">通话文字记录</div>
        <div style="flex: 1; overflow-y: auto; text-align: left; font-size: 14px; color: #333; line-height: 1.6; padding: 12px; background: #f5f6f8; border-radius: 12px; margin-bottom: 20px;">
          <div v-if="callHistoryLogs.length === 0" style="text-align:center; color:#999; margin-top:20px;">记录为空</div>
          <div v-for="(log, idx) in callHistoryLogs" :key="idx" style="margin-bottom:8px;">
            <span :style="{ color: log.sender === 'user' ? '#07c160' : '#5b6d82', fontWeight: 'bold' }">{{ log.sender === 'user' ? '我' : (contact?.name || 'TA') }}:</span>
            {{ log.text }}
          </div>
        </div>
        <div class="modal-buttons">
          <div class="modal-btn confirm-btn" style="background: #5b6d82; color:#fff;" @click="isCallHistoryOpen = false">关闭</div>
        </div>
      </div>
    </div>


    <!-- 隐藏的表情包文件上传 -->
    <input type="file" id="sticker-file-upload" class="hidden-input" accept=".txt,.json,.docx" @change="handleStickerFileUpload">
    
    <!-- 表情包管理弹窗 -->
    <div id="sticker-manage-modal" class="modal-overlay" :class="{ active: isStickerManageOpen }" style="z-index: 110;">
      <div class="modal-box" style="width: 85%; max-height: 80vh; display: flex; flex-direction: column;">
        <div class="modal-title" style="color:var(--app-text-color);">表情包管理中心</div>
        
        <div style="flex: 1; overflow-y: auto; text-align: left; margin-bottom: 15px;">
          <div style="margin-bottom:12px;">
            <div style="font-size:12px; font-weight:bold; color:var(--app-text-color); margin-bottom:6px;">导入归属权限</div>
            <select v-model="newStickerScope" class="setting-textarea">
              <option value="global">默认分类 (通用)</option>
              <option :value="contact?.id">专属设定 (仅限当前角色)</option>
            </select>
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:12px; font-weight:bold; color:var(--app-text-color); margin-bottom:6px;">子分类名</div>
            <input type="text" v-model="newStickerCat" class="setting-textarea" placeholder="留空则归入'默认分类'">
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:12px; font-weight:bold; color:var(--app-text-color); margin-bottom:6px;">选择文件解析 (txt, docx)</div>
            <div class="modal-btn confirm-btn" style="background:#7a94a9; text-align:center; padding:10px;" @click="triggerStickerUpload">选取文件预览</div>
          </div>
          
          <!-- 动态预览区 -->
          <div v-show="tempParsedStickers.length > 0" style="margin-top:10px; border-top:1px dashed rgba(0,0,0,0.1); padding-top:10px;">
            <div style="font-size:12px; color:var(--icon-svg-color); margin-bottom:6px;">解析预览 ({{ tempParsedStickers.length }}张)</div>
            <div class="sticker-grid" style="max-height:120px; overflow-y:auto; margin-bottom:10px;">
              <div class="sticker-item" v-for="s in tempParsedStickers" :key="s.id">
                <img :src="s.url">
                <div class="sticker-item-name">{{ s.name }}</div>
              </div>
            </div>
            <div class="modal-btn confirm-btn" style="background:#07c160; text-align:center; padding:10px;" @click="confirmSaveStickers">确认无误，保存入库</div>
          </div>

          <hr style="border:none; border-top:1px dashed rgba(0,0,0,0.1); margin:15px 0;">
          
          <div style="margin-bottom:12px;">
            <div style="font-size:12px; font-weight:bold; color:#ff3b30; margin-bottom:6px;"></div>
            <div class="modal-btn cancel-btn" style="color:#ff3b30; background:rgba(255,59,48,0.1); text-align:center; padding:10px;" @click="deleteCurrentStickerCat">删除当前选中分类</div>
          </div>
        </div>

        <div class="modal-buttons">
          <div class="modal-btn cancel-btn" @click="closeStickerManageModal">关闭</div>
        </div>
      </div>
    </div>
    <!-- 视频通话：配置立绘与背景弹窗 (三段式高级版) -->
    <div class="modal-overlay" :class="{ active: isVideoSetupOpen }" style="z-index: 120;">
      <div class="modal-box" style="width: 85%; max-width: 320px; display: flex; flex-direction: column; max-height: 80vh; overflow-y: auto;">
        <div class="modal-title" style="color:var(--app-text-color);">视频通话场景布置</div>
        
        <!-- 第一段：背景图 -->
        <div style="font-size:13px; font-weight:bold; color:var(--app-text-color); margin-bottom:8px; text-align:left;">1. 场景背景图 (可选)</div>
        <div style="display: flex; gap: 8px; margin-bottom: 20px; align-items: center;">
          <input type="text" v-model="videoSetupInputBg" class="setting-textarea" style="height: 36px; margin: 0; padding: 0 10px;" placeholder="留空默认纯黑...">
          <div class="modal-btn confirm-btn" style="background:#7a94a9; padding: 0; width: 40px; height: 36px; flex-shrink: 0; display: flex; justify-content: center; align-items: center;" @click="handleVideoLocalUpload('bg')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
        </div>

        <!-- 第二段：主体立绘 -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom:8px;">
          <div style="font-size:13px; font-weight:bold; color:var(--app-text-color); text-align:left;">2. TA的专属立绘</div>
          <label style="font-size:11px; color:#666; display: flex; align-items: center; gap: 4px;">
            <input type="checkbox" v-model="useEmotionAvatar"> 开启情绪变脸
          </label>
        </div>
        
        <!-- 没开情绪：单立绘 -->
        <div v-show="!useEmotionAvatar" style="display: flex; gap: 8px; margin-bottom: 20px; align-items: center;">
          <input type="text" v-model="videoSetupInputChar" class="setting-textarea" style="height: 36px; margin: 0; padding: 0 10px;" placeholder="粘贴链接或上传...">
          <div class="modal-btn confirm-btn" style="background:#7a94a9; padding: 0; width: 40px; height: 36px; flex-shrink: 0; display: flex; justify-content: center; align-items: center;" @click="handleVideoLocalUpload('char')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
        </div>

        <!-- 开了情绪：相册格子阵列 -->
        <div v-show="useEmotionAvatar" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 20px;">
          <div v-for="(val, key) in { default: '默认', happy: '开心', angry: '生气', sad: '悲伤', shy: '害羞' }" :key="key" style="display:flex; flex-direction:column; align-items:center; gap:4px;">
            <div @click="handleVideoLocalUpload('emotion', key)" style="width:100%; aspect-ratio:1/1; border:1px dashed #ccc; border-radius:8px; display:flex; justify-content:center; align-items:center; cursor:pointer; overflow:hidden; background:rgba(0,0,0,0.02);">
              <img v-if="emotionAvatars[key]" :src="emotionAvatars[key]" style="width:100%; height:100%; object-fit:cover;">
              <span v-else style="color:#aaa; font-size:16px;">+</span>
            </div>
            <span style="font-size:10px; color:#5b6d82;">{{ val }}</span>
          </div>
        </div>

        <!-- 第三段：机位微调 -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom:8px;">
          <div style="font-size:13px; font-weight:bold; color:var(--app-text-color); text-align:left;">3. 机位微调</div>
          <label style="font-size:11px; color:#666; display: flex; align-items: center; gap: 4px;">
            <input type="checkbox" v-model="useAvatarTransform"> 开启位移缩放
          </label>
        </div>
        
        <!-- 位移控制滑块 -->
        <div v-show="useAvatarTransform" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; background:rgba(0,0,0,0.03); padding:10px; border-radius:10px;">
          <div style="display:flex; align-items:center; font-size:11px; color:#555;">
            <span style="width:40px;">缩放</span>
            <input type="range" v-model="avatarTransform.scale" min="50" max="250" style="flex:1;">
            <span style="width:35px; text-align:right;">{{ avatarTransform.scale }}%</span>
          </div>
          <div style="display:flex; align-items:center; font-size:11px; color:#555;">
            <span style="width:40px;">左右</span>
            <!-- 修改点：最小值-300，最大值300 -->
            <input type="range" v-model="avatarTransform.x" min="-300" max="300" style="flex:1;">
            <span style="width:35px; text-align:right;">{{ avatarTransform.x }}</span>
          </div>
          <div style="display:flex; align-items:center; font-size:11px; color:#555;">
            <span style="width:40px;">上下</span>
            <!-- 修改点：最小值-300，最大值300 -->
            <input type="range" v-model="avatarTransform.y" min="-300" max="300" style="flex:1;">
            <span style="width:35px; text-align:right;">{{ avatarTransform.y }}</span>
          </div>
        </div>

        <div class="modal-buttons">
          <div class="modal-btn cancel-btn" @click="closeVideoSetup">取消</div>
          <div class="modal-btn confirm-btn" style="background:#5b6d82;" @click="saveVideoSetup">确定布置</div>
        </div>
      </div>
    </div>



    
    <!-- 视频通话：真实摄像头隐私声明弹窗 -->
    <div class="modal-overlay" :class="{ active: isVideoPrivacyOpen }" style="z-index: 120;">
      <div class="modal-box" style="width: 85%; max-width: 320px; display: flex; flex-direction: column;">
        <div class="modal-title" style="color:#333;">隐私保护说明</div>
        <div style="font-size:13px; color:#555; text-align:left; line-height:1.6; margin-bottom:20px;">
          为保护您的隐私，真实摄像头画面仅在本地浏览器处理与截帧，开发者无法获取、收集任何您的视频数据。
        </div>
        <div class="modal-buttons">
          <div class="modal-btn cancel-btn" @click="cancelVideoPrivacy">拒绝</div>
          <div class="modal-btn confirm-btn" style="background:#5b6d82;" @click="confirmVideoPrivacy">已知晓并同意</div>
        </div>
      </div>
    </div>



    <!-- ==========================================
         🎞️ 视觉小说版：沉浸式视频通话全息界面
         ========================================== -->
    <div class="video-screen-overlay" :class="{ active: isVideoScreenOpen }">
      <!-- 极简背景层 (可自定义，默认纯黑) -->
      <div class="video-bg" :style="currentVideoBgImg ? `background-image: url(${currentVideoBgImg})` : ''"></div>
      
      <!-- 顶部环境区 -->
      <div class="video-top-bar">
        <!-- ⚙️ 换装/换景设置键 (极简线框) -->
        <div class="video-icon-btn" @click="openVideoSetupFromCall">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ccc" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
        </div>
        
        <!-- 右上角画中画 PiP 小窗 -->
        <div class="video-pip-window" @click="toggleVideoCamera">
          <video v-show="videoCameraMode !== 'avatar'" id="video-local-video" autoplay playsinline muted></video>
          <div v-show="videoCameraMode === 'avatar'" class="video-pip-avatar" :style="userAvatarUrl ? `background-image: url(${userAvatarUrl})` : ''"></div>
          <div class="video-pip-switch">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
        </div>
      </div>

        <!-- 中心立绘层 (带呼吸起伏与缩放位移特效) -->
      <div class="video-char-layer">
        <!-- 新增机位包裹层，用内联样式直接绑定位移缩放，且不影响子元素的呼吸特效 -->
        <div 
          :style="useAvatarTransform ? `transform: scale(${avatarTransform.scale / 100}) translate(${avatarTransform.x}px, ${avatarTransform.y}px); transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);` : ''" 
          style="display: flex; justify-content: center; align-items: flex-end; width: 100%; height: 100%;"
        >
          <img :src="currentVideoCharImg" class="video-char-art" alt="">
        </div>
      </div>

       <!-- 底部输入弹层 (合二为一：打字+语音) -->
      <div class="video-input-capsule" :class="{ active: isVideoInputOpen }">
        <input type="text" v-model="videoInputText" class="video-input-field" placeholder="输入文字，或点击右侧麦克风..." @keydown.enter.prevent="sendVideoMessage">
        <!-- 语音识别小按钮 -->
        <div class="video-mic-btn" :class="{ active: isVideoRecognizing }" @click="toggleVideoSpeech">
           <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
        </div>
        <div class="video-send-btn" @click="sendVideoMessage">发送</div>
      </div>

      <!-- 🍊 橙光游戏式底部对话框 -->
      <div class="vn-dialog-container">
        
        <!-- 【全新】左右对齐的头部区域 -->
        <div class="vn-header">
          <!-- 左侧：名字标签 -->
          <div class="vn-name-label">{{ contact?.settings?.remark || contact?.name || 'TA' }}</div>
          
          <!-- 右侧：按比例缩小的操作按钮组 -->
          <div class="vn-btn-group">
            <div class="vn-log-btn" @click="isVideoLogOpen = true">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 回顾
            </div>
            <div class="vn-log-btn" @click="isVideoInputOpen = !isVideoInputOpen">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> 说话
            </div>
            <div class="vn-log-btn" @click="triggerVideoAIReply">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> 听TA说
            </div>
            <!-- 挂断键 -->
            <div class="vn-log-btn" style="background: #4b5563; border-color: #374151; color: #fff;" @click="hangUpVideoCall">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate(135deg);"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> 挂断
            </div>
          </div>
        </div>
        
        <!-- 滚动文字区 (橙光游戏交互版) -->
        <div class="vn-text-content" @click="handleVnBoxClick" style="cursor: pointer; position: relative;">
          <div v-if="vnDisplayState.isActive">
             <span>{{ vnDisplayState.text }}</span>
             <span v-show="vnDisplayState.isWaiting" class="vn-next-indicator">▼</span>
          </div>
          <div v-else-if="videoSubtitles.length > 0">
             <span v-if="videoSubtitles[videoSubtitles.length - 1].isTyping" class="vn-typing-dot">正在输入...</span>
             <span v-else>{{ videoSubtitles[videoSubtitles.length - 1].showText || videoSubtitles[videoSubtitles.length - 1].text }}</span>
          </div>
          <div v-else style="color:rgba(255,255,255,0.4);">正在建立视频通讯...</div>
        </div>
      </div>
    </div>

    <!-- 视频通话专属历史回顾 (Log) 弹窗 -->
    <div class="modal-overlay" :class="{ active: isVideoLogOpen }" style="z-index: 120;">
      <div class="modal-box" style="width: 90%; max-height: 75vh; display: flex; flex-direction: column; background: rgba(30, 30, 30, 0.95); backdrop-filter: blur(15px); border: 1px solid #444;">
        <div class="modal-title" style="color:#eee;">剧情历史回顾 (Log)</div>
        <div style="flex: 1; overflow-y: auto; text-align: left; font-size: 14px; color: #ccc; line-height: 1.6; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 12px; margin-bottom: 20px;">
          <div v-if="videoSubtitles.length === 0" style="text-align:center; color:#666; margin-top:20px;">暂无台词记录</div>
          <div v-for="(sub, idx) in videoSubtitles" :key="idx" style="margin-bottom:12px;">
            <span :style="{ color: sub.sender === 'user' ? '#888' : '#fff', fontWeight: 'bold' }">{{ sub.sender === 'user' ? '我' : (contact?.name || 'TA') }}:</span>
            <span style="color:#ddd;">{{ sub.text }}</span>
          </div>
        </div>
        <div class="modal-buttons">
          <div class="modal-btn confirm-btn" style="background: #555; color:#fff;" @click="isVideoLogOpen = false">关闭</div>
        </div>
      </div>
    </div>
    
    
        <!-- 💸 1. User 主动发起转账的输入弹窗 -->
    <div class="modal-overlay" :class="{ active: isTransferPromptOpen }" style="z-index: 110;">
      <div class="modal-box" style="width: 85%; max-width: 320px; display: flex; flex-direction: column;">
        <div class="modal-title" style="color:var(--app-text-color);">发起转账</div>
        
        <div style="position: relative; margin-bottom: 15px;">
            <span style="position: absolute; left: 15px; top: 10px; font-size: 18px; font-weight: bold; color: #333;">¥</span>
            <input type="number" v-model="transferAmount" class="setting-textarea" style="height: 45px; padding-left: 35px; font-size: 18px; font-weight: bold;" placeholder="0.00">
        </div>
        
        <input type="text" v-model="transferNote" class="setting-textarea" style="height: 40px; margin-bottom: 20px; padding: 0 10px;" placeholder="添加备注 (如: 买奶茶~)">
        
        <div class="modal-buttons">
          <div class="modal-btn cancel-btn" @click="isTransferPromptOpen = false">取消</div>
          <div class="modal-btn confirm-btn" style="background:#07c160;" @click="sendTransferMessage">发送</div>
        </div>
      </div>
    </div>

    <!-- 💸 2. 收到 AI 转账时的抉择弹窗 -->
    <div class="modal-overlay" :class="{ active: isTransferActionOpen }" style="z-index: 110;">
      <div class="modal-box" style="width: 85%; max-width: 300px; display: flex; flex-direction: column;">
        <div class="modal-title" style="color:var(--app-text-color);">收到一笔转账</div>
        <div style="font-size: 13px; color: #666; margin-bottom: 20px;">是否要收下TA的心意？</div>
        <div class="modal-buttons">
          <div class="modal-btn cancel-btn" style="color: #ff3b30; background: rgba(255,59,48,0.1);" @click="confirmTransferAction('rejected')">退回</div>
          <div class="modal-btn confirm-btn" style="background:#07c160;" @click="confirmTransferAction('accepted')">收下</div>
        </div>
        <div style="margin-top: 15px; font-size: 12px; color: #aaa; cursor: pointer;" @click="isTransferActionOpen = false">先放着不管</div>
      </div>
    </div>



      </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { initDB, getSettingValue } from '../utils/db.js'

const props = defineProps({
  isOpen: Boolean,
  contact: Object
})
const emit = defineEmits(['close', 'openSettings', 'openMail', 'openMagazine'])


// ==========================================
// 📍 定位功能状态与逻辑
// ==========================================
const isLocationPromptOpen = ref(false)
const useRealLocation = ref(false)
const locationInputText = ref('')

const openLocationPrompt = () => {
  closeAllDrawers()
  useRealLocation.value = false
  locationInputText.value = ''
  isLocationPromptOpen.value = true
}

const handleLocationTypeChange = async () => {
  if (useRealLocation.value) {
    locationInputText.value = '正在获取坐标...'
    try {
      // 借用底层的环境坐标系统
      const coords = await getSettingValue('env_coords')
      if (coords) {
        locationInputText.value = '已获取真实城市坐标 (可补充具体地点)'
      } else {
        locationInputText.value = '未授权系统定位，请手动输入哦'
      }
    } catch (e) {
      locationInputText.value = '无法获取位置，请手动输入'
    }
  } else {
    locationInputText.value = ''
  }
}

const sendLocationMessage = async () => {
  const loc = locationInputText.value.trim()
  if (!loc || loc.includes('正在获取')) return alert("请输入有效的地点哦！")
  
  await saveMessageToDB('user', `[LOCATION:${loc}]`)
  isLocationPromptOpen.value = false
}


// ==========================================
// 状态与变量
// ==========================================
const inputText = ref('')
const currentChatHistory = ref([])
const currentLoadedCount = ref(0)
const LOAD_STEP = 20
let lastSenderType = null
const userAvatarUrl = ref('')

// 抽屉与面板状态
const isMoreDrawerOpen = ref(false)
const isStickerDrawerOpen = ref(false)
const isVoiceDrawerOpen = ref(false)
const isPopoverOpen = ref(false)
const popoverX = ref(0)
const popoverY = ref(0)

// 引用状态
const currentQuoteMsg = ref(null)
const quotePreviewText = ref('')

// 多选状态
const isMultiSelectMode = ref(false)
const selectedMsgIdsForDelete = ref(new Set())
let selectedMenuMsg = null

// 弹窗状态
const isTxtImgInputOpen = ref(false)
const txtImgInput = ref('')
const isTxtImgViewOpen = ref(false)
const txtImgViewContent = ref('')
const isThinkModalOpen = ref(false)
const thinkContent = ref('')


// ==========================================
// 💸 转账引擎专属状态与逻辑
// ==========================================
const isTransferPromptOpen = ref(false)
const transferAmount = ref('')
const transferNote = ref('')
const isTransferActionOpen = ref(false)
const currentActionTransferId = ref(null)

const openTransferPrompt = () => {
  closeAllDrawers()
  transferAmount.value = ''
  transferNote.value = '恭喜发财，大吉大利'
  isTransferPromptOpen.value = true
}

const sendTransferMessage = async () => {
  const amt = parseFloat(transferAmount.value)
  if (isNaN(amt) || amt <= 0) return alert("请输入正确的转账金额哦！")
  const note = transferNote.value.trim() || '恭喜发财，大吉大利'
  
  const tid = 'tr_' + Date.now() + Math.floor(Math.random()*1000)
  // 保存到数据库，状态默认为 pending
  await saveMessageToDB('user', `[TRANSFER:${tid}|${amt.toFixed(2)}|${note}|pending]`)
  isTransferPromptOpen.value = false
}

// 处理点击 AI 发来的转账
const confirmTransferAction = async (actionStatus) => {
  const tid = currentActionTransferId.value
  isTransferActionOpen.value = false
  if (!tid) return
  
  let changed = false
  currentChatHistory.value.forEach(m => {
    if (m.text && m.text.includes(`[TRANSFER:${tid}`)) {
      m.text = m.text.replace(/\|pending\]$/, `|${actionStatus}]`)
      changed = true
    }
  })
  
  if (changed) {
    await updateDBSync()
    renderMessagesChunk(currentLoadedCount.value, true)
    
    // 悄悄发送隐藏指令给 AI 增加潜意识记忆（绝不弹屏，只记录在案）
    const actionText = actionStatus === 'accepted' ? '收下' : '退回'
    await saveMessageToDB('user', `[系统感知：我已${actionText}了你的转账][HIDDEN]`, true)
  }
}

// AI 后台拦截收取/退回转账
const interceptTransferCommand = async (charId, actionStatus) => {
  const db = await initDB()
  const tx = db.transaction(['chat_history_db'], 'readwrite')
  const store = tx.objectStore('chat_history_db')
  const histData = await new Promise(res => store.get(charId).onsuccess = e => res(e.target.result))
  
  if (histData && histData.messages) {
    // 从后往前找，找到最新的一笔你发出的、还在 pending 的转账
    for (let i = histData.messages.length - 1; i >= 0; i--) {
      let m = histData.messages[i]
      if (m.sender === 'user' && m.text.includes('|pending]')) {
        m.text = m.text.replace(/\|pending\]$/, `|${actionStatus}]`)
        break
      }
    }
    await new Promise(res => { store.put(histData).onsuccess = res })
    
    if (props.isOpen && props.contact && props.contact.id === charId) {
      currentChatHistory.value = histData.messages
      renderMessagesChunk(currentLoadedCount.value, true)
    }
  }
}

// 👇👇👇 核心修复：把点击事件挂载到全局 window 上，HTML 就能认识它了！
onMounted(() => {
  window.handleTransferClick = (transferId, sender, status) => {
    // 只有当 AI (char) 发来的，且还在等待收款 (pending) 时，才能点击触发抉择弹窗
    if (sender === 'char' && status === 'pending') {
      currentActionTransferId.value = transferId
      isTransferActionOpen.value = true
    }
  }
})


// ==========================================
// 生命周期与全局挂载
// ==========================================
onMounted(async () => {
  const userProf = await getSettingValue('user_profile')
  if (userProf && userProf.avatar) userAvatarUrl.value = userProf.avatar

  // 👇 【新增这一段：让特刊卡片可以被点击并传出数据】 👇
  window.openMagazineReview = (encodedData) => {
    try {
      const parsedData = JSON.parse(decodeURIComponent(encodedData))
      // 呼叫外面的父组件打开杂志，并把回顾数据传出去！
      emit('openMagazine', parsedData)
    } catch(e) {
      alert("特刊数据读取失败~")
    }
  }
  // 👆 结束 👆

  window.openThinkModal = (encodedContent) => {
    thinkContent.value = decodeURIComponent(encodedContent)
    isThinkModalOpen.value = true
  }
  window.openTxtImgViewModal = (encodedDesc) => {
    txtImgViewContent.value = decodeURIComponent(encodedDesc)
    isTxtImgViewOpen.value = true
  }
  window.toggleMsgCheck = (ele, msgId) => {
    if (ele.classList.contains('checked')) {
      ele.classList.remove('checked'); selectedMsgIdsForDelete.value.delete(msgId);
    } else {
      ele.classList.add('checked'); selectedMsgIdsForDelete.value.add(msgId);
    }
  }
  window.loadMoreMessages = () => {
    currentLoadedCount.value += LOAD_STEP
    if (currentLoadedCount.value > currentChatHistory.value.length) currentLoadedCount.value = currentChatHistory.value.length
    renderMessagesChunk(currentLoadedCount.value, true)
  }
  
  // 【升级】：不仅告诉外面要打开邮件详情，还把具体的邮件 ID 传出去！
  window.openMailApp = (mailId) => { 
    emit('openMail', mailId) 
  }

  if (!window.activeAITasks) window.activeAITasks = {}
  
  document.getElementById('chat-stream-container').addEventListener('click', closeAllDrawers)
})

onUnmounted(() => {
  document.getElementById('chat-stream-container')?.removeEventListener('click', closeAllDrawers)
})

watch(() => props.isOpen, async (newVal) => {
  if (newVal && props.contact) {
    await initRoom()
  } else {
    currentChatHistory.value = []
    document.getElementById('chat-messages-wrapper').innerHTML = ''
    closeAllDrawers()
  }
})

const closeChatRoom = () => { emit('close') }
const closeAllDrawers = () => {
  isMoreDrawerOpen.value = false
  isStickerDrawerOpen.value = false
  isVoiceDrawerOpen.value = false
  isPopoverOpen.value = false
}

// ==========================================
// 【新增】：管理小黑屋的后台闹钟 (必须放在 initRoom 上面)
// ==========================================
const unblockTimers = {}
const startUnblockTimer = (charId, delayMs) => {
  if (unblockTimers[charId]) clearTimeout(unblockTimers[charId])
  
  unblockTimers[charId] = setTimeout(async () => {
    // 1. 时间到，在数据库里解除拉黑
    const db = await initDB()
    const tx = db.transaction(['contacts_profiles'], 'readwrite')
    const store = tx.objectStore('contacts_profiles')
    const charReq = await new Promise(res => store.get(charId).onsuccess = e => res(e.target.result))
    
    if (charReq && charReq.settings) {
      charReq.settings.blacklistedUntil = null
      await new Promise(res => { store.put(charReq).onsuccess = res })
    }
    
    // 2. 更新当前页面的状态，并触发诈尸回复
    if (props.contact && props.contact.id === charId && props.contact.settings) {
      props.contact.settings.blacklistedUntil = null
      props.contact._justUnblacklisted = true // 挂上情境指令标签
      await triggerAIReply(true)              // 召唤 AI 诈尸
      delete props.contact._justUnblacklisted // 阅后即焚
    }
  }, delayMs)
}

// ==========================================
// 核心渲染引擎 (进门即挂号 + 小黑屋离线检查)
// ==========================================
const initRoom = async () => {
  const db = await initDB()
  const charId = props.contact.id
  
  // 【修复】：每次进门都重新获取一次 User 的最新头像，解决灰头像不同步的问题！
  const userProf = await getSettingValue('user_profile')
  if (userProf && userProf.avatar) {
    userAvatarUrl.value = userProf.avatar
  }
  
  // 1. 进门挂号逻辑，确保数据库一定有这条记录
  const tx = db.transaction(['chat_history_db'], 'readwrite')
  const store = tx.objectStore('chat_history_db')
  
  store.get(charId).onsuccess = (req) => {
    let data = req.target.result
    if (!data) {
      data = { charId: charId, messages: [] }
      store.put(data)
    }
    
    currentChatHistory.value = data.messages || []
    currentLoadedCount.value = Math.min(LOAD_STEP, currentChatHistory.value.length)
    renderMessagesChunk(currentLoadedCount.value, false)

    if (window.activeAITasks[charId]) {
      appendTypingIndicator(charId, props.contact.avatar)
    }
  }

  // 2. 【新增】：进房时检查是否还在小黑屋里
  const charReq = await new Promise(res => db.transaction(['contacts_profiles'], 'readonly').objectStore('contacts_profiles').get(charId).onsuccess = e => res(e.target.result))
  
  if (charReq && charReq.settings && charReq.settings.blacklistedUntil) {
    const now = Date.now()
    if (now < charReq.settings.blacklistedUntil) {
      // 情况A：还没到解封时间，继续定个闹钟
      startUnblockTimer(charId, charReq.settings.blacklistedUntil - now)
    } else {
      // 情况B：在你离线的时候，小黑屋时间已经过了！立刻解封并诈尸！
      charReq.settings.blacklistedUntil = null
      const tx2 = db.transaction(['contacts_profiles'], 'readwrite')
      tx2.objectStore('contacts_profiles').put(charReq)
      if (props.contact.settings) props.contact.settings.blacklistedUntil = null
      
      props.contact._justUnblacklisted = true
      // 延迟 1 秒触发，假装 AI 看到你上线了才发消息
      setTimeout(() => {
        triggerAIReply(true)
        delete props.contact._justUnblacklisted
      }, 1000)
    }
  }

  loadStickers()
}


// 修复：加载消息时头像智能显示
const appendTypingIndicator = (charId, avatarUrl) => {
  const wrapper = document.getElementById('chat-messages-wrapper')
  const avatarStyle = avatarUrl ? `background: url(${avatarUrl}) center/cover` : 'background: #999'
  
  // 【核心修复】：判断上一条消息是不是TA发的，决定是否显示头像！
  const isFirst = (lastSenderType !== 'char')
  
  const typingRow = document.createElement('div')
  typingRow.id = `global_typing_${charId}`
  typingRow.className = `chat-row char ${isFirst ? 'first-msg' : 'not-first'}` 
  typingRow.innerHTML = `
    <div class="chat-avatar ${isFirst ? '' : 'hidden'}" style="${avatarStyle}"></div>
    <div class="chat-bubble"><div class="typing-indicator" style="margin:0;"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>
  `
  wrapper.appendChild(typingRow)
  const stream = document.getElementById('chat-stream-container')
  stream.scrollTop = stream.scrollHeight
  
  // 占位更新，防止头像错乱
  lastSenderType = 'char'
}

const cleanLeakedPrompts = (text) => {
  if (!text) return ""
  return text.replace(/【.*?】/g, '').replace(/\[外语.*?\]/g, '').replace(/\[翻译.*?\]/g, '').replace(/格式示例[:：]?/gi, '').replace(/输出要求[:：]?/gi, '').replace(/Translation[:：]?/gi, '').replace(/^-{3,}/gm, '').trim()
}

const renderBubbleInner = (bEle, textContent, quoteText = null) => {
  let finalHtml = ''
  let showCot = props.contact?.settings?.showCot
  const avatarEle = bEle.parentElement ? bEle.parentElement.querySelector('.chat-avatar') : null

  let actualText = textContent || ""
  let combinedThinkContent = ""
actualText = actualText.replace(/<think>([\s\S]*?)(?:<\/think>|$)/gi, (match, p1) => {
    combinedThinkContent += p1.trim() + "\n"; return ''
  }).trim()

  if (combinedThinkContent) {
    if (showCot && avatarEle) {
      let thinkText = encodeURIComponent(combinedThinkContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')).replace(/'/g, "%27")
      let dot = avatarEle.querySelector('.cot-dot')
      if (!dot) { dot = document.createElement('div'); dot.className = 'cot-dot'; avatarEle.appendChild(dot) }
      dot.setAttribute('onclick', `window.openThinkModal('${thinkText}')`)
    }
  } else {
    if (avatarEle) { let dot = avatarEle.querySelector('.cot-dot'); if (dot) dot.remove() }
  }

  actualText = cleanLeakedPrompts(actualText)

  if (actualText === '' && combinedThinkContent) {
    actualText = '<div class="typing-indicator" style="margin:0;"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>'
  }

  if (actualText.includes('///')) {
    let parts = actualText.split('///').map(p => p.trim())
    if (parts[0].match(/^\[STK:(?:(.*?)\|)?(.*?)\]$/) || parts[0].match(/^\[IMG:(.*?)\]$/) || parts[0].match(/^\[TXT_IMG:(.*?)\]$/) || parts[0].match(/^\[VOICE:(\d+)\|(.*?)\]$/) || parts[0].match(/^\[TRANSFER:(.*?)\|(.*?)\|(.*?)\|(pending|accepted|rejected)\]$/) || parts[0].match(/^\[MAGAZINE_SHARE:(.*?)\]$/) || parts[0].match(/^\[MAGAZINE_LOADING:(.*?)\]$/)) {
       actualText = parts[0]
    }
  }

  const voiceMatch = actualText.match(/^\[VOICE:(\d+)\|(.*?)\]$/)
  const stkMatch = actualText.match(/^\[STK:(?:(.*?)\|)?(.*?)\]$/)
  const imgMatch = actualText.match(/^\[IMG:(.*?)\]$/)
  const txtImgMatch = actualText.match(/^\[TXT_IMG:(.*?)\]$/)
  const locMatch = actualText.match(/^\[LOCATION:(.*?)\]$/)
  const transferMatch = actualText.match(/^\[TRANSFER:(.*?)\|(.*?)\|(.*?)\|(pending|accepted|rejected)\]$/)
  const magShareMatch = actualText.match(/^\[MAGAZINE_SHARE:(.*?)\]$/)
  const magLoadingMatch = actualText.match(/^\[MAGAZINE_LOADING:(.*?)\]$/)

  if (magLoadingMatch) {
    const theme = magLoadingMatch[1]
    finalHtml += `<div class="chat-time-stamp" style="margin:0; text-align:left; color:#7a94a9;"><svg viewBox="0 0 24 24" width="12" height="12" class="spin-svg-inline" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; animation: spin 1.5s linear infinite;"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg> TA 正在翻找关于「${theme}」的特刊...</div>`
    bEle.classList.add('image-only')
  } else if (magShareMatch) {
    // --- 修复功能：直接解析安全编码，去除 atob 开始 ---
    try {
      const safeEncoded = magShareMatch[1]
        const perfectlySafeEncoded = safeEncoded.replace(/'/g, "%27")
      const magJson = JSON.parse(decodeURIComponent(perfectlySafeEncoded))
      const magTitle = magJson.title
      const magAuthor = magJson.profile.name
      const magDesc = magJson.goldenQuote || "“你是我唯一想靠岸的岛屿。”"
      
// 👇 这里的 onclick 也换成 perfectlySafeEncoded
      finalHtml += `<div class="ins-card" style="cursor:pointer;" onclick="window.openMagazineReview('${perfectlySafeEncoded}')"><div class="ins-body"><div class="ins-user"><span class="avatar-icon"><svg viewBox="0 0 24 24"><path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z"/></svg></span><span class="username">心动潮周刊</span><span class="dot-sep"></span><span class="time">推荐阅读</span></div><div class="ins-title">${magTitle}<br><span class="hl">— ${magAuthor}</span></div><div class="ins-desc">${magDesc}</div><div class="ins-actions"><div class="left"><span class="action-item liked"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> 1.2k</span><span class="action-item"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg> 847</span></div><div class="right"><svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg></div></div></div></div>`
      bEle.classList.add('image-only')
    } catch(e) {
      finalHtml += `<div class="chat-time-stamp">[特刊数据已损坏，无法读取]</div>`
    }
  } else if (voiceMatch) {
    const duration = voiceMatch[1], transText = voiceMatch[2]
    const isUser = bEle.parentElement.classList.contains('user')
    const bubbleWidth = Math.min(180, 70 + (duration * 4))
    bEle.style.setProperty('--voice-width', bubbleWidth + 'px')
    bEle.classList.add('voice-bubble-wide')
    const audioWaveSvg = `<svg class="voice-icon-svg" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="9" width="3" height="6" rx="1.5"/><rect x="8" y="5" width="3" height="14" rx="1.5"/><rect x="13" y="8" width="3" height="8" rx="1.5" style="opacity:0.6;"/><rect x="18" y="10" width="3" height="4" rx="1.5" style="opacity:0.4;"/></svg>`
    const audioWaveUser = `<svg class="voice-icon-svg" style="transform: scaleX(-1);" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="9" width="3" height="6" rx="1.5"/><rect x="8" y="5" width="3" height="14" rx="1.5"/><rect x="13" y="8" width="3" height="8" rx="1.5" style="opacity:0.6;"/><rect x="18" y="10" width="3" height="4" rx="1.5" style="opacity:0.4;"/></svg>`
    let innerContent = '';
    if (isUser) innerContent = `<div class="voice-duration">${duration}"</div><div style="flex:1;"></div><div class="voice-icon">${audioWaveUser}</div>`;
    else innerContent = `<div class="voice-icon">${audioWaveSvg}</div><div style="flex:1;"></div><div class="voice-duration">${duration}"</div>`;
    finalHtml = `<div class="voice-bubble-content" onclick="this.nextElementSibling.classList.toggle('show')">${innerContent}</div><div class="voice-transcribed-text">${transText}</div>`
    bEle.classList.remove('image-only')
  } else if (stkMatch) {
    finalHtml += `<img src="${stkMatch[2]}" style="width:80px; height:80px; object-fit:contain; border-radius:8px; display:block;">`
    bEle.classList.add('image-only')
  } else if (imgMatch) {
    finalHtml += `<img src="${imgMatch[1]}" style="max-width:160px; max-height:220px; object-fit:cover; border-radius:12px; display:block;">`
    bEle.classList.add('image-only')
  } else if (txtImgMatch) {
    const safeDesc = encodeURIComponent(txtImgMatch[1]).replace(/'/g, "%27")
    finalHtml += `<img src="https://i.postimg.cc/ydMQDRPg/1784576043470.png" style="max-width:160px; max-height:220px; object-fit:cover; border-radius:12px; display:block; cursor:pointer;" onclick="window.openTxtImgViewModal('${safeDesc}')">`
    bEle.classList.add('image-only')
  } else if (locMatch) {
    const locName = locMatch[1]
    finalHtml += `
      <div class="location-card">
        <div class="loc-map-bg"><div class="loc-cloud cloud-1"></div><div class="loc-cloud cloud-2"></div><div class="loc-route"></div>
          <div class="loc-pin"><svg viewBox="0 0 24 24" width="26" height="26" fill="#38bdf8" stroke="#fff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg><div class="loc-pin-shadow"></div></div>
        </div>
        <div class="loc-banner"><div class="loc-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#7a94a9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div><div class="loc-text">${locName}</div></div>
      </div>
    `
    bEle.classList.add('image-only')
  } else if (transferMatch) {
    const tId = transferMatch[1]
    const tAmt = transferMatch[2]
    const tNote = transferMatch[3]
    const tStatus = transferMatch[4]
    const isUser = bEle.parentElement.classList.contains('user')
    
    let statusHtml = ''
    if (tStatus === 'pending') {
        statusHtml = `<span class="tc-status-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>等待收款</span>`
    } else if (tStatus === 'accepted') {
        statusHtml = `<span class="tc-status-badge"><svg viewBox="0 0 24 24" fill="none"><path d="M20 12L9 19L4 14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>已收款</span>`
    } else {
        statusHtml = `<span class="tc-status-badge rejected"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>已退回</span>`
    }
    const recipientName = isUser ? (props.contact?.settings?.remark || props.contact?.name || 'TA') : '我'
    
    finalHtml += `<div class="transfer-card" onclick="window.handleTransferClick('${tId}', '${isUser ? 'user' : 'char'}', '${tStatus}')"><div class="tc-header"><div class="tc-info"><span class="tc-label">转账给</span><span class="tc-name">${recipientName}</span></div><div class="tc-amount-sec"><div class="tc-amount-label">金额</div><div class="tc-amount-num"><span class="tc-currency">¥</span>${tAmt}</div><div class="tc-status-row">${statusHtml}</div></div></div><div class="tc-footer"><div class="tc-note-area"><span class="tc-note-text">${tNote}</span></div></div></div>`
    bEle.classList.add('image-only')
  } else {
    bEle.classList.remove('image-only')
    if (quoteText) finalHtml += `<div class="reply-quote-box">${quoteText}</div>`
    if (actualText.includes('///')) {
      let parts = actualText.split('///').map(p => p.trim())
      let original = parts[0].replace(/[\r\n]+/g, ' ').trim(), translation = (parts[1] || '').replace(/[\r\n]+/g, ' ').trim()
      if (!original && translation) finalHtml += translation
      else if (original && !translation) finalHtml += original
      else if (original && translation) finalHtml += `${original}\n<span style="font-size:11.5px; color:#7a94a9;">${translation}</span>`
    } else {
      let mixedText = actualText.replace(/\[STK:(?:(.*?)\|)?(.*?)\]/g, '<img class="inline-sticker" src="$2" style="width:80px; height:80px; object-fit:contain; vertical-align:middle;">')
      mixedText = mixedText.replace(/\[IMG:(.*?)\]/g, '<br><img src="$1" style="max-width:160px; max-height:220px; object-fit:cover; border-radius:12px; display:block; margin-top:4px;">')
      mixedText = mixedText.replace(/\[TXT_IMG:(.*?)\]/g, (m, desc) => `<br><img src="https://i.postimg.cc/ydMQDRPg/1784576043470.png" style="max-width:160px; max-height:220px; object-fit:cover; border-radius:12px; display:block; margin-top:4px; cursor:pointer;" onclick="window.openTxtImgViewModal('${encodeURIComponent(desc).replace(/'/g, "%27")}')">`)
      finalHtml += mixedText
    }
  }
  bEle.innerHTML = finalHtml
}

// ==========================================
// 改造版：屏蔽通话记录的渲染引擎 (含拒接通知与已读状态)
// ==========================================
const renderMessagesChunk = (count, maintainScroll = false) => {
  const stream = document.getElementById('chat-stream-container')
  const wrapper = document.getElementById('chat-messages-wrapper')
  const loadMoreBtn = document.getElementById('load-more-btn')
  const oldScrollHeight = stream.scrollHeight
  const oldScrollTop = stream.scrollTop
  
  wrapper.innerHTML = ''
  lastSenderType = null
  
  const renderList = currentChatHistory.value.slice(-count)
  if (currentChatHistory.value.length === 0) {
    wrapper.innerHTML = `<div class="chat-time-stamp">和 ${props.contact?.name} 开启甜蜜对话吧</div>`
  } else {
    renderList.forEach(msg => {

    // 🚨 【转账独家新增】：如果是打上了 [HIDDEN] 标签的隐形记忆，绝对不画到屏幕上！
      if (msg.text && msg.text.includes('[HIDDEN]')) return

      // 🚨 核心拦截：如果这条消息带有通话ID，说明是通话弹幕，绝对不画出普通气泡！
      if (msg.callId && msg.sender !== 'system-call' && msg.sender !== 'system-video-call') return

      // 系统邮件 / 语音通话结算 / 视频通话结算 / 拒接通知卡片
      if (msg.sender === 'system-mail' || msg.sender === 'system-call' || msg.sender === 'system-video-call' || msg.sender === 'system-notice') {
        const row = document.createElement('div')
        row.style.width = "100%"
        
        if (msg.sender === 'system-mail') {
          // 💌 邮件卡片 (带上邮件 ID 以便精准打开详情)
          const showTitle = msg.boxType === 'drafts' ? 'TA 刚悄悄存了一份草稿' : '您有一封新信件'
          
          // 极简微型的信封 SVG
          const mailSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#7a94a9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><polyline points="3 7 12 13 21 7"></polyline></svg>`
          
          // 🌟 注意这里：onclick 里面把这封邮件的唯一 ID 传了出去！
          const mailId = msg.id || msg.time;
          
          row.innerHTML = `
            <div style="width: 100%; display: flex; justify-content: center;">
              <div class="mail-alert-pill" onclick="window.openMailApp('${mailId}')">
                <div class="mail-pill-icon">${mailSvg}</div>
                <div class="mail-pill-content">
                  <span class="mail-pill-title">${showTitle}</span>
                </div>
                <div class="mail-pill-arrow">›</div>
              </div>
            </div>
          `
        } else if (msg.sender === 'system-video-call') {
          // 🎥 视频通话结束卡片
          row.innerHTML = `
            <div style="width: 100%; text-align: center; margin: 15px 0; font-size: 12px; display: flex; justify-content: center; align-items: center; gap: 8px;">
              <span style="color: #999;">视频通话时长 ${msg.text}</span>
              <span style="color: #7a94a9; cursor: pointer; font-weight: bold;" onclick="window.openCallHistoryModal('${msg.callId}')">查看视频记录</span>
            </div>
          `
        } else if (msg.sender === 'system-notice') {
          // 🔕 拒接等隐形系统通知，渲染成极简的时间戳小灰字
          row.innerHTML = `<div class="chat-time-stamp">${msg.text}</div>`
        } else {
          // 📞 语音通话结束卡片
          row.innerHTML = `
            <div style="width: 100%; text-align: center; margin: 15px 0; font-size: 12px; display: flex; justify-content: center; align-items: center; gap: 8px;">
              <span style="color: #999;">通话时长 ${msg.text}</span>
              <span style="color: #7a94a9; cursor: pointer; font-weight: bold;" onclick="window.openCallHistoryModal('${msg.callId}')">查看通话记录</span>
            </div>
          `
        }
        
        wrapper.appendChild(row)
        lastSenderType = 'system'
        return
      }

      const isFirst = (lastSenderType !== msg.sender)
      const avatarUrl = msg.sender === 'user' ? userAvatarUrl.value : props.contact.avatar
      const avatarStyle = avatarUrl ? `background: url(${avatarUrl}) center/cover` : 'background: #999'
      
      const row = document.createElement('div')
      row.className = `chat-row ${msg.sender} ${isFirst ? 'first-msg' : 'not-first'}`
      row.dataset.msgId = msg.id || msg.time
      const checkboxHtml = `<div class="msg-checkbox" onclick="window.toggleMsgCheck(this, '${msg.id || msg.time}')"></div>`
      
      // 检查是否开启了已读不回功能
      const st = props.contact?.settings || {}
      const showReadStatus = !!st.ignoreMsg

      // 准备 User 专属的状态小尾巴 HTML
      let statusHtml = ''
      if (showReadStatus && msg.sender === 'user') {
        const statusText = msg.isRead ? '已读' : '未读'
        const statusClass = msg.isRead ? 'read-status-read' : 'read-status-unread'
        statusHtml = `<div class="msg-read-status ${statusClass}">${statusText}</div>`
      }

 if (msg.sender === 'user') {
        // 【新增】：User气泡左边加红感叹号
        let errorHtml = ''
        if (msg.isRejected) {
          errorHtml = `<div class="msg-error-icon" style="margin-right: 6px; align-self: center; display: flex; align-items: center;"><svg viewBox="0 0 24 24" width="18" height="18" fill="#ff3b30"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4m0 4h.01" stroke="#fff" stroke-width="2" stroke-linecap="round"></path></svg></div>`
        }
        row.innerHTML = `${checkboxHtml}${statusHtml}${errorHtml}<div class="chat-bubble"></div><div class="chat-avatar ${isFirst ? '' : 'hidden'}" style="${avatarStyle}"></div>`
      } else {
        let errorHtml = ''
        if (msg.isBlocked) {
          errorHtml = `<div class="msg-error-icon" style="margin-left: 6px; align-self: center; display: flex; align-items: center;"><svg viewBox="0 0 24 24" width="18" height="18" fill="#ff3b30"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4m0 4h.01" stroke="#fff" stroke-width="2" stroke-linecap="round"></path></svg></div>`
        }
        row.innerHTML = `${checkboxHtml}<div class="chat-avatar ${isFirst ? '' : 'hidden'}" style="${avatarStyle}"></div><div class="chat-bubble"></div>${errorHtml}`
      }
      
      const bEle = row.querySelector('.chat-bubble')
      renderBubbleInner(bEle, msg.text, msg.quoteText)

      let touchStartX = 0, touchStartY = 0, pressTimer = null, isSwiping = false
      const handlePress = (e) => {
        let cx = e.touches ? e.touches[0].clientX : e.clientX
        let cy = e.touches ? e.touches[0].clientY : e.clientY
        openBubbleMenu(msg, cx, cy)
      }
      bEle.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; isSwiping = false; bEle.style.transition = 'none'
        pressTimer = setTimeout(() => handlePress(e), 600)
      }, {passive: true})
      bEle.addEventListener('touchmove', (e) => {
        let mx = e.touches[0].clientX - touchStartX, my = Math.abs(e.touches[0].clientY - touchStartY)
        if (my > 10) clearTimeout(pressTimer)
        if (mx < -10 && my < 20) { clearTimeout(pressTimer); isSwiping = true; bEle.style.transform = `translateX(${Math.max(mx, -60)}px)` }
      }, {passive: true})
      bEle.addEventListener('touchend', (e) => {
        clearTimeout(pressTimer); bEle.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'; bEle.style.transform = 'translateX(0)'
        if (isSwiping && (touchStartX - e.changedTouches[0].clientX > 40)) { if (navigator.vibrate) navigator.vibrate(50); startQuote(msg) }
      })
      bEle.addEventListener('mousedown', (e) => { pressTimer = setTimeout(() => handlePress(e), 600) })
      bEle.addEventListener('mouseup', () => clearTimeout(pressTimer))
      bEle.addEventListener('mouseleave', () => clearTimeout(pressTimer))

      wrapper.appendChild(row)
      lastSenderType = msg.sender

      // 【新增】：被拒收后的灰字提示，附带解封倒计时！
      if (msg.sender === 'user' && msg.isRejected) {
        const rejectRow = document.createElement('div')
        rejectRow.className = 'chat-time-stamp'
        let tStr = '消息已发出，但被对方拒收了'
        // 动态计算预计还有多少分钟解封
        if (st.blacklistedUntil && Date.now() < st.blacklistedUntil) {
          const min = Math.ceil((st.blacklistedUntil - Date.now()) / 60000)
          tStr += ` (预计 ${min} 分钟后解封)`
        }
        rejectRow.innerText = tStr
        wrapper.appendChild(rejectRow)
      }
    })
  }
  
  if (count >= currentChatHistory.value.length && currentChatHistory.value.length > 0) {
    loadMoreBtn.style.display = 'none'
    if (!document.getElementById('no-more-msg')) {
      const noMore = document.createElement('div')
      noMore.id = 'no-more-msg'; noMore.className = 'chat-time-stamp'; noMore.innerText = '—— 已经到最顶端啦 ——'
      wrapper.prepend(noMore)
    }
  } else if (currentChatHistory.value.length > 0) {
    loadMoreBtn.style.display = 'block'
  }
  
  if (maintainScroll) stream.scrollTop = oldScrollTop + (stream.scrollHeight - oldScrollHeight)
  else setTimeout(() => { stream.scrollTop = stream.scrollHeight }, 50)
}

// ==========================================
// 终极修复版：带通话专属印章的底层保存引擎
// ==========================================
const saveMessageToDB = async (sender, text, isUpdateOnly = false, callId = null, isRejected = false) => {
  if (!props.contact) return
  const charId = props.contact.id
  let msgId = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
  
  let newMsg = { id: msgId, sender: sender, text: text, time: Date.now() }

    
  // 【新增】：User 发出的消息，默认标记为未读 (isRead: false)
  if (sender === 'user') {
    newMsg.isRead = false
  }
  
 // 【新增】：打上小黑屋的拒收印章
  if (isRejected) {
    newMsg.isRejected = true
  }

  // 【修复核心】：把通话专属印章盖上！有了它就不会漏到外面的聊天室了！
  if (callId) {
    newMsg.callId = callId 
  }
  
  if (currentQuoteMsg.value && !callId) {
    newMsg.quoteText = currentQuoteMsg.value.text.replace(/\[STK:.*?\]/g, '[图片/表情]')
    cancelQuote()
  }
  
  const db = await initDB()
  const tx = db.transaction(['chat_history_db'], 'readwrite')
  const store = tx.objectStore('chat_history_db')
  const data = await new Promise(res => store.get(charId).onsuccess = e => res(e.target.result)) || { charId, messages: [] }
  
  data.messages.push(newMsg)
  await new Promise((res, rej) => { store.put(data).onsuccess = res; tx.onerror = rej })
  
  currentChatHistory.value = data.messages
  currentLoadedCount.value = Math.min(data.messages.length, currentLoadedCount.value + 1)
  
  // 只有非通话模式，才去外面弹气泡
  if (!isUpdateOnly && !callId) {
    renderMessagesChunk(currentLoadedCount.value, false)
  }

  // --- 新增功能：埋下计数雷管，触发静默总结 开始 ---
  // 不统计系统消息，只统计你们两人的对话
  if (sender === 'user' || sender === 'char') {
    try {
      const mTx = db.transaction(['memory_db'], 'readwrite')
      const mStore = mTx.objectStore('memory_db')
      let memData = await new Promise(res => mStore.get(charId).onsuccess = e => res(e.target.result))
      
      // 1. 终极防空指针保护：如果没有数据或没有 narrative，强制初始化
      if (!memData) memData = { charId, narrative: { short: [], long: [], unsummarizedMsgCount: 0 }, profile: [], settings: {} }
      if (!memData.narrative) memData.narrative = { short: [], long: [], unsummarizedMsgCount: 0 }
      
      // 2. 核心修复：如果是旧数据没有这个计数器，或者变成了 NaN，强制归零！
      if (typeof memData.narrative.unsummarizedMsgCount !== 'number' || isNaN(memData.narrative.unsummarizedMsgCount)) {
        memData.narrative.unsummarizedMsgCount = 0
      }
      
      // 3. 安全+1
      memData.narrative.unsummarizedMsgCount += 1
      
      const st = memData.settings || {}
      // 测试期间，你可以把这里的 50 改成 3 或者 5，这样发几句话就会触发一次测试！
      const shortInterval = parseInt(st.shortSummaryInterval) || 50
      
      await new Promise((res, rej) => { 
        const putReq = mStore.put(memData)
        putReq.onsuccess = res
        putReq.onerror = rej
      })
      
      // 如果达到了小结间隔数字，悄悄引爆引擎
      if (memData.narrative.unsummarizedMsgCount >= shortInterval) {
        setTimeout(() => triggerAutoSummary(charId), 1000) // 延迟1秒丢进后台，不卡顿前台渲染
      }
    } catch(err) {
      console.error("记忆库计数器报错:", err)
    }
  }
  // --- 结束 ---

}


// ==========================================
// 🎞️ 视频通话 2.0 状态与底层验证逻辑
// ==========================================
const isVideoScreenOpen = ref(false)
const isVideoSetupOpen = ref(false)
const isVideoPrivacyOpen = ref(false)
const videoCallDurationText = ref('00:00')
const currentVideoCallId = ref(null)
let videoCallTimerInterval = null


const videoSetupInputChar = ref('') // 原版单独立绘（兜底用）
const videoSetupInputBg = ref('')

// 【新增】：视频通话高阶配置变量
const useEmotionAvatar = ref(false)
const emotionAvatars = ref({ default: '', happy: '', angry: '', sad: '', shy: '' })
const useAvatarTransform = ref(false)
const avatarTransform = ref({ scale: 100, x: 0, y: 0 })

const currentVideoCharImg = ref('')
const currentVideoBgImg = ref('')

const videoCameraMode = ref('avatar') 
const hasAgreedVideoPrivacy = ref(false) 
const videoSubtitles = ref([]) 
const isVideoInputOpen = ref(false)
const videoInputText = ref('')
const isVideoAiSpeaking = ref(false)
let videoMediaStream = null




// 入口：触发视频通话逻辑，读取配置
const triggerVideoCall = async () => {
  closeAllDrawers()
  if (!props.contact) return
  
  const privacyAgree = await getSettingValue('video_privacy_agreed')
  if (privacyAgree) hasAgreedVideoPrivacy.value = true

  const db = await initDB()
  const charReq = await new Promise(res => db.transaction(['contacts_profiles'], 'readonly').objectStore('contacts_profiles').get(props.contact.id).onsuccess = e => res(e.target.result))
  
  const st = charReq?.settings || {}
  
  if (!st.videoAvatar && (!st.emotionAvatars || !st.emotionAvatars.default)) {
    // 第一次进入：没有默认立绘，打开弹窗
    videoSetupInputChar.value = ''
    videoSetupInputBg.value = st.videoBg || ''
    useEmotionAvatar.value = st.useEmotionAvatar || false
    emotionAvatars.value = st.emotionAvatars || { default: '', happy: '', angry: '', sad: '', shy: '' }
    useAvatarTransform.value = st.useAvatarTransform || false
    avatarTransform.value = st.avatarTransform || { scale: 100, x: 0, y: 0 }
    
    isVideoSetupOpen.value = true
  } else {
    // 已配置过：直接读取所有状态进入界面
    useEmotionAvatar.value = st.useEmotionAvatar || false
    emotionAvatars.value = st.emotionAvatars || { default: '', happy: '', angry: '', sad: '', shy: '' }
    useAvatarTransform.value = st.useAvatarTransform || false
    avatarTransform.value = st.avatarTransform || { scale: 100, x: 0, y: 0 }
    
    // 初始显示：如果开了情绪就用情绪的默认，否则用单立绘
    currentVideoCharImg.value = useEmotionAvatar.value ? (emotionAvatars.value.default || st.videoAvatar) : st.videoAvatar
    currentVideoBgImg.value = st.videoBg || ''
    
    enterVideoCallScreen()
  }
}

// 视频通话：处理本地相册上传 (加入情绪参数支持)
const handleVideoLocalUpload = (type, emotionKey = null) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      if (type === 'char') {
        videoSetupInputChar.value = evt.target.result
      } else if (type === 'bg') {
        videoSetupInputBg.value = evt.target.result
      } else if (type === 'emotion' && emotionKey) {
        emotionAvatars.value[emotionKey] = evt.target.result
      }
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

const openVideoSetupFromCall = () => {
  // 从视频界面点右上角设置按钮，实时读取当前数据用于重设
  const st = props.contact?.settings || {}
  videoSetupInputChar.value = st.videoAvatar || ''
  videoSetupInputBg.value = st.videoBg || ''
  useEmotionAvatar.value = st.useEmotionAvatar || false
  emotionAvatars.value = st.emotionAvatars || { default: '', happy: '', angry: '', sad: '', shy: '' }
  useAvatarTransform.value = st.useAvatarTransform || false
  avatarTransform.value = st.avatarTransform || { scale: 100, x: 0, y: 0 }
  
  isVideoSetupOpen.value = true
}

const closeVideoSetup = () => {
  isVideoSetupOpen.value = false
}

// 保存配置到底层数据库
const saveVideoSetup = async () => {
  // 必须保证有一个能显示的图
  if (!useEmotionAvatar.value && !videoSetupInputChar.value.trim()) {
    return alert("请提供一张基础立绘哦~")
  }
  if (useEmotionAvatar.value && !emotionAvatars.value.default.trim() && !videoSetupInputChar.value.trim()) {
    return alert("开启情绪立绘后，至少要上传一张[默认]立绘兜底哦~")
  }

  const db = await initDB()
  const tx = db.transaction(['contacts_profiles'], 'readwrite')
  const store = tx.objectStore('contacts_profiles')
  const charReq = await new Promise(res => store.get(props.contact.id).onsuccess = e => res(e.target.result))
  
  if (charReq) {
    if (!charReq.settings) charReq.settings = {}
    charReq.settings.videoAvatar = videoSetupInputChar.value.trim()
    charReq.settings.videoBg = videoSetupInputBg.value.trim()
    charReq.settings.useEmotionAvatar = useEmotionAvatar.value
    charReq.settings.emotionAvatars = JSON.parse(JSON.stringify(emotionAvatars.value))
    charReq.settings.useAvatarTransform = useAvatarTransform.value
    charReq.settings.avatarTransform = JSON.parse(JSON.stringify(avatarTransform.value))
    
    await new Promise((res, rej) => { store.put(charReq).onsuccess = res; tx.onerror = rej })
    
    if (props.contact.settings) {
      props.contact.settings = charReq.settings
    }
  }
  isVideoSetupOpen.value = false
  
  // 刷新背景图
  currentVideoBgImg.value = videoSetupInputBg.value.trim()
  
  // 【核心修复】：判断是否在通话中
  if (!isVideoScreenOpen.value) {
    // 还没进通话：初始化为默认脸，并进入全息屏
    currentVideoCharImg.value = useEmotionAvatar.value ? (emotionAvatars.value.default || videoSetupInputChar.value) : videoSetupInputChar.value.trim()
    enterVideoCallScreen()
  } else {
    // 已经在通话中调整机位：绝对不打断 AI 刚才设定的情绪脸！
    // 只有当用户强制关掉“情绪立绘”开关时，才切回单一立绘
    if (!useEmotionAvatar.value) {
      currentVideoCharImg.value = videoSetupInputChar.value.trim()
    }
  }
}




// 正式开启视频界面
const enterVideoCallScreen = () => {
  isVideoScreenOpen.value = true
  videoCameraMode.value = 'avatar'
  videoSubtitles.value = []
  isVideoInputOpen.value = false
  videoInputText.value = ''
  
  // 生成独立通话 ID 并开启秒表
  currentVideoCallId.value = 'vcall_' + Date.now()
  videoCallDurationText.value = '00:00'
  const startT = Date.now()
  if (videoCallTimerInterval) clearInterval(videoCallTimerInterval)
  videoCallTimerInterval = setInterval(() => {
    const diff = Math.floor((Date.now() - startT) / 1000)
    const m = String(Math.floor(diff / 60)).padStart(2, '0')
    const s = String(diff % 60).padStart(2, '0')
    videoCallDurationText.value = `${m}:${s}`
  }, 1000)

  if (videoMediaStream) {
    videoMediaStream.getTracks().forEach(track => track.stop())
    videoMediaStream = null
  }
}

// 隐私弹窗操作
const cancelVideoPrivacy = () => {
  isVideoPrivacyOpen.value = false
}

const confirmVideoPrivacy = async () => {
  isVideoPrivacyOpen.value = false
  hasAgreedVideoPrivacy.value = true
  await saveSettingData('video_privacy_agreed', true)
  // 同意后，立刻去执行被拦截的摄像头切换逻辑
  executeCameraSwitch()
}



// ==========================================
// 🎞️ 视频通话 2.0 界面交互壳子
// ==========================================
const isVideoLogOpen = ref(false)



// ==========================================
// 🎞️ 视频通话 2.0 核心引擎与视觉识别 (终极替换)
// ==========================================

// 1. 真实摄像头调用与三段切换引擎
const toggleVideoCamera = () => {
  if (!hasAgreedVideoPrivacy.value) {
    isVideoPrivacyOpen.value = true
    return
  }
  executeCameraSwitch()
}

const executeCameraSwitch = async () => {
  if (videoMediaStream) {
    videoMediaStream.getTracks().forEach(track => track.stop())
    videoMediaStream = null
  }
  
  // 状态轮转: avatar -> user(前置) -> environment(后置) -> avatar
  if (videoCameraMode.value === 'avatar') {
    videoCameraMode.value = 'user'
  } else if (videoCameraMode.value === 'user') {
    videoCameraMode.value = 'environment'
  } else {
    videoCameraMode.value = 'avatar'
    return
  }

  try {
    videoMediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: videoCameraMode.value } 
    })
    const videoEle = document.getElementById('video-local-video')
    if (videoEle) {
      videoEle.srcObject = videoMediaStream
      // 前置摄像头镜像翻转，后置不翻转，非常真实！
      videoEle.style.transform = videoCameraMode.value === 'user' ? 'scaleX(-1)' : 'scaleX(1)'
    }
  } catch (err) {
    videoSubtitles.value.push({ sender: 'char', text: `[ 提示：获取摄像头权限失败，已切回头像模式 ]` })
    videoCameraMode.value = 'avatar'
  }
}

// 2. 秘密截帧引擎：为大模型准备 Base64 画面
const captureVideoSnapshot = () => {
  if (videoCameraMode.value === 'avatar' || !videoMediaStream) return null
  const videoEle = document.getElementById('video-local-video')
  if (!videoEle || videoEle.videoWidth === 0) return null
  
  const canvas = document.createElement('canvas')
  // 压缩分辨率，防止发给 AI 的体积太大导致报错
  canvas.width = 512
  canvas.height = (videoEle.videoHeight / videoEle.videoWidth) * 512
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoEle, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.7)
}



// 4. User 麦克风识别引擎 (合二为一：识别内容填入输入框)
let videoRecognition = null
const isVideoRecognizing = ref(false)
const toggleVideoSpeech = () => {
  if (!videoRecognition) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return alert("当前浏览器不支持语音识别哦~")
    videoRecognition = new SR()
    videoRecognition.lang = 'zh-CN'
    videoRecognition.interimResults = true
    videoRecognition.continuous = true
    
    let baseTxt = ""
    videoRecognition.onstart = () => { 
      isVideoRecognizing.value = true
      baseTxt = videoInputText.value 
    }
    videoRecognition.onresult = (e) => {
      let f = "", i = ""
      for (let j = e.resultIndex; j < e.results.length; ++j) {
        if (e.results[j].isFinal) f += e.results[j][0].transcript
        else i += e.results[j][0].transcript
      }
      // 直接填入输入框，User 随时可以手改
      videoInputText.value = baseTxt + f + i
    }
    videoRecognition.onend = () => { isVideoRecognizing.value = false }
    videoRecognition.onerror = () => { isVideoRecognizing.value = false }
  }
  
  if (isVideoRecognizing.value) videoRecognition.stop()
  else videoRecognition.start()
}
const sendVideoMessage = async () => {
  const text = videoInputText.value.trim()
  if (!text) return
  videoSubtitles.value.push({ sender: 'user', text })
  await saveMessageToDB('user', text, true, currentVideoCallId.value) 
  
  // 【核心修改】：发送后只清空文字，不折叠面板，实现无限连发！
  videoInputText.value = ''
}
const hangUpVideoCall = async () => {
  if (videoCallTimerInterval) clearInterval(videoCallTimerInterval)
  if (videoMediaStream) {
    videoMediaStream.getTracks().forEach(track => track.stop())
    videoMediaStream = null
  }
  isVideoScreenOpen.value = false
  
  if (currentVideoCallId.value) {
    const finalDuration = videoCallDurationText.value
    await saveMessageToDB('system-video-call', finalDuration, false, currentVideoCallId.value)
    setTimeout(() => { renderMessagesChunk(currentLoadedCount.value, false) }, 100)
  }
}
// ==========================================
// 🎞️ 橙光打字机互动引擎变量
// ==========================================
const vnDisplayState = ref({ text: '', isTyping: false, isWaiting: false, isActive: false })
let vnSkipTyping = false
let vnResolveNext = null

// 用户点击对话框的交互逻辑
const handleVnBoxClick = () => {
  if (!vnDisplayState.value.isActive) return
  if (vnDisplayState.value.isTyping) {
    // 状态A：正在打字 -> 点击瞬间跳过打字，全量显示
    vnSkipTyping = true
  } else if (vnDisplayState.value.isWaiting && vnResolveNext) {
    // 状态B：打完了，等待翻页 -> 点击切入下一句
    vnDisplayState.value.isWaiting = false
    vnResolveNext()
  }
}



const triggerVideoAIReply = async () => {
  isVideoInputOpen.value = false
  if (isVideoAiSpeaking.value || !props.contact) return
  isVideoAiSpeaking.value = true
  
  const base64Img = captureVideoSnapshot()
  videoSubtitles.value.push({ sender: 'char', isTyping: true, text: '' })
  const subIndex = videoSubtitles.value.length - 1
  
  let aggregatedUserText = ""
  for (let i = currentChatHistory.value.length - 1; i >= 0; i--) {
    if (currentChatHistory.value[i].sender === 'char') break
    if (currentChatHistory.value[i].sender === 'user') aggregatedUserText = currentChatHistory.value[i].text + "\n" + aggregatedUserText
  }
  let systemPrompt = await buildSystemPrompt(props.contact, aggregatedUserText)
  
  systemPrompt += `\n\n【最高视频通话输出规范（生死红线）】
你现在正处于“沉浸式视频通话”中！为了系统能正确解析你的回复和表情，你必须、且只能严格按照以下格式进行输出：

【表情】在这里写你当前的情绪，只能从这5个词中选1个填入：默认、开心、生气、悲伤、害羞
<reply>在这里写你真正说出口的短句1|||在这里写短句2|||短句3</reply>

【绝对正确的格式示例】：
【表情】悲伤
<reply>怎么啦？看起来没精神呢。|||今天是不是很辛苦呀？|||快去休息一下吧。</reply>

【最后警告】：
1. 必须在台词前严格输出【表情】标签！
2. 台词必须且只能用 "|||" 符号来切分！绝对不许带 1.2.3. 序号和动作括号！`

  if (base64Img) {
    systemPrompt += `\n\n【视觉感知激活】：User已开启真实摄像头，并附带了一张实时画面。请结合你看到的画面，以真实的语气做出反应！`
  }

  const charId = props.contact.id
  const st = props.contact.settings || {}

  try {
    const db = await initDB()
    const allApis = await new Promise(res => db.transaction(['api_profiles'], 'readonly').objectStore('api_profiles').getAll().onsuccess = e => res(e.target.result || []))
    let api = allApis.find(a => a.id === st.apiId) || allApis[0]
    if (!api) throw new Error("未配置API，通讯中断...")

    let memNum = st.memoryNum !== undefined ? st.memoryNum : 20
    let historyForApi = memNum > 0 ? currentChatHistory.value.slice(-memNum).map(msg => ({ 
      role: msg.sender === 'user' ? 'user' : 'assistant', 
      content: msg.text 
    })) : []

    if (base64Img) {
      let lastUser = historyForApi.findLast(m => m.role === 'user')
      if (lastUser) {
        lastUser.content = [
          { type: "text", text: lastUser.content || "你看得见我吗？" },
          { type: "image_url", image_url: { url: base64Img } }
        ]
      } else {
        historyForApi.push({
          role: "user",
          content: [
            { type: "text", text: "能看清这边的画面吗？" },
            { type: "image_url", image_url: { url: base64Img } }
          ]
        })
      }
    }

    const payload = { 
      model: api.model, 
      messages: [ { role: "system", content: systemPrompt }, ...historyForApi ], 
      temperature: parseFloat(api.temperature) || 0.7, 
      stream: !!api.isStream 
    }
    
    const fetchUrl = api.url.replace(/\/+$/, '') + '/chat/completions'
    const response = await fetch(fetchUrl, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` }, 
      body: JSON.stringify(payload) 
    })

    if (!response.ok) throw new Error(`通讯信号不稳定 (${response.status})`)

    let rawBuffer = ""
    if (payload.stream) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let streamBuffer = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        streamBuffer += decoder.decode(value, { stream: true })
        const lines = streamBuffer.split('\n')
        streamBuffer = lines.pop()
        for (let line of lines) {
          if (line.trim().startsWith('data:')) {
            let jsonStr = line.substring(5).trim()
            if (jsonStr === '[DONE]' || !jsonStr) continue
            try {
              const delta = JSON.parse(jsonStr).choices[0]?.delta
              if (delta && delta.reasoning_content) rawBuffer += delta.reasoning_content
              else if (delta && delta.content) rawBuffer += delta.content
            } catch(e) {}
          }
        }
      }
    } else {
      const resData = await response.json()
      const choice = resData.choices[0]
      rawBuffer = (choice.message.reasoning_content || "") + (choice.message.content || "")
    }

    // ==========================================
    // 【新增调试输出】：在控制台打印视频通话的 AI 原话！
    // ==========================================
    console.log(`\n\n========== 【视频通话 AI 原始回复 (${props.contact.name})】 ==========`);
    console.log(rawBuffer);
    console.log(`============================================================\n\n`);

    if (useEmotionAvatar.value) {
      const emotionMatch = rawBuffer.match(/【表情】(默认|开心|生气|悲伤|害羞)/)
      if (emotionMatch) {
        const emoStr = emotionMatch[1]
        const emoMap = { '默认': 'default', '开心': 'happy', '生气': 'angry', '悲伤': 'sad', '害羞': 'shy' }
        const targetKey = emoMap[emoStr]
        if (targetKey && emotionAvatars.value[targetKey]) {
          currentVideoCharImg.value = emotionAvatars.value[targetKey]
        } else if (emotionAvatars.value.default) {
          currentVideoCharImg.value = emotionAvatars.value.default
        }
      }
    }

    // ==========================================
    // 👇 终极防弹衣：视频通话解析 👇
    // ==========================================
    let cleanText = rawBuffer.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim()
    
    const replyMatch = cleanText.match(/<reply>([\s\S]*?)(?:<\/reply>|$)/i);
    if (replyMatch) cleanText = replyMatch[1].trim();

    cleanText = cleanText.replace(/【表情】(默认|开心|生气|悲伤|害羞)/g, '').trim();
    cleanText = cleanText.replace(/[\(（\*].*?[\)）\*]/g, '').trim(); 
    cleanText = cleanText.replace(/^\s*\d+[\.、]\s*/gm, '').trim();

    let sentences = cleanText.split('|||').map(s => s.trim()).filter(s => s);
    if (sentences.length === 0) sentences.push("...");
    // ==========================================

    const fullLogText = sentences.join(' ')
    const targetSub = videoSubtitles.value[subIndex]
    targetSub.isTyping = false
    targetSub.text = fullLogText 

    vnDisplayState.value.isActive = true

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      vnDisplayState.value.text = ""
      vnDisplayState.value.isTyping = true
      vnDisplayState.value.isWaiting = false
      vnSkipTyping = false

      for (let char of sentence) {
        if (vnSkipTyping) {
          vnDisplayState.value.text = sentence
          break 
        }
        vnDisplayState.value.text += char
        await new Promise(r => setTimeout(r, 20 + Math.random() * 30))
      }

      vnDisplayState.value.isTyping = false

      if (i < sentences.length - 1) {
        vnDisplayState.value.isWaiting = true
        await new Promise(r => { vnResolveNext = r })
      } else {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    targetSub.showText = sentences[sentences.length - 1]
    vnDisplayState.value.isActive = false
    
    await nextTick()
    const textBox = document.querySelector('.vn-text-content')
    if (textBox) textBox.scrollTop = textBox.scrollHeight

    await saveMessageToDB('char', fullLogText, true, currentVideoCallId.value)

  } catch (err) {
    const targetSub = videoSubtitles.value[subIndex]
    targetSub.isTyping = false
    targetSub.text = `[ 系统：${err.message} ]`
  }
  
  isVideoAiSpeaking.value = false
}


// ==========================================
// 📞 AI 主动来电引擎
// ==========================================
const incomingCallType = ref(null) // 'voice' | 'video' | null

const acceptIncomingCall = () => {
  const type = incomingCallType.value
  incomingCallType.value = null // 收起横幅
  if (type === 'voice') triggerVoiceCall()
  else if (type === 'video') triggerVideoCall()
}

const rejectIncomingCall = async () => {
  const typeStr = incomingCallType.value === 'video' ? '视频' : '语音'
  incomingCallType.value = null // 收起横幅
  
  // 悄悄存入一条拒接系统提示，打上 system-notice 标签
  await saveMessageToDB('system-notice', `[你拒接了TA的${typeStr}通话请求]`, false)
}


// ==========================================
// 🎙️ 通话系统底层引擎
// ==========================================
const isCallScreenOpen = ref(false)
const callStatusText = ref('等待接听...')
const isCallInputOpen = ref(false)
const callInputText = ref('')
const callSubtitles = ref([])
const isCallAiSpeaking = ref(false)
const currentCallId = ref(null)
const callStartTime = ref(0)
let callTimerInterval = null

// 摄像头引擎
const cameraMode = ref('avatar') // 'avatar' | 'environment' | 'user'
let mediaStream = null

// 通话记录查看引擎
const isCallHistoryOpen = ref(false)
const callHistoryLogs = ref([])

onMounted(() => {
  window.openCallHistoryModal = (callId) => {
    // 统一大一统！找出所有属于这个 callId 的字幕，同时屏蔽语音和视频的结算卡片本身
    callHistoryLogs.value = currentChatHistory.value.filter(m => 
      m.callId === callId && 
      m.sender !== 'system-call' && 
      m.sender !== 'system-video-call'
    )
    isCallHistoryOpen.value = true
  }
    window.openVideoHistoryModal = (callId) => {
    // 借用视频通话的回顾弹窗来显示历史记录
    videoSubtitles.value = currentChatHistory.value.filter(m => m.callId === callId && m.sender !== 'system-video-call')
    isVideoLogOpen.value = true
  }
})

// 点击“通话”触发
const triggerVoiceCall = () => {
  closeAllDrawers()
  isCallScreenOpen.value = true
  callStatusText.value = '正在等待 TA 接听...'
  callSubtitles.value = []
  currentCallId.value = 'call_' + Date.now()
  cameraMode.value = 'avatar'
  
  // 模拟真实等待
  setTimeout(() => {
    callStatusText.value = '00:00'
    callStartTime.value = Date.now()
    callTimerInterval = setInterval(() => {
      const diff = Math.floor((Date.now() - callStartTime.value) / 1000)
      const m = String(Math.floor(diff / 60)).padStart(2, '0')
      const s = String(diff % 60).padStart(2, '0')
      callStatusText.value = `${m}:${s}`
    }, 1000)
  }, Math.floor(Math.random() * 3000) + 2000)
}

// 切换摄像头逻辑
const toggleCameraMode = async () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  
  const videoEle = document.getElementById('call-video-element')
  if (cameraMode.value === 'avatar') {
    cameraMode.value = 'environment'
  } else if (cameraMode.value === 'environment') {
    cameraMode.value = 'user'
  } else {
    cameraMode.value = 'avatar'
    return
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: cameraMode.value } 
    })
    videoEle.srcObject = mediaStream
  } catch (err) {
    alert("无法调用摄像头权限哦！已切回头像。")
    cameraMode.value = 'avatar'
  }
}

// ==========================================
// User 视频通话发送引擎 (兼容安全版)
// ==========================================
const sendCallMessage = async () => {
  const text = callInputText.value.trim()
  if (!text) return
  
  // 简单直接的压入，Vue3 会自动拦截并更新屏幕
  callSubtitles.value.push({ sender: 'user', text })
  
  // 存入底层数据库 (带上通话ID)
  await saveMessageToDB('user', text, true, currentCallId.value)
  
  callInputText.value = ''
  isCallInputOpen.value = false
  
  // 【核心修复】：使用绝对兼容的 scrollTop，抛弃花里胡哨的平滑语法，确保不报错崩溃！
  setTimeout(() => {
    const box = document.getElementById('call-subtitles-container')
    if (box) box.scrollTop = box.scrollHeight
  }, 50)
}

// 通话中的语音转文字
let callRecognition = null
const isCallRecognizing = ref(false)
const toggleCallSpeech = () => {
  if (!callRecognition) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return alert("浏览器不支持语音识别哦~")
    callRecognition = new SR()
    callRecognition.lang = 'zh-CN'
    callRecognition.interimResults = true
    callRecognition.continuous = true
    
    let baseTxt = ""
    callRecognition.onstart = () => { isCallRecognizing.value = true; baseTxt = callInputText.value }
    callRecognition.onresult = (e) => {
      let f = "", i = ""
      for (let j = e.resultIndex; j < e.results.length; ++j) {
        if (e.results[j].isFinal) f += e.results[j][0].transcript
        else i += e.results[j][0].transcript
      }
      callInputText.value = baseTxt + f + i
    }
    callRecognition.onend = () => { isCallRecognizing.value = false }
    callRecognition.onerror = () => { isCallRecognizing.value = false }
  }
  
  if (isCallRecognizing.value) callRecognition.stop()
  else callRecognition.start()
}


// 手动触发 AI 接话
const triggerCallAIReply = async () => {
  if (isCallAiSpeaking.value || window.activeAITasks[props.contact?.id]) return
  isCallAiSpeaking.value = true 
  
  const charId = props.contact.id
  let aggregatedUserText = ""
  for (let i = currentChatHistory.value.length - 1; i >= 0; i--) {
    if (currentChatHistory.value[i].sender === 'char') break
    if (currentChatHistory.value[i].sender === 'user') aggregatedUserText = currentChatHistory.value[i].text + "\n" + aggregatedUserText
  }
  let systemPrompt = await buildSystemPrompt(props.contact, aggregatedUserText)
  systemPrompt += `\n\n【最高通话指令】：你现在正在和User进行实时语音通话！请注意现在的环境是语音连线。你的回复必须极度口语化、简短，绝对不能发长篇大论，禁止使用书面语，绝对不能发任何表情包链接或图片代码！就用纯文字口语！`
  
  // 核心修复：直接把通话模式参数(true)传给后台引擎，把启动打字机的权力交给底层！
  coreChatEngineBackground(props.contact, currentChatHistory.value, systemPrompt, true)
}

// 🚀 后台核心：AI 动力引擎 (自带防漏气泡锁)
const coreChatEngineBackground = async (targetChar, historySnapshot, systemPrompt, isCallMode = false) => {
  const charId = targetChar.id, st = targetChar.settings || {}
  
  // 【核心修复】：在这里统一分配任务档案袋，绝不重复覆盖！
  window.activeAITasks[charId] = { 
    text: "", isReasoning: false, isFinished: false, chunksRendered: 0, isTypingActive: false, errorMessage: "" 
  }
  
  // 【致命锁】：如果是正常聊天，去外面弹气泡；如果是通话，启动流式字幕同传！
  if (!isCallMode) {
    runTypingSimulation(charId, targetChar)
  } else {
    runCallTypingSimulation(charId)
  }
  
  try {
    const db = await initDB()
    const allApis = await new Promise(res => db.transaction(['api_profiles'], 'readonly').objectStore('api_profiles').getAll().onsuccess = e => res(e.target.result || []))
    
    // 找到专属模型或使用默认第一个
    let api = allApis.find(a => a.id === st.apiId) || allApis[0]
    if (!api) { 
      window.activeAITasks[charId].isFinished = true; 
      throw new Error("尚未在系统设置中绑定任何 API 方案！") 
    }

    // 【核心改造】：打通视觉多模态与隐形记忆标签
    let memNum = st.memoryNum !== undefined ? st.memoryNum : 50
    let historyForApi = []
    
    if (memNum > 0) {
      for (let msg of historySnapshot.slice(-memNum)) {
        let role = msg.sender === 'user' ? 'user' : 'assistant'
        
        // 1. 【省流核心】：如果这条消息已经被 AI 看过且打上了文字标签，直接发纯文字！绝对不发图！
        if (msg.visionLabel) {
          let textOnly = msg.text.replace(/\[IMG:.*?\]/g, `[历史图片：${msg.visionLabel}]`)
                                 .replace(/\[STK:(?:.*?\|)?.*?\]/g, `[历史表情：${msg.visionLabel}]`)
          historyForApi.push({ role, content: textOnly })
          continue
        }

        // 2. 如果是没看过的新图，准备多模态视觉包裹
        let contentPayload = []
        let rawText = msg.text
        const imgRegex = /\[IMG:(.*?)\]/g
        const stkRegex = /\[STK:(?:(.*?)\|)?(.*?)\]/g
        let lastIndex = 0, match
        
        while ((match = imgRegex.exec(rawText)) !== null) {
          if (match.index > lastIndex) contentPayload.push({ type: "text", text: rawText.substring(lastIndex, match.index) })
          if (st.autoAvatar && role === 'user') contentPayload.push({ type: "text", text: `(此图片编号:${msg.id})` })
          contentPayload.push({ type: "image_url", image_url: { url: match[1] } })
          lastIndex = imgRegex.lastIndex
        }
        
        while ((match = stkRegex.exec(rawText)) !== null) {
          if (match.index > lastIndex) contentPayload.push({ type: "text", text: rawText.substring(lastIndex, match.index) })
          if (st.autoAvatar) {
            if (role === 'user') contentPayload.push({ type: "text", text: `(此表情包编号:${msg.id})` })
            contentPayload.push({ type: "image_url", image_url: { url: match[2] } }) // 开启换头则真看图
          } else {
            contentPayload.push({ type: "text", text: `[表情包:${match[1] || '表情'}]` }) // 没开换头只看字
          }
          lastIndex = stkRegex.lastIndex
        }
        
        if (lastIndex < rawText.length) contentPayload.push({ type: "text", text: rawText.substring(lastIndex) })
        
        if (contentPayload.length === 0) historyForApi.push({ role, content: rawText })
        else if (contentPayload.length === 1 && contentPayload[0].type === 'text') historyForApi.push({ role, content: contentPayload[0].text })
        else historyForApi.push({ role, content: contentPayload })
      }
    }
    const payload = { 
      model: api.model, 
      messages: [ { role: "system", content: systemPrompt }, ...historyForApi ], 
      temperature: parseFloat(api.temperature) || 0.7, 
      stream: !!api.isStream 
    }
    
    const fetchUrl = api.url.replace(/\/+$/, '') + '/chat/completions'

    // --- 开始请求接口 ---
    if (payload.stream) {
      const controller = new AbortController()
      const response = await fetch(fetchUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` }, 
        body: JSON.stringify(payload), 
        signal: controller.signal 
      })

      if (!response.ok) throw new Error(`API 请求失败 (状态码: ${response.status})`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""

      while (true) {
        // =============== 新代码开始 (护盾1) ===============
        // 每次读流之前，如果发现档案袋没了，直接杀掉网络请求并退出
        if (!window.activeAITasks[charId]) {
          controller.abort();
          break;
        }
        // =============== 新代码结束 ===============

        const { value, done } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        
        for (let line of lines) {
          if (line.trim().startsWith('data:')) {
            let jsonStr = line.substring(5).trim()
            if (jsonStr === '[DONE]' || !jsonStr) continue
            try {
              const delta = JSON.parse(jsonStr).choices[0]?.delta
              if (delta) {

                // =============== 新代码开始 (护盾2) ===============
                // 在准备往 isReasoning 里塞东西前，死死护住！没了就立刻退出！
                if (!window.activeAITasks[charId]) {
                  controller.abort();
                  return; 
                }
                // =============== 新代码结束 ===============

                // 解析深度思考内容 (reasoning)
                if (delta.reasoning_content) {
                  if (!window.activeAITasks[charId].isReasoning) { 
                    window.activeAITasks[charId].text += "<think>\n"
                    window.activeAITasks[charId].isReasoning = true 
                  }
                  window.activeAITasks[charId].text += delta.reasoning_content
                } 
                // 解析普通对话内容
                else if (delta.content) {
                  if (window.activeAITasks[charId].isReasoning) { 
                    window.activeAITasks[charId].text += "\n</think>\n"
                    window.activeAITasks[charId].isReasoning = false 
                  }
                  window.activeAITasks[charId].text += delta.content
                }
              }
            } catch (e) {
              console.error("流解析错误", e)
            }
          }
        }
      }
      
      // =============== 新代码开始 (护盾3) ===============
      // 循环结束后，只有档案袋还活着，才去检查内容和标记完成
      if (window.activeAITasks[charId]) {
        if (window.activeAITasks[charId].text.trim() === "") {
          throw new Error("API 连接成功但未返回任何内容。")
        }
        window.activeAITasks[charId].isFinished = true
      }
      // =============== 新代码结束 ===============

    } else {
      // --- 全量输出模式 ---
      const response = await fetch(fetchUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` }, 
        body: JSON.stringify(payload) 
      })

      if (!response.ok) throw new Error(`API 拒绝请求 (状态码: ${response.status})`)
      
      const resData = await response.json()
      if (!resData.choices || !resData.choices[0]) throw new Error("API 返回数据格式异常")
      
      const choice = resData.choices[0]
      let resultText = ""
      
      const reasoning = choice.message.reasoning_content || choice.message.reasoning
      if (reasoning) {
        resultText += `<think>\n${reasoning.trim()}\n</think>\n`
      }
      resultText += choice.message.content || ""
      
      window.activeAITasks[charId].text = resultText
      window.activeAITasks[charId].isFinished = true
    }

    // ==========================================
    // 【新增调试输出】：在控制台打印 AI 的最原始回复，方便抓虫！
    // ==========================================
    console.log(`\n\n========== 【AI 原始回复日志 (${targetChar.name})】 ==========`);
    console.log(window.activeAITasks[charId].text);
    console.log(`============================================================\n\n`);

    // ==========================================
    // 🎭 视觉记忆与智能换头像拦截引擎 (幕后执行)
    // ==========================================
    // ==========================================
    // 🎭 视觉记忆与智能换头像拦截引擎 (幕后执行)
    // ==========================================
    if (st.autoAvatar) {
      let finalFullText = window.activeAITasks[charId].text
      
      // 1. 抓取视觉记忆，悄悄给历史记录的图片打上文字隐形标签
      const memMatch = finalFullText.match(/\[视觉记忆:(.*?)\|(.*?)\]/)
      if (memMatch) {
        const targetPicId = memMatch[1].trim()
        const labelDesc = memMatch[2].trim()
        const tx = db.transaction(['chat_history_db'], 'readwrite')
        const store = tx.objectStore('chat_history_db')
        store.get(charId).onsuccess = (e) => {
          const data = e.target.result
          if (data && data.messages) {
            const targetMsg = data.messages.find(m => m.id === targetPicId)
            if (targetMsg) {
              targetMsg.visionLabel = labelDesc // 贴上隐形标签！下次只看字不看图！
              store.put(data)
            }
          }
        }
      }
      
      // 2. 抓取换头像指令，瞬间换脸
      const avatarMatch = finalFullText.match(/\[换头像:(.*?)\]/)
      if (avatarMatch) {
        const targetPicId = avatarMatch[1].trim()
        const targetMsg = historySnapshot.find(m => m.id === targetPicId)
        if (targetMsg) {
          let newAvatarUrl = ''
          const imgM = targetMsg.text.match(/\[IMG:(.*?)\]/)
          const stkM = targetMsg.text.match(/\[STK:(?:.*?\|)?(.*?)\]/)
          if (imgM) newAvatarUrl = imgM[1]
          else if (stkM) newAvatarUrl = stkM[1]
          
          if (newAvatarUrl) {
            const tx2 = db.transaction(['contacts_profiles'], 'readwrite')
            const store2 = tx2.objectStore('contacts_profiles')
            store2.get(charId).onsuccess = (e) => {
              const charProf = e.target.result
              if (charProf) {
                charProf.avatar = newAvatarUrl
                store2.put(charProf)
              }
            }
            // 实时更新当前内存，实现无刷新秒换脸
            if (targetChar) targetChar.avatar = newAvatarUrl
          }
        }
        // 销毁作案证据，不让 User 看到这段隐藏代码
        window.activeAITasks[charId].text = window.activeAITasks[charId].text.replace(/\[换头像:.*?\]/g, '').trim()
      }
      
      // 清理视觉记忆代码，防穿帮
      window.activeAITasks[charId].text = window.activeAITasks[charId].text.replace(/\[视觉记忆:.*?\]/g, '').trim()
    }

    // ==========================================
    // 📞 AI 主动来电拦截引擎 (绝对无死角拦截)
    // ==========================================
    let fullTextCheck = window.activeAITasks[charId].text
    if (fullTextCheck.includes('[发起视频通话]')) {
      // 消除屏幕证据
      window.activeAITasks[charId].text = window.activeAITasks[charId].text.replace(/\[发起视频通话\]/g, '').trim()
      // 延迟1秒弹出来电横幅，给玩家一点心理缓冲
      setTimeout(() => { incomingCallType.value = 'video' }, 1000)
    } else if (fullTextCheck.includes('[发起语音通话]')) {
      window.activeAITasks[charId].text = window.activeAITasks[charId].text.replace(/\[发起语音通话\]/g, '').trim()
      setTimeout(() => { incomingCallType.value = 'voice' }, 1000)
    }

  } catch (err) {
    if (window.activeAITasks[charId]) {
      window.activeAITasks[charId].errorMessage = err.message
      window.activeAITasks[charId].isFinished = true
    }
  }
}

const runCallTypingSimulation = async (charId) => {
  const task = window.activeAITasks[charId]
  if (!task) return
  task.isTypingActive = true
  
  while (true) {
    if (task.errorMessage) {
      callSubtitles.value.push({ sender: 'char', text: `[信号微弱：${task.errorMessage}]` })
      break
    }
    
    // ==========================================
    // 👇 终极防弹衣：语音通话解析 👇
    // ==========================================
    let cleanText = task.text.replace(/<think>([\s\S]*?)(?:<\/think>|$)/gi, '').trim()
    
    const replyMatch = cleanText.match(/<reply>([\s\S]*?)(?:<\/reply>|$)/i);
    if (replyMatch) {
      cleanText = replyMatch[1].trim();
    }
    
    cleanText = cleanText.replace(/[\(（\*].*?[\)）\*]/g, '').trim(); 
    cleanText = cleanText.replace(/^\s*\d+[\.、]\s*/gm, '').trim();

    let autoSplitText = cleanText.replace(/(\[STK:(?:.*?\|)?[^\]]+\])/g, '|||$1|||');
    // 解析 AI 主动发起的转账
    autoSplitText = autoSplitText.replace(/\[发起转账:([\d\.]+)\|(.*?)\]/g, (match, amt, note) => {
        let tid = 'tr_' + Date.now() + Math.floor(Math.random()*1000);
        return `|||[TRANSFER:${tid}|${amt}|${note}|pending]|||`;
    });
  // --- 新增功能：通话中的顺风车记忆抓取 开始 ---
    const tagMatch = autoSplitText.match(/\[捕捉标签:\s*(.*?)\|(.*?)\]/);
    if (tagMatch) {
      const cat = tagMatch[1].trim();
      const cont = tagMatch[2].trim().substring(0, 30);
      const db = await initDB();
      const tx = db.transaction(['memory_db'], 'readwrite');
      const memData = await new Promise(res => tx.objectStore('memory_db').get(charId).onsuccess = e => res(e.target.result)) || { charId, narrative: [], profile: [] };
      if (!memData.profile) memData.profile = [];
      if (!memData.profile.find(p => p.content === cont)) {
        memData.profile.push({ id: 'tag_' + Date.now(), category: cat, content: cont, status: 'pending', timestamp: Date.now() });
        await new Promise(res => { tx.objectStore('memory_db').put(memData).onsuccess = res });
      }
      autoSplitText = autoSplitText.replace(/\[捕捉标签:.*?\]/g, '').trim();
    }
    // --- 结束 ---

    if (autoSplitText.includes('[发起语音通话]')) {
      autoSplitText = autoSplitText.replace(/\[发起语音通话\]/g, '').trim()
      setTimeout(() => { incomingCallType.value = 'voice' }, 1000)
    } else if (autoSplitText.includes('[发起视频通话]')) {
      autoSplitText = autoSplitText.replace(/\[发起视频通话\]/g, '').trim()
      setTimeout(() => { incomingCallType.value = 'video' }, 1000)
    }

    let parts = autoSplitText.split('|||').map(p => p.trim()).filter(p => p)
    
    let availableCount = task.isFinished ? parts.length : parts.length - 1
    if (availableCount < 0) availableCount = 0
    
    if (task.chunksRendered < availableCount) {
      let chunkText = parts[task.chunksRendered]
      if (chunkText) {
        callSubtitles.value.push({ sender: 'char', isTyping: true, text: '' })
        
        setTimeout(() => {
          const box = document.getElementById('call-subtitles-container')
          if (box) box.scrollTop = box.scrollHeight
        }, 50)
        
        let delay = Math.min(3000, Math.max(1000, chunkText.length * 80))
        await new Promise(res => setTimeout(res, delay))
        
        callSubtitles.value.pop()
        callSubtitles.value.push({ sender: 'char', text: chunkText })
        
        await saveMessageToDB('char', chunkText, true, currentCallId.value)
        
        setTimeout(() => {
          const box = document.getElementById('call-subtitles-container')
          if (box) box.scrollTop = box.scrollHeight
        }, 50)
        
        task.chunksRendered++
      }
    } else {
      if (task.isFinished) {
        if (parts.length === 0) {
          callSubtitles.value.push({ sender: 'char', text: '[沉默...]' })
          await saveMessageToDB('char', '[沉默...]', true, currentCallId.value)
        }
        break
      }
      await new Promise(res => setTimeout(res, 150))
    }
  }
  
  delete window.activeAITasks[charId]
  isCallAiSpeaking.value = false 
}

const hangUpCall = async () => {
  if (callTimerInterval) clearInterval(callTimerInterval)
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
  isCallScreenOpen.value = false
  
  // 生成总结算气泡
  if (currentCallId.value && callStatusText.value !== '正在等待 TA 接听...') {
    const finalDuration = callStatusText.value
    await saveMessageToDB('system-call', finalDuration, false, currentCallId.value)
    
    // 强制刷新主屏幕，让气泡弹出来！
    setTimeout(() => {
        renderMessagesChunk(currentLoadedCount.value, false)
    }, 100)
  }
}

// User 发送消息（仅上屏，含拉黑拦截，绝不自动触发 AI 回复）
const sendMsg = async () => {
  const text = inputText.value.trim()
  if (!text || !props.contact) return
  
  // 清空输入框
  inputText.value = ''
  
  const st = props.contact.settings || {}
  const now = Date.now()    // 必须定义当前时间
  let isRejected = false    // 必须定义是否被拒收的变量
  
  // 【新增】：判断是否正处于小黑屋时间
  if (st.blacklistedUntil && now < st.blacklistedUntil) {
    isRejected = true
  }

  // 带着拒收状态去保存，然后上屏渲染（只保留这一次保存，删掉多余的！）
  await saveMessageToDB('user', text, false, null, isRejected)

  // 如果被拉黑，直接切断一切（维持单机受虐体验）
  if (isRejected) {
    return
  }

  // 小黑屋过期了但还没诈尸，清空一下兜底
  if (st.blacklistedUntil && now >= st.blacklistedUntil) {
    props.contact.settings.blacklistedUntil = null
  }
  
  // 按照你的神级架构，这里绝对不要加 triggerAIReply！保留你的手动触发机制！
}

const updateDBSync = async () => {
  const db = await initDB()
  db.transaction(['chat_history_db'], 'readwrite').objectStore('chat_history_db').put({ 
    charId: props.contact.id, 
    messages: JSON.parse(JSON.stringify(currentChatHistory.value)) 
  })
}

// --- 新增功能：自动记忆总结引擎 (小结与大结合并) 开始 ---
const triggerAutoSummary = async (charId) => {
  if (window.activeAITasks[charId + '_summary']) return // 防止并发执行
  window.activeAITasks[charId + '_summary'] = true
  try {
    const db = await initDB()
    const tx = db.transaction(['memory_db', 'chat_history_db', 'api_profiles'], 'readwrite')
    
    const memData = await new Promise(res => tx.objectStore('memory_db').get(charId).onsuccess = e => res(e.target.result)) || { charId, narrative: { short: [], long: [], unsummarizedMsgCount: 0 }, profile: [], settings: {} }
    if (!memData.narrative) memData.narrative = { short: [], long: [], unsummarizedMsgCount: 0 }
    const st = memData.settings || {}
    
    // 读取自定义参数或默认值
    const shortInterval = parseInt(st.shortSummaryInterval) || 50
    const longThreshold = parseInt(st.longSummaryThreshold) || 5
    const apiId = st.apiId || null
    const customPrompt = st.customPrompt?.trim() || "作为客观的时光记录者，请以第三人称上帝视角提炼互动回忆。要求：1.点明时间与起因。2.客观记述情感起伏与抛出的重要信息。3.不少于30字，细节生动具体。"
    const apiList = await new Promise(res => tx.objectStore('api_profiles').getAll().onsuccess = e => res(e.target.result || []))
    let api = apiList.find(a => a.id === apiId) || apiList[0]
    if (!api) throw new Error("无可用总结 API")
    // 1. 生成小结
    if (memData.narrative.unsummarizedMsgCount >= shortInterval) {
      const histData = await new Promise(res => tx.objectStore('chat_history_db').get(charId).onsuccess = e => res(e.target.result))
      if (histData && histData.messages) {
        // 取最近达到间隔数量的消息
        const msgsToSum = histData.messages.slice(-shortInterval)
        let chatLog = msgsToSum.map(m => `${m.sender === 'user' ? 'User' : 'TA'}: ${m.text}`).join('\n')
        
        const payload = { 
          model: api.model, 
          messages: [
            { role: "system", content: "你是一个专门提炼聊天记录的后台分析仪。请严格按照以下法则进行提炼，绝对不要输出多余的寒暄废话，直接输出正文：" + customPrompt },
            { role: "user", content: `请提炼以下聊天记录：\n${chatLog}` }
          ], 
          temperature: 0.5 
        }
        
        const response = await fetch(api.url.replace(/\/+$/, '') + '/chat/completions', { 
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` }, body: JSON.stringify(payload) 
        })
        const resData = await response.json()
        const summaryText = resData.choices[0].message.content.trim()
        memData.narrative.short.push({ id: 'sum_' + Date.now(), text: summaryText, timestamp: Date.now() })
        memData.narrative.unsummarizedMsgCount = 0 // 清空计数器
      }
    }
    // 2. 检查是否需要合并大总结
    if (memData.narrative.short.length >= longThreshold) {
      const shortsToMerge = memData.narrative.short.splice(0, longThreshold) // 拿出符合数量的旧小结
      const shortLog = shortsToMerge.map((s, idx) => `片段${idx + 1}(${new Date(s.timestamp).toLocaleTimeString()}): ${s.text}`).join('\n')
      const payload = { 
        model: api.model, 
        messages: [
          { role: "system", content: "你是一个高阶剧情编排大师。请将以下零散的时间片段，融合成一个起承转合完整的、以上帝视角描述的大章节总结，不要列条目，写成一段流畅的故事梗概即可。" },
          { role: "user", content: `请融合以下片段：\n${shortLog}` }
        ], 
        temperature: 0.6 
      }
      
      const response = await fetch(api.url.replace(/\/+$/, '') + '/chat/completions', { 
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` }, body: JSON.stringify(payload) 
      })
      const resData = await response.json()
      const bigSummaryText = resData.choices[0].message.content.trim()
      memData.narrative.long.push({ 
        id: 'big_sum_' + Date.now(), 
        text: bigSummaryText, 
        children: shortsToMerge, // 把吃掉的小结挂在下面
        timestamp: Date.now() 
      })
    }
    // 保存回数据库
    const saveTx = db.transaction(['memory_db'], 'readwrite')
    await new Promise(res => { saveTx.objectStore('memory_db').put(memData).onsuccess = res })
  } catch (err) {
    console.error("记忆静默总结失败：", err)
  } finally {
    delete window.activeAITasks[charId + '_summary']
  }
}
// --- 结束 ---



const buildSystemPrompt = async (targetChar, aggregatedUserText) => {
  const st = targetChar.settings || {}
  
  // ==========================================
  // 第一部分：角色设定、环境、世界书与【潜意识法则】
  // ==========================================
  let sp = `【角色设定】\n你的名字是“${targetChar.name}”。\n`
  if (targetChar.prompt) sp += `你的核心人设：\n${targetChar.prompt}\n\n`

  const userProf = await getSettingValue('user_profile')
  if (userProf && userProf.name) {
    sp += `【对方信息】对方叫“${userProf.name}”。\n${userProf.prompt ? '身份：' + userProf.prompt : ''}\n\n`
  }

  sp += `【行为准则】直接以角色身份开口，绝对禁止复述对方的话！\n`

  if (st.useCot) {
    sp += `\n【内在潜意识法则】：
你的底层系统会在你开口说话前，自动运转思考区。请把那里当成你的绝对私密日记。
用【中文】仔细体会对方刚刚那句话的潜台词，感受你最真实的本能情绪波动，确立你的应对态度。
（警告：潜意识区仅用于酝酿情绪，绝对禁止在这里规划排版、打台词草稿或列数字提纲！）\n`
    if (st.cotPrompt && st.cotPrompt.trim() !== '') {
      sp += `专属内心引导：${st.cotPrompt}\n`
    }
  }

  if (st.noMeet) {
    sp += `\n【最高红线：纯网恋设定】：你和User目前处于纯粹的“网恋/异地”阶段！绝对不能主动提出线下见面或跨越屏幕的肢体接触。一切陪伴都必须明确是“线上云互动”！\n`
  }

  if (st.language && st.language !== '中文') {
    sp += `\n【跨国交流】你必须使用 ${st.language} 交流！每一条独立气泡内必须严格遵守：[原文] /// [中文翻译] 格式！\n`
  }

  if (st.senseTime) {
    const now = new Date(); sp += `\n【时间感知】现在是 ${now.getHours()}:${now.getMinutes().toString().padStart(2,'0')}。\n`
  }
  
  const db = await initDB()
  
  if (st.senseWeather) {
    const weather = await getSettingValue('env_weather')
    if (weather) sp += `\n【环境感知】对方身边的天气：${weather}。\n`
  }

  if (st.selectedWorldbooks && st.selectedWorldbooks.length > 0) {
    const allWb = await new Promise(res => db.transaction(['worldbook_db'], 'readonly').objectStore('worldbook_db').getAll().onsuccess = e => res(e.target.result || []))
    st.selectedWorldbooks.forEach(id => {
      const entry = allWb.find(e => e.id === id)
      if (entry && entry.isEnabled) {
        if (entry.triggerType === '常驻') sp += `\n【世界观设定】[${entry.name}]: ${entry.content}`
        else if (entry.keywords) {
          const hit = entry.keywords.split(',').some(k => aggregatedUserText.includes(k.trim()))
          if (hit) sp += `\n【世界观设定】[${entry.name}]: ${entry.content}`
        }
      }
    })
  }

  if (targetChar._justChangedRemark) {
    sp += `\n【临时最高指令】\nUser刚刚把你备注名改成了“${targetChar._justChangedRemark}”！请在这条回复中自然反应！\n\n`
  }

  if (targetChar._regenerateWarning) {
    sp += `\n【⚠️ 撤回与重试警告】\nUser刚刚对你的回复不满意，并撤回了你说的这句话：“${targetChar._regenerateWarning}”。
请你立刻改变思路，重新进行回复！\n\n`
  }

  if (targetChar._justUnblacklisted) {
    sp += `\n【特殊情境指令】\n你把User拉黑了一段时间，现在你把TA从黑名单放出来了！你刚刚看到了User在被你拉黑期间发给你的所有消息。请立刻结合你的人设与此刻情景，对TA刚才发的话做出连发反应。\n\n`
  }

  // --- 新增功能：注入羁绊画像与记忆捕捉引擎 开始 ---
  const memoryReq = await new Promise(res => db.transaction(['memory_db'], 'readonly').objectStore('memory_db').get(targetChar.id).onsuccess = e => res(e.target.result))
  const profiles = memoryReq?.profile || []
  const confirmedProfiles = profiles.filter(p => p.status === 'confirmed')
  
  if (confirmedProfiles.length > 0) {
    sp += `\n【User 的专属羁绊档案】\n请你将以下事实刻在灵魂深处，这是你与 User 之间不可磨灭的专属羁绊。这是你在逐渐了解 User，和 TA 灵魂交流的重要锚点。\n在接下来的交流中，请你严格结合你自身的人设，灵活且深刻地牢记这些设定，并在恰当的时候自然流露出来，让 User 感受你的用心：\n`
    confirmedProfiles.forEach(p => {
      sp += `- [${p.category}]：${p.content}\n`
    })
  }

  // --- 新增功能：将历史大总结和散落小结注入提示词 开始 ---
  const narrative = memoryReq?.narrative || {}
  const longArr = narrative.long || []
  const shortArr = narrative.short || []
  
  // 取最近的 2 个大总结和所有还没合并的小结，拼成剧情提要
  let recentPlots = []
  longArr.slice(-2).forEach(ls => recentPlots.push(`[长篇回忆]：${ls.text}`))
  shortArr.forEach(ss => recentPlots.push(`[近期片段]：${ss.text}`))
  
  if (recentPlots.length > 0) {
    sp += `\n【历史剧情提要】\n为了防止遗忘，以下是你与User近期经历的剧情梗概，请在接下来的对话中自然地延续这个背景：\n${recentPlots.join('\n')}\n`
  }



  sp += `\n【自动记忆捕捉引擎】\n你拥有敏锐的情感与记忆捕捉能力。在聊天过程中，如果你发现 User 透露了关于 TA 自己的基本信息人物特征、特殊喜好、彼此的专属约定与美好的回忆、或者是不可触碰的雷区，请你在回复的最末尾（必须在 <reply> 标签之外），悄悄附带一条隐藏的记录代码。\n【抓取要求】：\n1. 分类限制：必须且只能从以下 6 个类别中选择一个：核心档案、约定、生活、雷区、情感、世界观。\n2. 字数限制：竖线 | 后面的内容必须极度精简，绝对不能超过 30 个字！\n3. 严格格式：[捕捉标签: 分类名|30字以内的具体内容]\n`
  // --- 结束 ---

  // ==========================================
  // 第二部分：辅助特权与功能指令
  // ==========================================
  if (!st.noCall) {
    sp += `\n【主动来电特权】：你可以在 <reply> 标签内部的最末尾加上代码 [发起语音通话] 或 [发起视频通话] 主动打电话。\n`
  }

// --- 新增功能：发文特权 开始 ---
  sp += `\n【特刊分享特权】：如果你想给User分享一篇符合你们聊天语境的杂志文章，请在 <reply> 标签内输出代码 [行为:准备分享特刊|关于什么主题] (需作为独立句子，如：[行为:准备分享特刊|关于深海星空])。发送后系统会自动排版并发出卡片。\n`
  // --- 结束 ---


  if (st.ignoreMsg) {
    sp += `\n【情绪拉扯机制】：想吊着对方时，直接在 <reply> 标签内输出隐藏代码 [行为:已读不回]，无需输出台词。\n`
  }

  // 【修改点】：明确告诉 AI，拉黑代码也必须放进 reply 标签里，双重保险！
  sp += `\n【拉黑特权】：如果你被User彻底惹怒，不想理TA，请直接在 <reply> 标签内输出隐藏代码 [行为:拉黑] ，绝对不要输出任何台词！\n`

  if (st.autoAvatar) {
    sp += `\n【自主换头像】：若决定换头像，在最后加上 [换头像:图片编号]。\n`
  }

  const allStickers = await new Promise(res => db.transaction(['emoticons_db'], 'readonly').objectStore('emoticons_db').getAll().onsuccess = e => res(e.target.result || []))
  const availStickers = allStickers.filter(s => s.scope === 'global' || s.scope === targetChar.id)
  if (availStickers.length > 0) {
    sp += `\n【表情包指令】可以自主发送表情，必须作为独立的句子：\n`
    availStickers.forEach(s => sp += `- [STK:${s.name}|${s.url}]\n`)
  }
  if (st.imageOn) sp += `\n【视觉社交指令】发照片格式：[TXT_IMG:画面细节描述] (需作为独立句子)。\n`
  if (st.voiceOn) sp += `\n【语音社交指令】发语音格式：[VOICE:秒数|文字内容] (需作为独立句子)。\n`
  sp += `\n【位置共享指令】可发送定位卡片！格式：[LOCATION:所在的地点] (需作为独立句子)。\n`
   sp += `\n【转账互动特权】：
- 当User给你转账时，你可以结合心情在 <reply> 标签内任意位置输出隐藏代码 [行为:收下转账] 或 [行为:退还转账] 来处理这笔钱。
- 你也可以主动给User转账哄TA，格式：[发起转账:金额|留言备注] (需作为独立句子)。\n`

  // ==========================================
  // 第三部分：终极物理输出规则 (XML包裹 + 发送键)
  // ==========================================
  let bubNum = st.bubbleNum || 2
  
  sp += `\n\n====================\n【终极正文排版协议：XML双重包裹】\n`
  sp += `此时此刻，你正在用手机打字。\n`
  
  if (bubNum > 1) {
    sp += `【发送键协议】：你习惯连发短消息（约 ${bubNum} 到 ${bubNum + 1} 条）。"|||" 等同于你按下了手机的“发送键”！你正文里的每一句短话，必须用 "|||" 隔开！\n`
  }
  
  sp += `【包裹红线】：你真正要发送给User的纯文字台词和隐藏指令代码，必须且只能放在 <reply> 和 </reply> 标签之间！在这个标签外面写的任何内容都不会被系统识别！
【洁癖警告】：<reply> 标签内绝对禁止写 "1. 2. 3." 等列表序号！绝对禁止使用 "(动作)" 等括号描写！

【绝对正确排版示例】：
<reply>在干嘛呢|||怎么不理我了|||是不是嫌我烦</reply>

【错误示例】（严禁这样写）：
<reply>1. (脸红) 在干嘛呢 2. 怎么不理我了</reply>\n`

  return sp
}


const isOfflineCooling = ref(false)

const triggerAIReply = async (isAwakening = false) => {
  if (!props.contact || window.activeAITasks[props.contact.id]) return
  const charId = props.contact.id
  const st = props.contact?.settings || {}
  const now = Date.now()

  // 1. 构建 Prompt (聚合上下文，要放在前面因为敲门也需要)
  let aggregatedUserText = ""
  for (let i = currentChatHistory.value.length - 1; i >= 0; i--) {
    if (currentChatHistory.value[i].sender === 'char') break
    if (currentChatHistory.value[i].sender === 'user') aggregatedUserText = currentChatHistory.value[i].text + "\n" + aggregatedUserText
  }

  // ==========================================
  // 【新增】：戳一戳求饶！如果在小黑屋期间点击AI回复
  // ==========================================
  if (st.blacklistedUntil && now < st.blacklistedUntil && !isAwakening) {
    let systemPrompt = await buildSystemPrompt(props.contact, aggregatedUserText)
    systemPrompt += `\n\n【⚠️小黑屋特殊情境：User在疯狂敲门！】
你目前正把User关在小黑屋（拉黑）里。User刚刚不停地戳你，试图引起你的注意或求原谅。
请结合你现在的心情决定：
1. 如果你心软了，请在 <reply> 标签内输出隐藏代码 [行为:提前解封] ，并紧接着写下你要对TA说的话（傲娇的原谅等，必须用 ||| 连发！）。
2. 如果你还在气头上，请在 <reply> 标签内输出隐藏代码 [行为:继续拉黑] ，绝对不要输出任何台词！\n`

    appendTypingIndicator(charId, props.contact.avatar)
    window.activeAITasks[charId] = { text: "", isReasoning: false, isFinished: false, chunksRendered: 0, isTypingActive: false, errorMessage: "" }
    coreChatEngineBackground(props.contact, currentChatHistory.value, systemPrompt)
    return // 发送敲门后立刻停止，不执行后面的逻辑
  }

  // 2. 【未读装死拦截】：如果开启了允许已读不回
  if (st.ignoreMsg) {
    if (isOfflineCooling.value && !isAwakening) return
    if (!isAwakening && Math.random() * 100 <= 15) {
      isOfflineCooling.value = true
      setTimeout(async () => {
         isOfflineCooling.value = false
         await triggerAIReply(true) 
      }, 30000)
      return
    }
  }

  // 3. 【变更为已读】
  const db = await initDB()
  const tx = db.transaction(['chat_history_db'], 'readwrite')
  const store = tx.objectStore('chat_history_db')
  const histData = await new Promise(res => store.get(charId).onsuccess = e => res(e.target.result))
  if (histData && histData.messages) {
    let changed = false
    histData.messages.forEach(m => { 
      if (m.sender === 'user' && !m.isRead) { m.isRead = true; changed = true }
    })
    if (changed) {
      await new Promise(res => { store.put(histData).onsuccess = res })
      currentChatHistory.value = histData.messages
      renderMessagesChunk(currentLoadedCount.value, true) 
    }
  }

  // 4. 正常回复逻辑
  let systemPrompt = await buildSystemPrompt(props.contact, aggregatedUserText)
  if (isAwakening) {
    systemPrompt += `\n\n【最高情境指令】：你刚刚消失了一段时间没有看手机。在这期间User给你发了消息。请你现在主动诈尸回复，先自然地解释一下干嘛去了，然后再回应！`
  }
  
  appendTypingIndicator(charId, props.contact.avatar)
  window.activeAITasks[charId] = { text: "", isReasoning: false, isFinished: false, chunksRendered: 0, isTypingActive: false, errorMessage: "" }
  coreChatEngineBackground(props.contact, currentChatHistory.value, systemPrompt)
}


const runTypingSimulation = async (charId, targetChar) => {
  const task = window.activeAITasks[charId]; 
  if (!task || task.isTypingActive) return; 
  task.isTypingActive = true
  
  const removeGlobalTyping = () => { const g = document.getElementById(`global_typing_${charId}`); if (g) g.remove() }
  
  while (true) {
    if (task.errorMessage) {
      removeGlobalTyping(); const wrapper = document.getElementById('chat-messages-wrapper')
      if (wrapper) { const errRow = document.createElement('div'); errRow.className = 'chat-time-stamp'; errRow.innerText = `[ 信号阻断：${task.errorMessage} ]`; wrapper.appendChild(errRow) }
      break
    }
    
    let currentText = task.text;
    let thinkContent = "";
    let cleanText = currentText;

    cleanText = cleanText.replace(/\[[！!]\s*\]/g, '');
    cleanText = cleanText.replace(/\[视觉记忆:.*?\]/g, '').replace(/\[换头像:.*?\]/g, '');
    
    cleanText = cleanText.replace(/<think>([\s\S]*?)(?:<\/think>|$)/gi, (m, p1) => { 
        thinkContent += `<think>${p1.trim()}</think>\n`; 
        return ''; 
    }).trim();

    if (cleanText.includes('[行为:收下转账]')) {
      await interceptTransferCommand(charId, 'accepted')
      cleanText = cleanText.replace(/\[行为:收下转账\]/g, '').trim()
    }
    if (cleanText.includes('[行为:退还转账]')) {
      await interceptTransferCommand(charId, 'rejected')
      cleanText = cleanText.replace(/\[行为:退还转账\]/g, '').trim()
    }

    const tagMatch = cleanText.match(/\[捕捉标签:\s*(.*?)\|(.*?)\]/);
    if (tagMatch) {
      const cat = tagMatch[1].trim();
      const cont = tagMatch[2].trim().substring(0, 30); 
      const db = await initDB();
      const tx = db.transaction(['memory_db'], 'readwrite');
      const store = tx.objectStore('memory_db');
      const memData = await new Promise(res => store.get(charId).onsuccess = e => res(e.target.result)) || { charId, narrative: [], profile: [] };
      if (!memData.profile) memData.profile = [];
      if (!memData.profile.find(p => p.content === cont)) {
        memData.profile.push({ id: 'tag_' + Date.now(), category: cat, content: cont, status: 'pending', timestamp: Date.now() });
        await new Promise(res => { store.put(memData).onsuccess = res });
      }
      cleanText = cleanText.replace(/\[捕捉标签:.*?\]/g, '').trim();
    }

    if (cleanText.includes('[行为:拉黑]')) {
      const db = await initDB()
      const tx = db.transaction(['contacts_profiles'], 'readwrite')
      const store = tx.objectStore('contacts_profiles')
      const charReq = await new Promise(res => store.get(charId).onsuccess = e => res(e.target.result))
      if (charReq) {
        if (!charReq.settings) charReq.settings = {}
        const blockMs = Math.floor(Math.random() * (1800000 - 60000 + 1)) + 60000
        charReq.settings.blacklistedUntil = Date.now() + blockMs
        await new Promise(res => { store.put(charReq).onsuccess = res })
        if (targetChar.settings) targetChar.settings.blacklistedUntil = charReq.settings.blacklistedUntil
        startUnblockTimer(charId, blockMs)
      }
      removeGlobalTyping()
      delete window.activeAITasks[charId]
      break 
    }

    if (cleanText.includes('[行为:已读不回]')) {
      removeGlobalTyping();
      const wrapper = document.getElementById('chat-messages-wrapper')
      const tempId = `fake_typing_${charId}`
      const tempRow = document.createElement('div')
      tempRow.id = tempId; tempRow.className = `chat-row char not-first`
      tempRow.innerHTML = `<div class="chat-avatar hidden"></div><div class="chat-bubble"><div class="typing-indicator" style="margin:0;"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`
      wrapper.appendChild(tempRow)
      const stream = document.getElementById('chat-stream-container')
      if (stream) stream.scrollTop = stream.scrollHeight
      await new Promise(res => setTimeout(res, 3500))
      const tempEl = document.getElementById(tempId); if (tempEl) tempEl.remove();
      delete window.activeAITasks[charId]
      break
    }

    if (cleanText.includes('[行为:继续拉黑]')) {
      removeGlobalTyping();
      const wrapper = document.getElementById('chat-messages-wrapper')
      const tempRow = document.createElement('div')
      tempRow.className = 'chat-time-stamp'
      tempRow.innerText = 'TA看了一眼你的消息，依然不想理你...'
      wrapper.appendChild(tempRow)
      const stream = document.getElementById('chat-stream-container')
      if (stream) stream.scrollTop = stream.scrollHeight
      delete window.activeAITasks[charId]
      break
    }

    if (cleanText.includes('[行为:提前解封]')) {
      const db = await initDB()
      const tx = db.transaction(['contacts_profiles'], 'readwrite')
      const store = tx.objectStore('contacts_profiles')
      const charReq = await new Promise(res => store.get(charId).onsuccess = e => res(e.target.result))
      if (charReq) {
        if (!charReq.settings) charReq.settings = {}
        charReq.settings.blacklistedUntil = null 
        await new Promise(res => { store.put(charReq).onsuccess = res })
        if (targetChar.settings) targetChar.settings.blacklistedUntil = null 
        if (unblockTimers[charId]) clearTimeout(unblockTimers[charId]) 
      }
      cleanText = cleanText.replace(/\[行为:提前解封\]/g, '').trim()
    }

    const replyMatch = cleanText.match(/<reply>([\s\S]*?)(?:<\/reply>|$)/i);
    if (replyMatch) {
      cleanText = replyMatch[1].trim(); 
    }

    cleanText = cleanText.replace(/[\(（\*].*?[\)）\*]/g, '').trim(); 
    cleanText = cleanText.replace(/^\s*\d+[\.、]\s*/gm, '').trim();

    let autoSplitText = cleanText.replace(/(\[STK:(?:.*?\|)?[^\]]+\])/g, '|||$1|||');
    autoSplitText = autoSplitText.replace(/\[发起转账:([\d\.]+)\|(.*?)\]/g, (match, amt, note) => {
        let tid = 'tr_' + Date.now() + Math.floor(Math.random()*1000);
        return `|||[TRANSFER:${tid}|${amt}|${note}|pending]|||`;
    });
    // --- 新增功能：拦截发文准备信号 替换为占位符 开始 ---
    autoSplitText = autoSplitText.replace(/\[行为:准备分享特刊\|(.*?)\]/g, '|||[MAGAZINE_LOADING:$1]|||');
    // --- 结束 ---

    let parts = autoSplitText.split('|||').map(p => p.trim()).filter(p => p);
    
    let availableCount = task.isFinished ? parts.length : parts.length - 1
    if (availableCount < 0) availableCount = 0
    
    if (task.chunksRendered < availableCount) {
      let chunkIndex = task.chunksRendered, chunkText = parts[chunkIndex]
      if (chunkText) {
        if (chunkIndex === 0 && thinkContent) chunkText = thinkContent + chunkText
        
        let visibleLength = chunkText.replace(/<think>[\s\S]*?<\/think>/gi, '').length
        let delay = Math.min(3500, Math.max(1200, visibleLength * 90))
        
        if (chunkIndex === 0) {
          await new Promise(res => setTimeout(res, delay))
          removeGlobalTyping()
        } else {
          let tempId = `temp_typing_${charId}_${chunkIndex}`
          if (props.isOpen && props.contact && props.contact.id === charId) {
            const wrapper = document.getElementById('chat-messages-wrapper')
            if (wrapper) {
              const tempRow = document.createElement('div')
              tempRow.id = tempId; tempRow.className = `chat-row char not-first`
              tempRow.innerHTML = `<div class="chat-avatar hidden"></div><div class="chat-bubble"><div class="typing-indicator" style="margin:0;"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`
              wrapper.appendChild(tempRow)
              const stream = document.getElementById('chat-stream-container')
              if (stream) stream.scrollTop = stream.scrollHeight
            }
          }
          await new Promise(res => setTimeout(res, delay))
          const tempEl = document.getElementById(tempId); if (tempEl) tempEl.remove();
        }

        let newMsgId = 'msg_' + Date.now() + '_' + Math.floor(Math.random()*1000)
        let newMsg = { id: newMsgId, sender: 'char', text: chunkText, time: Date.now() }
        
        const db = await initDB()
        const tx = db.transaction(['chat_history_db'], 'readwrite')
        const store = tx.objectStore('chat_history_db')
        const data = await new Promise(res => store.get(charId).onsuccess = e => res(e.target.result)) || { charId, messages: [] }
        
        data.messages.push(newMsg)
        await new Promise((res, rej) => { store.put(data).onsuccess = res; tx.onerror = rej })
        
        if (props.isOpen && props.contact && props.contact.id === charId) {
            currentChatHistory.value = data.messages
            currentLoadedCount.value = Math.min(data.messages.length, currentLoadedCount.value + 1)
            renderMessagesChunk(currentLoadedCount.value, false)
        }

        // --- 新增功能：占位符触发后台生成任务 开始 ---
        // --- 新增功能：占位符触发后台生成任务 开始 ---
        if (chunkText.startsWith('[MAGAZINE_LOADING:')) {
          const themeMatch = chunkText.match(/^\[MAGAZINE_LOADING:(.*?)\]$/)
          if (themeMatch) {
            setTimeout(async () => {
              try {
                const txAPI = db.transaction(['api_profiles'], 'readonly')
                const allApis = await new Promise(res => txAPI.objectStore('api_profiles').getAll().onsuccess = e => res(e.target.result || []))
                let api = allApis[0]
                if (!api) throw new Error("API未配置")
                
                const prompt = `你现在是《世界拼图》杂志主编。请生成一篇符合主题“${themeMatch[1]}”的专栏特刊。
必须且只能输出纯JSON，不能有markdown格式（如\`\`\`json），直接以 { 开始：
{ "issue": "第X封信·随机主题", "location": "一个有画面感的地点", "title": "文章主标题", "subtitle": "副标题", "envelopeSender": "寄件人署名", "handwrittenLetter": "手写信正文（约150字，第一人称）", "narrative": "一小段生活叙事", "goldenQuote": "优美的哲理金句", "fragments": ["短句1", "短句2", "短句3"], "profile": { "name": "姓名", "job": "职业", "desc": "一句话性格", "likes": "喜好1·喜好2" } }`

                const res = await fetch(api.url.replace(/\/+$/, '') + '/chat/completions', {
                  method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` },
                  body: JSON.stringify({ model: api.model, messages: [{ role: "user", content: prompt }], temperature: 0.9 })
                })
                const dataJSON = await res.json()
                
                // 修复2：更健壮的 JSON 截取，防止 AI 调皮加上 markdown 代码块标记
                const content = dataJSON.choices[0].message.content
                const startIndex = content.indexOf('{')
                const endIndex = content.lastIndexOf('}')
                if (startIndex === -1 || endIndex === -1) throw new Error("AI没有返回标准的JSON")
                const jsonStr = content.substring(startIndex, endIndex + 1)
                
                const hiddenData = `[MAGAZINE_SHARE:${encodeURIComponent(jsonStr)}]`
                
                const txUpdate = db.transaction(['chat_history_db'], 'readwrite')
                // 修复1：补充上丢失的 storeUpdate 声明，解决崩溃问题！
                const storeUpdate = txUpdate.objectStore('chat_history_db')
                const histUpdate = await new Promise(r => storeUpdate.get(charId).onsuccess = e => r(e.target.result))
                const targetMsg = histUpdate.messages.find(m => m.id === newMsgId)
                
                if (targetMsg) {
                  targetMsg.text = hiddenData
                  await new Promise(r => { storeUpdate.put(histUpdate).onsuccess = r })
                  if (props.isOpen && props.contact && props.contact.id === charId) {
                    currentChatHistory.value = histUpdate.messages
                    renderMessagesChunk(currentLoadedCount.value, false) // 设为 false 让其自动滚动到底部
                  }
                }
              } catch(e) {
                console.error("生成特刊失败：", e) // 打印错误方便排查
                const txFail = db.transaction(['chat_history_db'], 'readwrite')
                const storeFail = txFail.objectStore('chat_history_db')
                const histFail = await new Promise(r => storeFail.get(charId).onsuccess = e => r(e.target.result))
                const targetMsgFail = histFail.messages.find(m => m.id === newMsgId)
                if (targetMsgFail) {
                  targetMsgFail.text = "（哎呀，链接失效了，这篇特刊弄丢了...）"
                  storeFail.put(histFail)
                  if (props.isOpen && props.contact && props.contact.id === charId) {
                    // 修复3：失败时，也要更新屏幕绑定的变量，这样才会原地刷新！
                    currentChatHistory.value = histFail.messages
                    renderMessagesChunk(currentLoadedCount.value, false)
                  }
                }
              }
            }, 500)
          }
        }
        // --- 结束 ---

        task.chunksRendered++
      }
    } else {
      if (task.isFinished) { removeGlobalTyping(); break }
      await new Promise(res => setTimeout(res, 150))
    }
  }
  delete window.activeAITasks[charId]
}

// ==========================================
// 菜单、手势、更多面板 (保持不变)
// ==========================================
const openBubbleMenu = (msg, x, y) => { if (navigator.vibrate) navigator.vibrate(50); selectedMenuMsg = msg; isPopoverOpen.value = true; let fx = x, fy = y; if (x + 110 > window.innerWidth) fx = window.innerWidth - 120; if (y + 180 > window.innerHeight) fy = window.innerHeight - 190; popoverX.value = fx; popoverY.value = fy }
const handleMenuAction = async (action) => { 
  isPopoverOpen.value = false; 
  if (!selectedMenuMsg) return; 

  if (action === 'quote') {
    startQuote(selectedMenuMsg); 
  } else if (action === 'edit') { 
    let nt = prompt("✏️ 修改这条消息：", selectedMenuMsg.text); 
    if (nt && nt !== selectedMenuMsg.text) { 
      selectedMenuMsg.text = nt; 
      await updateDBSync(); 
      renderMessagesChunk(currentLoadedCount.value, true) 
    } 
  } else if (action === 'regenerate') { 
    if (selectedMenuMsg.sender !== 'char') return; 

    // 1. 找到被点击的消息的索引
    const targetId = selectedMenuMsg.id || selectedMenuMsg.time;
    const msgIndex = currentChatHistory.value.findIndex(m => (m.id || m.time) === targetId);
    
    if (msgIndex !== -1) {
      // 2. 往前找，找到 AI 这一波连发的开头
      let startIndex = msgIndex;
      while (startIndex > 0 && currentChatHistory.value[startIndex - 1].sender === 'char') {
        startIndex--;
      }
      
      // 3. 往后找，找到 AI 这一波连发的结尾
      let endIndex = msgIndex;
      while (endIndex < currentChatHistory.value.length - 1 && currentChatHistory.value[endIndex + 1].sender === 'char') {
        endIndex++;
      }
      
      // 4. 把这几条烂掉的消息文本拼起来，作为“错题本”反馈给 AI
      const badTextArray = [];
      for (let i = startIndex; i <= endIndex; i++) {
        badTextArray.push(currentChatHistory.value[i].text);
      }
      const badText = badTextArray.join(' '); // 拼成一整段话给AI做反面教材

      // 5. 把这一整波连发的消息彻底从数组里连锅端掉！
      const deleteCount = endIndex - startIndex + 1;
      currentChatHistory.value.splice(startIndex, deleteCount);
      currentLoadedCount.value = Math.max(0, currentLoadedCount.value - deleteCount);
      
      // 6. 同步数据库并刷新屏幕，这些旧气泡会瞬间消失，并且弹出加载动画
      await updateDBSync(); 
      renderMessagesChunk(currentLoadedCount.value, true); 
      
      // 7. 挂上带有多条错题的警告标签，然后重新召唤 AI 构思！
      props.contact._regenerateWarning = badText; 
      await triggerAIReply(); 
      delete props.contact._regenerateWarning; 
    }
  }else if (action === 'delete') { 
    isMultiSelectMode.value = true; 
    document.getElementById('chat-stream-container').classList.add('select-mode'); 
    document.getElementById('chat-input-bar').style.display = 'none'; 
    const targetId = selectedMenuMsg.id || selectedMenuMsg.time;
    const fr = document.querySelector(`.chat-row[data-msg-id="${targetId}"] .msg-checkbox`); 
    if (fr) window.toggleMsgCheck(fr, targetId) 
  } 
}
const startQuote = (msg) => { currentQuoteMsg.value = msg; quotePreviewText.value = msg.text.replace(/\[STK:.*?\]/g, '[图片]'); document.getElementById('chat-input').focus() }
const cancelQuote = () => { currentQuoteMsg.value = null }
const exitMultiSelectMode = () => { isMultiSelectMode.value = false; document.getElementById('chat-stream-container').classList.remove('select-mode'); document.getElementById('chat-input-bar').style.display = 'flex'; selectedMsgIdsForDelete.value.clear(); document.querySelectorAll('.msg-checkbox.checked').forEach(c => c.classList.remove('checked')) }
const confirmMultiDelete = async () => { if (selectedMsgIdsForDelete.value.size === 0) { exitMultiSelectMode(); return }; if (!confirm(`彻底删除选中的 ${selectedMsgIdsForDelete.value.size} 条消息吗？`)) return; currentChatHistory.value = currentChatHistory.value.filter(m => !selectedMsgIdsForDelete.value.has(m.id)); currentLoadedCount.value = Math.max(0, currentLoadedCount.value - selectedMsgIdsForDelete.value.size); await updateDBSync(); exitMultiSelectMode(); renderMessagesChunk(currentLoadedCount.value, true) }
const openMoreDrawer = () => { isStickerDrawerOpen.value = false; isMoreDrawerOpen.value = true }
const triggerImageUpload = () => { document.getElementById('chat-image-upload').click() }
const handleChatImageUpload = (e) => { const f = e.target.files[0]; if (!f) return; closeAllDrawers(); const r = new FileReader(); r.onload = (evt) => { const img = new Image(); img.onload = async () => { let w = img.width, h = img.height; if (w > h) { if (w > 800) { h *= 800/w; w = 800 } } else { if (h > 800) { w *= 800/h; h = 800 } }; const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); await saveMessageToDB('user', '[IMG:' + c.toDataURL('image/jpeg', 0.8) + ']') }; img.src = evt.target.result }; r.readAsDataURL(f); e.target.value = '' }
const openTxtImgPrompt = () => { closeAllDrawers(); txtImgInput.value = ''; isTxtImgInputOpen.value = true }
const sendTxtImg = async () => { if (txtImgInput.value.trim()) { await saveMessageToDB('user', `[TXT_IMG:${txtImgInput.value.trim()}]`); isTxtImgInputOpen.value = false } }
const voiceInputText = ref(''); let recognition = null, isRecognizing = ref(false)
const initSpeechRecognition = () => { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { alert("不支持语音识别。"); return false }; recognition = new SR(); recognition.lang = 'zh-CN'; recognition.interimResults = true; recognition.continuous = true; let base = ""; recognition.onstart = () => { isRecognizing.value = true; base = voiceInputText.value; document.getElementById('voice-status-text').innerText = "正在倾听中..." }; recognition.onresult = (e) => { let i = "", f = ""; for (let j = e.resultIndex; j < e.results.length; ++j) { if (e.results[j].isFinal) f += e.results[j][0].transcript; else i += e.results[j][0].transcript }; voiceInputText.value = base + f + i }; recognition.onerror = () => { isRecognizing.value = false }; recognition.onend = () => { isRecognizing.value = false }; return true }
const toggleSpeechRecognition = () => { if (!recognition && !initSpeechRecognition()) return; if (isRecognizing.value) recognition.stop(); else recognition.start() }
const openVoiceDrawer = () => { closeAllDrawers(); isVoiceDrawerOpen.value = true; voiceInputText.value = ''; document.getElementById('voice-status-text').innerText = "点击麦克风录音" }
const closeVoiceDrawer = () => { if (isRecognizing.value) recognition.stop(); isVoiceDrawerOpen.value = false }
const sendVoiceMessage = async () => { const t = voiceInputText.value.trim(); if (!t) return; const d = Math.max(1, Math.min(60, Math.ceil(t.length/3))); closeVoiceDrawer(); await saveMessageToDB('user', `[VOICE:${d}|${t}]`) }
const stickerSearch = ref(''), stickerScope = ref('global'), stickerCat = ref('默认分类'), allStickers = ref([]), filteredStickers = ref([]), hasExclusiveStickers = ref(false), dynamicStickerCats = ref([])
const openStickerDrawer = () => { closeAllDrawers(); isStickerDrawerOpen.value = true; stickerSearch.value = ''; loadStickers() }
const closeStickerDrawer = () => { isStickerDrawerOpen.value = false }
const loadStickers = async () => { const db = await initDB(); db.transaction(['emoticons_db'], 'readonly').objectStore('emoticons_db').getAll().onsuccess = (e) => { const list = e.target.result || []; allStickers.value = list.filter(s => s.scope === 'global' || s.scope === props.contact?.id); hasExclusiveStickers.value = allStickers.value.some(s => s.scope === props.contact?.id); const valid = allStickers.value.filter(s => stickerScope.value === 'global' ? true : s.scope === stickerScope.value); let cats = ['默认分类', ...new Set(valid.map(s => s.category || '默认分类'))]; dynamicStickerCats.value = [...new Set(cats)].filter(c => c !== '默认分类'); filterStickers() } }
const switchStickerTab = (scope, cat) => { stickerScope.value = scope; stickerCat.value = cat; loadStickers() }
const filterStickers = () => { const kw = stickerSearch.value.toLowerCase().trim(); filteredStickers.value = allStickers.value.filter(s => { if (stickerScope.value !== 'global' && s.scope !== stickerScope.value) return false; const sc = s.category || '默认分类'; if (stickerCat.value === '默认分类' && sc !== '默认分类') return false; if (stickerCat.value !== '默认分类' && sc !== stickerCat.value) return false; if (kw && !s.name.toLowerCase().includes(kw)) return false; return true }) }
const sendSticker = async (s) => { closeStickerDrawer(); await saveMessageToDB('user', `[STK:${s.name}|${s.url}]`) }


// ==========================================
// 表情包管理中心引擎
// ==========================================
const isStickerManageOpen = ref(false)
const newStickerScope = ref('global')
const newStickerCat = ref('')
const tempParsedStickers = ref([])

const openStickerManageModal = () => {
  isStickerManageOpen.value = true
  tempParsedStickers.value = []
  newStickerScope.value = 'global'
  newStickerCat.value = ''
  // 为了防止双重遮挡，打开齿轮弹窗时先收起半屏的表情抽屉
  isStickerDrawerOpen.value = false 
}

const closeStickerManageModal = () => {
  isStickerManageOpen.value = false
}

const triggerStickerUpload = () => {
  document.getElementById('sticker-file-upload').click()
}

const handleStickerFileUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  const scope = newStickerScope.value
  const cat = newStickerCat.value.trim() || '默认分类'
  
      const reader = new FileReader()
      reader.onload = async (evt) => {
        let rawText = ""
        
        // --- 新增功能：自动加载 mammoth 插件，确保 Word(.docx) 完美解析 开始 ---
        if (file.name.endsWith('.docx')) {
          // 如果系统没自带 mammoth，自动帮你静默加载
          if (!window.mammoth) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script')
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js'
              script.onload = resolve
              script.onerror = () => { alert("网络异常，无法加载 Word 解析库！"); reject() }
              document.head.appendChild(script)
            })
          }
          try {
            const result = await window.mammoth.extractRawText({ arrayBuffer: evt.target.result })
            rawText = result.value || ""
          } catch(err) {
            alert("Word解析失败，请确保文件正常。")
            return
          }
        } else {
          rawText = evt.target.result || ""
          // 强制转为字符串，绝对防止 txt/json 触发 split 崩溃
          if (typeof rawText !== 'string') rawText = String(rawText)
        }
        // --- 结束 ---

        const lines = rawText.split('\n')
        const urlRegex = /(https?:\/\/[^\s]+)/
    let parsed = []
    
    lines.forEach(line => {
      const match = line.match(urlRegex)
      if (match) {
        const url = match[1]
        let name = line.replace(url, '').replace(/[,，:：\s]/g, '').trim()
        if (!name) name = "表情"
        parsed.push({ id: 'stk_' + Date.now() + Math.random(), name, url, category: cat, scope })
      }
    })

    if (parsed.length > 0) {
      tempParsedStickers.value = parsed
    } else {
      alert("没有在文件里找到合法的图片链接哦！")
    }
  }
  
  if (file.name.endsWith('.docx')) reader.readAsArrayBuffer(file)
  else reader.readAsText(file)
  
  e.target.value = ''
}

const confirmSaveStickers = async () => {
  if (tempParsedStickers.value.length === 0) return
  const db = await initDB()
  const tx = db.transaction(['emoticons_db'], 'readwrite')
  const store = tx.objectStore('emoticons_db')
  
  tempParsedStickers.value.forEach(s => store.put(JSON.parse(JSON.stringify(s))))
  
  tx.oncomplete = () => {
    alert(`✅ 成功为你保存了 ${tempParsedStickers.value.length} 张表情！`)
    tempParsedStickers.value = []
    loadStickers()
  }
}

const deleteCurrentStickerCat = async () => {
  const targetScope = stickerScope.value
  const targetCat = stickerCat.value
  if (!confirm(`危险！确定要清空【${targetScope === 'global' ? '默认' : '专属'} - ${targetCat}】分类下的所有表情吗？`)) return
  
  const db = await initDB()
  const tx = db.transaction(['emoticons_db'], 'readwrite')
  const store = tx.objectStore('emoticons_db')
  
  store.getAll().onsuccess = (e) => {
    const list = e.target.result || []
    list.forEach(s => {
      const sCat = s.category || '默认分类'
      if (s.scope === targetScope && sCat === targetCat) {
        store.delete(s.id)
      }
    })
    tx.oncomplete = () => {
      alert("清理完成！")
      closeStickerManageModal()
      loadStickers()
    }
  }
}
</script>

<style scoped>
/* 严格复刻 CSS (保持不变) */
#chat-room-app { 
  position: absolute; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%; 
  background: linear-gradient(135deg, #e6eff5 0%, #d4e0eb 100%); 
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  z-index: 80; 
  display: flex; 
  flex-direction: column; 
  transform: translateY(100%); 
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); 
}
#chat-room-app.active { 
  transform: translateY(0); 
}
.chat-capsule-header { position: absolute; top: max(40px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); width: 90%; height: 50px; background: rgba(255,255,255,0.7); backdrop-filter: blur(15px); border-radius: 25px; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); z-index: 85; border: 1px solid rgba(255,255,255,0.5); }
.capsule-btn { font-size: 18px; font-weight: bold; color: #5b6d82; cursor: pointer; }
.capsule-title { font-size: 15px; font-weight: bold; color: #000; }
.chat-stream { flex: 1; overflow-y: auto; padding: 100px 15px 120px 15px; display: flex; flex-direction: column; gap: 4px; }
:deep(.chat-time-stamp) { text-align: center; font-size: 11px; color: rgba(0,0,0,0.4); margin: 15px 0 8px 0; }
:deep(.chat-row) { display: flex; align-items: flex-end; width: 100%; margin-bottom: 2px; position: relative; transition: transform 0.3s; }
:deep(.chat-row.user) { justify-content: flex-end; }
:deep(.chat-row.char) { justify-content: flex-start; }
:deep(.chat-row.first-msg) { margin-top: 12px; }
:deep(.chat-avatar) { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; position: relative; }
:deep(.chat-avatar.hidden) { opacity: 0; }
:deep(.cot-dot) { position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; background: #07c160; border: 2px solid #fff; border-radius: 50%; cursor: pointer; z-index: 10; animation: pulseDot 2s infinite; }
@keyframes pulseDot { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(7, 193, 96, 0.5); } 70% { transform: scale(1.05); box-shadow: 0 0 0 5px rgba(7, 193, 96, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(7, 193, 96, 0); } }
:deep(.chat-bubble) { max-width: 70%; padding: 10px 14px; font-size: 14px; line-height: 1.4; color: #000; background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid rgba(255,255,255,0.4); word-wrap: break-word; white-space: pre-wrap; user-select: none; }
:deep(.chat-row.char .chat-bubble) { border-radius: 18px 18px 18px 4px; margin-left: 8px; }
:deep(.chat-row.user .chat-bubble) { border-radius: 18px 18px 4px 18px; margin-right: 8px; background: rgba(255,255,255,0.9); }
:deep(.chat-row.not-first .chat-bubble) { border-radius: 18px; }
:deep(.chat-bubble.image-only) { background: transparent !important; box-shadow: none !important; border: none !important; padding: 0 !important; }
:deep(.typing-indicator) { display: flex; gap: 4px; align-items: center; justify-content: center; height: 18px; padding: 2px 4px; }
:deep(.typing-dot) { width: 5px; height: 5px; background: var(--icon-svg-color); border-radius: 50%; opacity: 0.5; animation: typingJump 1.4s infinite ease-in-out both; }
:deep(.typing-dot:nth-child(1)) { animation-delay: -0.32s; }
:deep(.typing-dot:nth-child(2)) { animation-delay: -0.16s; }
@keyframes typingJump { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-4px); opacity: 1; } }
/* --- 绝美原生语音气泡 CSS --- */
:deep(.voice-bubble-content) { display: flex; align-items: center; min-width: 60px; cursor: pointer; }
:deep(.voice-icon) { display: flex; align-items: center; color: #5b6d82; }
:deep(.voice-icon-svg) { width: 20px; height: 20px; }
:deep(.voice-duration) { font-size: 14px; font-weight: bold; color: #555; }
/* 转文字：复用翻译级冰川蓝小字，无虚线，极致高级 */
:deep(.voice-transcribed-text) { display: none; font-size: 11.5px; color: #7a94a9; margin-top: 6px; padding-top: 6px; white-space: pre-wrap; word-wrap: break-word; line-height: 1.4; }
:deep(.voice-transcribed-text.show) { display: block; }
:deep(.voice-bubble-wide) { width: var(--voice-width, 80px); }
.quote-banner { position: absolute; bottom: 100%; left: 6%; width: 88%; background: rgba(245, 247, 250, 0.95); backdrop-filter: blur(20px); border-top-left-radius: 16px; border-top-right-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.8); border-bottom: none; padding: 8px 14px; font-size: 11px; color: var(--icon-svg-color); display: flex; justify-content: space-between; align-items: center; transform: translateY(100%); opacity: 0; pointer-events: none; z-index: 2; transition: 0.3s, opacity 0.2s; }
.quote-banner.active { opacity: 1; pointer-events: auto; transform: translateY(0); margin-bottom: 6px; }
.quote-text { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-left: 2.5px solid var(--icon-svg-color); padding-left: 8px; font-weight: 500; }
.quote-close { font-size: 16px; color: #aaa; cursor: pointer; padding: 4px 8px; font-weight: bold; }
:deep(.reply-quote-box) { font-size: 11px; color: #666; background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 6px; margin-bottom: 6px; border-left: 2px solid var(--icon-svg-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chat-input-bar { width: 100%; display: flex; align-items: center; padding: 6px 12px; background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.6); box-shadow: 0 5px 20px rgba(0,0,0,0.08); gap: 8px; z-index: 1; }
.chat-svg-btn { width: 28px; height: 28px; display: flex; justify-content: center; align-items: center; color: #555; cursor: pointer; flex-shrink: 0; }
.chat-svg-btn svg { width: 22px; height: 22px; }
.chat-input-field { flex: 1; height: 36px; border-radius: 18px; border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.5); padding: 0 12px; font-size: 14px; outline: none; color: #000; min-width: 0; }
.bubble-popover { position: fixed; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); box-shadow: 0 5px 20px rgba(0,0,0,0.15); border-radius: 12px; display: none; flex-direction: column; z-index: 100; overflow: hidden; min-width: 110px; border: 1px solid rgba(0,0,0,0.05); }
.bubble-popover.active { display: flex; animation: popIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
@keyframes popIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
.popover-item { padding: 12px 16px; font-size: 14px; color: #333; cursor: pointer; border-bottom: 1px solid rgba(0,0,0,0.03); text-align: center; }
.popover-item:last-child { border-bottom: none; color: #ff3b30; }
:deep(.msg-checkbox) { position: absolute; left: -40px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; border: 1px solid #ccc; background: #fff; display: flex; justify-content: center; align-items: center; opacity: 0; transition: 0.3s; }
.chat-stream.select-mode :deep(.chat-row) { transform: translateX(45px); }
.chat-stream.select-mode :deep(.msg-checkbox) { opacity: 1; }
:deep(.msg-checkbox.checked) { background: #ff3b30; border-color: #ff3b30; }
:deep(.msg-checkbox.checked::after) { content: '✔'; color: #fff; font-size: 12px; font-weight: bold; }
.multi-select-bar { position: absolute; bottom: 0; left: 0; width: 100%; height: max(60px, calc(env(safe-area-inset-bottom) + 50px)); background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); display: none; justify-content: space-between; align-items: center; padding: 0 20px; padding-bottom: env(safe-area-inset-bottom); box-shadow: 0 -5px 20px rgba(0,0,0,0.08); z-index: 90; }
.multi-select-bar.active { display: flex; }
.ms-btn { font-size: 15px; font-weight: bold; cursor: pointer; padding: 10px; }
.ms-cancel { color: #888; }
.ms-delete { color: #ff3b30; }
#more-drawer, #voice-drawer, #sticker-drawer { position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(245, 247, 250, 0.95); backdrop-filter: blur(25px); border-top-left-radius: 20px; border-top-right-radius: 20px; box-shadow: 0 -5px 25px rgba(0,0,0,0.08); z-index: 88; display: flex; flex-direction: column; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); padding-bottom: max(15px, env(safe-area-inset-bottom)); }
#more-drawer.active, #voice-drawer.active, #sticker-drawer.active { transform: translateY(0); }
.more-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px 10px; padding: 25px 20px 10px 20px; }
.more-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
.more-icon-box { width: 48px; height: 48px; border-radius: 14px; background: rgba(255, 255, 255, 0.9); border: 1px solid rgba(0,0,0,0.04); display: flex; justify-content: center; align-items: center; color: var(--icon-svg-color); box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
.more-text { font-size: 11px; color: #777; font-weight: 500; }
.hidden-input { display: none; }
#voice-drawer { align-items: center; padding-top: 25px; }
.sticker-header { display: flex; padding: 12px 15px 5px 15px; gap: 10px; align-items: center; }
.sticker-search { flex: 1; height: 32px; border-radius: 16px; border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.7); padding: 0 15px; outline: none; font-size: 13px; }
.sticker-close { font-size: 20px; color: #888; cursor: pointer; padding: 0 5px; }
.sticker-tabs { display: flex; align-items: center; padding: 5px 15px 10px 15px; gap: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); overflow-x: auto; scrollbar-width: none; }
.sticker-tabs::-webkit-scrollbar { display: none; }
.st-tab { padding: 6px 12px; font-size: 12px; font-weight: bold; color: #888; background: rgba(255,255,255,0.5); border-radius: 15px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.st-tab.active { color: var(--icon-svg-color); background: rgba(255,255,255,0.9); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

/* --- 新增功能：锁死表情包区域最大高度，防止撑满全屏 开始 --- */
.sticker-body { 
  flex: 1; 
  overflow-y: auto; 
  padding: 10px 15px; 
  height: 250px; 
  max-height: 40vh; /* 强制最高只能占屏幕的 40% */
}
/* --- 结束 --- */

.sticker-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.sticker-item { width: 100%; aspect-ratio: 1/1; border-radius: 10px; cursor: pointer; background-color: rgba(0,0,0,0.03); position: relative; overflow: hidden;}
.sticker-item img { width: 100%; height: 100%; object-fit: contain; }
.sticker-item-name { position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(0,0,0,0.4); color: #fff; font-size: 10px; text-align: center; padding: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ==========================================
   自定义弹窗 CSS 样式 (杀虫修复版)
   ========================================== */
.modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
  background: rgba(0, 0, 0, 0.4); 
  backdrop-filter: none; 
  z-index: 999; display: flex; justify-content: center; align-items: center; 
  opacity: 0; 
  visibility: hidden; 
  transition: opacity 0.3s, visibility 0.3s; 
}
.modal-overlay.active { 
  opacity: 1; 
  visibility: visible; 
}
.modal-box { 
  background: #ffffff; 
  border-radius: 20px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); 
  transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); 
  text-align: center; 
}
.modal-overlay.active .modal-box { transform: scale(1); }
.modal-title { font-size: 16px; font-weight: bold; margin-bottom: 16px; }
.setting-textarea { width: 100%; padding: 12px; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; outline: none; resize: none; background: rgba(255,255,255,0.8); color: var(--app-text-color); line-height: 1.5; }
.modal-buttons { display: flex; gap: 12px; justify-content: center; }
.modal-btn { flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: bold; cursor: pointer; }
.cancel-btn { background: rgba(0,0,0,0.05); color: #666; }
.confirm-btn { background: var(--icon-svg-color); color: #fff; }
.st-manage-btn { padding: 6px; font-size: 14px; background: rgba(0,0,0,0.05); border-radius: 50%; cursor: pointer; flex-shrink: 0; }

/* ==========================================
   🎙️ 冰川蓝+横向排版版 语音通话全息界面 CSS
   ========================================== */
.call-screen-overlay.light-theme {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 100; display: flex; flex-direction: column;
  transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden; 
  background: linear-gradient(135deg, #e6eff5 0%, #d4e0eb 100%); 
  font-family: system-ui, sans-serif; user-select: none;
}
.call-screen-overlay.light-theme.active { transform: translateY(0); }
.call-bg-light { position: absolute; inset: 0; background: transparent; z-index: 1; }

/* 顶部：横向左右排版 */
.call-top-row {
  position: relative; z-index: 2; display: flex; align-items: center; gap: 20px;
  padding: max(50px, env(safe-area-inset-top)) 30px 10px 30px;
}
/* 左侧头像区 */
.call-avatar-wrapper { position: relative; width: 70px; height: 70px; flex-shrink: 0; }
.call-avatar-pulse {
  position: absolute; inset: -4px; border-radius: 50%; background: rgba(255,255,255,0.5);
  animation: softPulse 3s ease-in-out infinite; z-index: -1;
}
.call-avatar-inner {
  width: 100%; height: 100%; border-radius: 50%; background-color: #f1f5f9;
  border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  background-size: cover; background-position: center;
}

/* 右侧信息区 */
.call-info-right { display: flex; flex-direction: column; justify-content: center; }
.call-char-name-light { font-size: 19px; color: #334155; font-weight: bold; margin-bottom: 4px; letter-spacing: 0.5px; }
.call-status-line { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.call-status-text { font-size: 13px; color: #7a94a9; }
.call-timer-text { font-size: 14px; color: #5b6d82; font-family: monospace; font-weight: bold; letter-spacing: 1px; }

/* 音频波动条 */
.call-audio-waves { display: flex; gap: 3px; align-items: flex-end; height: 16px; }
.audio-wave { width: 3px; border-radius: 3px; background: #94a3b8; animation: wave 1.8s ease-in-out infinite; }
.wave-delay-1 { animation-delay: 0.2s; }
.wave-delay-2 { animation-delay: 0.4s; }
.wave-delay-3 { animation-delay: 0.6s; }

@keyframes wave { 0%, 100% { height: 6px; } 50% { height: 16px; } }
@keyframes softPulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 0; } }

/* 中间大区域：左右气泡排版 */
.call-chat-area-light {
  flex: 1; position: relative; z-index: 2; width: 100%; padding: 15px 20px;
  overflow-y: auto; display: flex; flex-direction: column; gap: 15px; scrollbar-width: none;
}
.call-chat-area-light::-webkit-scrollbar { display: none; }

.call-msg-row-light { display: flex; width: 100%; }
.call-msg-row-light.user { justify-content: flex-end; }
.call-msg-row-light.char { justify-content: flex-start; }

.call-bubble-light {
  padding: 10px 16px; border-radius: 18px; font-size: 15px; max-width: 80%;
  line-height: 1.5; word-wrap: break-word; white-space: pre-wrap; box-shadow: 0 4px 15px rgba(0,0,0,0.04);
}
.call-msg-row-light.char .call-bubble-light {
  background: rgba(255, 255, 255, 0.95); color: #334155; border: 1px solid rgba(255, 255, 255, 0.6);
  border-bottom-left-radius: 4px; backdrop-filter: blur(10px);
}
.call-msg-row-light.user .call-bubble-light {
  background: #e0f2fe; color: #0f172a; border: 1px solid #bae6fd; 
  border-bottom-right-radius: 4px;
}

/* 底部操作区 */
.call-bottom-wrapper { position: relative; z-index: 2; padding: 10px 30px max(30px, env(safe-area-inset-bottom)) 30px; }

/* 优雅的输入胶囊 */
.call-input-capsule {
  background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px); border-radius: 24px; padding: 6px 12px; display: none;
  align-items: center; gap: 10px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.call-input-capsule.active { display: flex; animation: slideUpLight 0.3s cubic-bezier(0.25,0.8,0.25,1); }
@keyframes slideUpLight { 0% { transform: translateY(15px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }

.call-input-light { flex: 1; height: 36px; border: none; outline: none; background: transparent; font-size: 14px; color: #334155; }
.call-input-light::placeholder { color: #94a3b8; }

.call-send-btn { background: #38bdf8; color: #fff; padding: 6px 16px; border-radius: 16px; font-size: 13px; font-weight: bold; cursor: pointer; }

/* 底部三大金刚键 */
.call-controls-light { display: flex; justify-content: space-around; align-items: center; }
.call-btn-light {
  width: 60px; height: 60px; border-radius: 50%; background: rgba(255, 255, 255, 0.9);
  display: flex; justify-content: center; align-items: center; cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.5); outline: none; transition: transform 0.2s, background 0.2s;
  backdrop-filter: blur(10px);
}
.call-btn-light:hover, .call-btn-light:active { background: #ffffff; transform: scale(0.95); }
.call-btn-danger {
  width: 60px; height: 60px; border-radius: 50%; background: #fb7185; 
  display: flex; justify-content: center; align-items: center; cursor: pointer;
  border: none; outline: none; transition: transform 0.2s, background 0.2s;
}
.call-btn-danger:hover, .call-btn-danger:active { background: #f43f5e; transform: scale(0.95); }
.shadow-btn { box-shadow: 0 4px 15px rgba(0,0,0,0.08); }

/* ==========================================
   🎞️ 视觉小说视频通话全息界面 CSS
   ========================================== */
.video-screen-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 105; display: flex; flex-direction: column; justify-content: space-between;
  background: #000; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden; user-select: none;
}
.video-screen-overlay.active { transform: translateY(0); }

/* 背景全覆盖，不模糊不发暗 */
.video-bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  background-color: #000; background-size: cover; background-position: center;
  z-index: 1;
}

/* 顶部控件栏 */
.video-top-bar {
  position: relative; z-index: 3; display: flex; justify-content: space-between; align-items: flex-start;
  padding: max(45px, env(safe-area-inset-top)) 20px 0 20px;
}
.video-icon-btn {
  width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);
  display: flex; justify-content: center; align-items: center; cursor: pointer; backdrop-filter: blur(5px);
}

/* 右上角画中画 PiP */
.video-pip-window {
  position: relative; width: 85px; height: 120px; border-radius: 12px; background: #222;
  border: 1px solid rgba(255,255,255,0.3); overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  cursor: pointer; transition: transform 0.2s;
}
.video-pip-window:active { transform: scale(0.95); }
#video-local-video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); /* 镜像翻转 */ }
.video-pip-avatar { width: 100%; height: 100%; background-size: cover; background-position: center; }
.video-pip-switch {
  position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.6);
  border-radius: 50%; padding: 4px; display: flex;
}

/* 立绘伪 3D 呼吸引擎 */
.video-char-layer {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 85%;
  display: flex; justify-content: center; align-items: flex-end; z-index: 2; pointer-events: none;
}
.video-char-art {
  max-width: 150%; max-height: 100%; object-fit: contain;
  animation: pseudo3DBreath 6s infinite ease-in-out;
  transform-origin: bottom center;
}
@keyframes pseudo3DBreath {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.02) translateY(-10px); }
}

/* 底部输入框 */
.video-input-capsule {
  position: absolute; bottom: 250px; left: 50%; transform: translateX(-50%) translateY(20px); width: 85%;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.2);
  border-radius: 20px; padding: 6px 12px; display: none; align-items: center; gap: 10px; z-index: 5; opacity: 0;
}
.video-input-capsule.active { display: flex; animation: fadeUpVN 0.3s forwards; }
@keyframes fadeUpVN { to { transform: translateX(-50%) translateY(0); opacity: 1; } }
.video-input-field { flex: 1; height: 36px; background: transparent; border: none; outline: none; color: #fff; font-size: 14px; }
.video-send-btn { background: #5b6d82; color: #fff; padding: 6px 14px; border-radius: 14px; font-size: 13px; cursor: pointer; }

/* 🍊 橙光游戏式底部对话框 */
.vn-dialog-container {
  position: relative; z-index: 4; width: 92%; margin: 0 auto max(20px, env(safe-area-inset-bottom)) auto;
  min-height: 140px; background: linear-gradient(180deg, rgba(20,20,20,0.7) 0%, rgba(0,0,0,0.95) 100%);
  border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 20px;
  box-shadow: 0 -5px 30px rgba(0,0,0,0.3); backdrop-filter: blur(10px);
}

/* ==============================
   橙光对话框 头部布局 (左右对齐)
   ============================== */
.vn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px; /* 统一控制与下方文字的间距 */
}

/* 左侧：名字标签 */
.vn-name-label {
  font-size: 18px; font-weight: bold; color: #fff; text-shadow: 1px 1px 2px #000;
  letter-spacing: 1px; border-left: 3px solid #ccc; padding-left: 8px;
}


/* ==============================
   橙光对话框 头部布局 (左右对齐)
   ============================== */
.vn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px; 
}

/* 名字标签 */
.vn-name-label {
  font-size: 18px; font-weight: bold; color: #fff; text-shadow: 1px 1px 2px #000;
  letter-spacing: 1px; border-left: 3px solid #ccc; padding-left: 8px;
}

/* 🏆 【关键修复】：按钮组容器，必须加上 display: flex 才能横向排列！ */
.vn-btn-group {
  display: flex; 
  align-items: center;
  gap: 4px; /* 按钮之间的间距 */
}

/* 维持迷你的外框绝对不动 */
.vn-log-btn {
  background: rgba(0,0,0,0.8);
  border: 1px solid rgba(255,255,255,0.2); 
  color: #ccc; 
  border-radius: 6px; 
  padding: 2px 5px;   /* 极小的内边距，维持迷你身材 */
  display: flex; 
  align-items: center; 
  gap: 3px; 
  cursor: pointer; 
  transition: 0.2s;
  
  /* 🏆 【关键修复】：强制字和图标在一行，绝对不允许竖着掉下去 */
  white-space: nowrap; 

  /* 字体进一步缩小 */
  font-size: 8px; 
}

/* 强制把里面的 SVG 图标放大 (在迷你外框里显得更饱满) */
.vn-log-btn svg {
  width: 12px !important; 
  height: 12px !important;
  flex-shrink: 0; /* 保证图标绝对不会被挤压变形 */
}

.vn-log-btn:active { 
  transform: scale(0.95); 
  background: rgba(255,255,255,0.2); 
}

/* 文字显示区 */
.vn-text-content {
  font-size: 16px; color: #fff; line-height: 1.6; text-shadow: 1px 1px 2px #000;
  height: 75px; overflow-y: hidden; display: block; 
  word-wrap: break-word; white-space: pre-wrap; cursor: pointer; position: relative;
}

/* 橙光专属等待闪烁三角 */
.vn-next-indicator {
  display: inline-block; margin-left: 8px; color: #fff; font-size: 14px;
  animation: vnBlink 1s infinite;
}
@keyframes vnBlink { 
  0%, 100% { opacity: 1; transform: translateY(0); } 
  50% { opacity: 0.2; transform: translateY(3px); } 
}

/* 底部输入框内的小麦克风 */
.video-mic-btn {
  color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px;
}
@keyframes softPulseMic { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
.video-mic-btn.active { color: #38bdf8; animation: softPulseMic 1s infinite; }


/* ==========================================
   📍 手绘风动画定位卡片 CSS (极致瘦身精致版)
   ========================================== */
:deep(.location-card) {
  width: 200px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: #e0f2fe; 
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  border: 1px solid rgba(255,255,255,0.6);
  display: flex;
  flex-direction: column;

  /* 🏆 【魔法修复】：通过负向的下边距，强行把卡片往下“拽”一点（或者说是把底部往下撑），
     这样它的顶部就会正好落下来，和 36px 的头像顶部持平！ */
  margin-bottom: -35px; /* 如果还是没平齐，你可以微调这个数字，比如 -8px 或 -12px */
  margin-top: -35px
}
:deep(.loc-map-bg) {
  flex: 1;
  position: relative;
  background-image: radial-gradient(#bae6fd 1px, transparent 1px);
  background-size: 10px 10px;
  overflow: hidden;
}

:deep(.loc-cloud) {
  position: absolute;
  width: 35px; height: 12px;
  background: rgba(255,255,255,0.9);
  border-radius: 10px;
  animation: floatCloud 8s linear infinite;
}
:deep(.cloud-1) { top: 10px; left: -50px; animation-duration: 14s; }
:deep(.cloud-2) { top: 30px; left: -50px; animation-duration: 10s; animation-delay: 4s; transform: scale(0.8); }
@keyframes floatCloud { to { transform: translateX(250px); } }

/* 蜿蜒小路也要压缩 */
:deep(.loc-route) {
  position: absolute;
  bottom: 0px; left: -10%; width: 120%; height: 20px;
  border-bottom: 2px dashed #fff;
  border-radius: 50%;
  transform: rotate(-3deg);
}

:deep(.loc-pin) {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -40%); /* 微调位置 */
  display: flex; flex-direction: column; align-items: center;
  animation: jumpPin 1.5s ease-in-out infinite;
}
@keyframes jumpPin {
  0%, 100% { transform: translate(-50%, -30%); }
  50% { transform: translate(-50%, -60%); }
}

:deep(.loc-pin-shadow) {
  width: 10px; height: 3px;
  background: rgba(0,0,0,0.15);
  border-radius: 50%;
  margin-top: 2px;
  animation: shadowScale 1.5s ease-in-out infinite;
}
@keyframes shadowScale {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.6); opacity: 0.3; }
}

/* 底部文字栏也要变精致 */
:deep(.loc-banner) {
  height: 30px; /* 变窄 */
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 4px;
  border-top: 1px solid rgba(255,255,255,0.5);
}
:deep(.loc-icon) { 
  display: flex; 
  align-items: center; 
}
:deep(.loc-icon svg) {
  width: 13px !important;
  height: 13px !important;
}
:deep(.loc-text) {
  font-size: 11.5px; /* 字体稍微缩秀气一点 */
  font-weight: bold;
  color: #5b6d82;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


/* ==========================================
   👀 已读/未读 状态小尾巴 CSS (强制微缩穿透版)
   ========================================== */
:deep(.msg-read-status) {
  /* 表面设为 12px，规避浏览器限制 */
  font-size: 12px; 
  line-height: 1;
  padding: 3px 6px;
  border-radius: 8px;
  margin-right: 2px;
  margin-bottom: 2px;
  align-self: flex-end; 
  white-space: nowrap;
  
  /* 🏆 核心魔法：强制将整个元素缩小到 70%！相当于 8.4px 的字号 */
  transform: scale(0.75);
  transform-origin: right bottom; /* 以右下角为基准缩放，贴紧气泡 */
  transition: all 0.4s ease;
}

/* 未读状态：极浅的灰色底，淡淡的灰字 */
:deep(.read-status-unread) {
  background: rgba(0, 0, 0, 0.04);
  color: #080808;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* 已读状态：淡淡的冰川蓝底，清晰的蓝字 */
:deep(.read-status-read) {
  background: rgba(56, 189, 248, 0.1);
  color: #0284c7; 
  border: 1px solid rgba(56, 189, 248, 0.2);
  font-weight: bold;
}

/* ==========================================
   📞 AI 主动来电横幅 (无遮罩悬浮)
   ========================================== */
.incoming-call-banner {
  position: absolute;
  top: max(30px, env(safe-area-inset-top));
  left: 5%; width: 90%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  padding: 12px 16px;
  display: flex; justify-content: space-between; align-items: center;
  z-index: 999; /* 置于顶层但不全屏 */
  transform: translateY(-150%);
  opacity: 0; pointer-events: none;
  transition: all 0.5s cubic-bezier(0.25, 1.2, 0.25, 1);
  border: 1px solid rgba(0,0,0,0.05);
}
.incoming-call-banner.active {
  transform: translateY(0);
  opacity: 1; pointer-events: auto;
}

.ic-left { display: flex; align-items: center; gap: 12px; }
.ic-avatar { width: 44px; height: 44px; border-radius: 50%; background-size: cover; background-position: center; border: 1px solid rgba(0,0,0,0.05); }
.ic-info { display: flex; flex-direction: column; }
.ic-name { font-size: 15px; font-weight: bold; color: #333; }
.ic-desc { font-size: 12px; color: #888; margin-top: 2px; }

.ic-right { display: flex; gap: 12px; }
.ic-btn {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; justify-content: center; align-items: center; cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1); transition: 0.2s;
}
.ic-btn:active { transform: scale(0.9); }
/* 拒绝键：番茄红 */
.ic-btn.reject { background: #ff4757; }
/* 接听键：草木绿 */
.ic-btn.accept { background: #2ed573; animation: callPulse 2s infinite; }

@keyframes callPulse {
  0% { box-shadow: 0 0 0 0 rgba(46, 213, 115, 0.5); }
  70% { box-shadow: 0 0 0 10px rgba(46, 213, 115, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 213, 115, 0); }
}
/* ==========================================
   💌 邮箱提醒 (无外框极简药丸风)
   ========================================== */
:deep(.mail-alert-pill) {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.35); /* 极度透明，拒绝大白框 */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 6px 14px;
  margin: 15px 0;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.4); /* 若有若无的玻璃反光边界 */
}

:deep(.mail-alert-pill:active) {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.6);
}

:deep(.mail-pill-icon) {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

:deep(.mail-pill-content) {
  display: flex;
  align-items: center;
  gap: 6px;
}

:deep(.mail-pill-title) {
  font-size: 12px;
  font-weight: bold;
  color: #5b6d82; /* 冰川蓝字 */
}

:deep(.mail-pill-desc) {
  font-size: 11px;
  color: #94a3b8;
}

:deep(.mail-pill-arrow) {
  margin-left: 8px;
  font-size: 16px;
  color: #94a3b8;
  line-height: 1;
  margin-top: -2px;
}

/* ==========================================
   💸 简约 INS 线条风 转账卡片 CSS (小巧、文字上下两行、自动对齐版)
   ========================================== */
:deep(.transfer-card) {
  width: 210px; /* 控制在屏幕的60%左右 */
  max-width: 100%; 
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  /* --- 新增修改：上12px 左右14px 下6px（大幅减小底部留白，原为 12px） --- */
  padding: 12px 14px 6px 14px; 
  /* --- 结束 --- */
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.03);
  background-image: linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
  background-size: 16px 16px;
  cursor: pointer;
  margin: 0; /* 绝对不要加额外的margin对齐，交给气泡系统！ */
}
:deep(.transfer-card:active) { transform: scale(0.97); }

:deep(.tc-header) {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;
}

/* 【修改点：左侧文字信息区，改为上下竖向排列】 */
:deep(.tc-info) { 
  display: flex; flex-direction: column; align-items: flex-start; justify-content: center; 
  min-width: 0; margin-top: 0px; 
}
:deep(.tc-label) { 
  font-size: 10px; color: #8e8e8e; margin-bottom: 2px; letter-spacing: 0.02em; 
}
:deep(.tc-name) { 
  font-weight: 500; font-size: 13px; color: #1a1a1a; letter-spacing: -0.01em; 
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
}

:deep(.tc-amount-sec) { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
:deep(.tc-amount-label) { font-size: 9px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.06em; }
:deep(.tc-amount-num) { font-weight: 600; font-size: 18px; color: #141414; line-height: 1; letter-spacing: -0.03em; white-space: nowrap; }
:deep(.tc-currency) { font-weight: 400; font-size: 12px; margin-right: 2px; color: #3a3a3a; }
:deep(.tc-status-row) { display: flex; align-items: center; margin-top: 2px; }

:deep(.tc-status-badge) {
  display: flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 500;
  color: #3a7d4c; background: #eef6f0; padding: 2px 5px; border-radius: 30px;
  border: 1px solid #d4e4d9; white-space: nowrap; letter-spacing: 0.02em;
}
:deep(.tc-status-badge svg) { width: 10px; height: 10px; stroke: #3a7d4c; stroke-width: 2.2; fill: none; flex-shrink: 0; }

:deep(.tc-status-badge.rejected) { color: #555; background: #f0f0f0; border-color: #e0e0e0; }
:deep(.tc-status-badge.rejected svg) { stroke: #555; }

:deep(.tc-footer) {
  border-top: 1px solid #ececec; 
  /* --- 新增修改：减小内边距，并将 margin-top 改为负数，强制把线向上拉与右侧平齐 --- */
  padding-top: 6px; 
  margin-top: -6px; 
  /* --- 结束 --- */
  position: relative; width: 100%;
}
:deep(.tc-footer::before) { content: ''; position: absolute; top: -1px; left: 0; width: 30px; height: 2px; background: #2c2c2c; border-radius: 4px; }
:deep(.tc-note-area) { display: flex; align-items: center; width: 100%; }
:deep(.tc-note-text) {
  font-size: 11px; color: #4a4a4a; background: #f7f7f7; padding: 3px 10px; letter-spacing: 0.01em;
  border-radius: 30px; border: 1px solid #eaeaea; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis;
}






/* 👇 ====== 【新增：聊天流底部防遮挡隐形垫】 ====== 👇 */
#chat-messages-wrapper::after {
  content: '';
  display: block;
  /* 高度设置 200px：既能抵消你卡片的 -200px 负边距，又能完美避开输入栏的高度 */
  height: 50px; 
  width: 100%;
  flex-shrink: 0;
  pointer-events: none; /* 防止遮挡点击 */
}
/* 👆 ========================================= 👆 */

/* ============================================
   --- 新增功能：Ins风格 · 特刊分享卡片 CSS 开始 ---
============================================ */
:deep(.ins-card) { max-width: 200px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.02); flex-shrink: 0; margin-bottom: 2px; }
/* 修改比例为 16/9 压扁高度，并适配真实图片 */
:deep(.ins-card .ins-cover) { width: 100%; aspect-ratio: 16 / 9; background: #f0ebe5; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; border-bottom: 1px solid rgba(0,0,0,0.03); }
:deep(.ins-card .ins-cover .cover-img) { width: 100%; height: 100%; object-fit: cover; }
:deep(.ins-card .ins-body) { padding: 10px 12px 12px; }
:deep(.ins-card .ins-body .ins-user) { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
:deep(.ins-card .ins-body .ins-user .avatar-icon) { width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(135deg, #d4c5b2, #cbb59b); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
:deep(.ins-card .ins-body .ins-user .avatar-icon svg) { width: 10px; height: 10px; fill: #fff; }
:deep(.ins-card .ins-body .ins-user .username) { font-size: 9px; font-weight: 600; color: #4a3a2e; letter-spacing: 0.2px; }
:deep(.ins-card .ins-body .ins-user .dot-sep) { width: 3px; height: 3px; background: #d0c8c0; border-radius: 50%; }
:deep(.ins-card .ins-body .ins-user .time) { font-size: 8px; color: #b0a8a0; font-weight: 400; }
:deep(.ins-card .ins-body .ins-title) { font-size: 12px; font-weight: 600; color: #1a1a1a; line-height: 1.35; margin-bottom: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
:deep(.ins-card .ins-body .ins-title .hl) { color: #b38a7a; font-weight: 400; }
:deep(.ins-card .ins-body .ins-desc) { font-size: 10px; color: #8a8078; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 6px; font-weight: 400; }
:deep(.ins-card .ins-body .ins-actions) { display: flex; justify-content: space-between; align-items: center; border-top: 0.5px solid #f0edea; padding-top: 6px; }
:deep(.ins-card .ins-body .ins-actions .left) { display: flex; align-items: center; gap: 10px; }
:deep(.ins-card .ins-body .ins-actions .left .action-item) { display: flex; align-items: center; gap: 3px; font-size: 9px; color: #8a8078; font-weight: 400; }
:deep(.ins-card .ins-body .ins-actions .left .action-item svg) { width: 13px; height: 13px; fill: none; stroke: #8a8078; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:deep(.ins-card .ins-body .ins-actions .left .action-item.liked svg) { fill: #e74c5e; stroke: #e74c5e; }
:deep(.ins-card .ins-body .ins-actions .right svg) { width: 13px; height: 13px; fill: none; stroke: #b0a8a0; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
/* --- 结束 --- */
</style>