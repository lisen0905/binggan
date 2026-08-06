// src/utils/theme.js
import { saveSettingData, getSettingValue } from './db.js'

// 修改桌面背景
export function setBg(value, saveToDB = true) {
    document.documentElement.style.setProperty('--desktop-bg', value);
    if (saveToDB) saveSettingData('theme_bg', value);
}

// 修改状态栏颜色
export function setStatusBarColor(color, saveToDB = true) {
    document.documentElement.style.setProperty('--status-bar-color', color);
    if (saveToDB) saveSettingData('theme_status_color', color);
}

// 修改桌面字体颜色
export function setAppTextColor(color, saveToDB = true) {
    document.documentElement.style.setProperty('--desktop-icon-color', color);
    if (saveToDB) saveSettingData('theme_text_color', color);
}

// 开机时自动读取数据库，恢复你昨天设置好的皮肤
export async function bootUpTheme() {
    const bg = await getSettingValue('theme_bg'); 
    if (bg) setBg(bg, false);
    
    const sc = await getSettingValue('theme_status_color'); 
    if (sc) setStatusBarColor(sc, false);
    
    const tc = await getSettingValue('theme_text_color'); 
    if (tc) setAppTextColor(tc, false);
}