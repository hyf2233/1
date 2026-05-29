# 聊天记录添加与头像框修复 - 设计文档

## 日期
2026-05-29

## 问题概述
1. "添加记录"功能存储格式错误，没有时间输入
2. 消息头像框显示不正确

## 修复方案

### 1. 添加记录修复 (HistoryDrawer.tsx)

**handleAddEntry 函数重构：**
- 从表单字段构建 `ChatEntry` 对象
- 使用 `chatEntryToXml()` 生成规范 XML 格式
- 新增时间输入字段（默认当前时间 HH:MM）

**世界书命名与触发词：**
- 世界书名称：`聊天记录-{角色姓名}`（如"聊天记录-苏晓月"）
- 触发词：仅角色姓名（如 `["苏晓月"]`）
- 条目按 `order`（时间戳）排序，不区分手动/自动

**涉及文件：**
- `src/components/chat/HistoryDrawer.tsx` - 修复 handleAddEntry，添加时间输入，修复触发词
- `src/store/appStore.ts` - 修复世界书命名和触发词（setActiveChat, finalizeAndSync, messageToLorebookEntry）

### 2. 消息头像框修复 (ChatDetail.tsx + MessageBubble.tsx)

**AI 消息：** 始终显示头像（移除 `isConsecutive` 条件限制）
**用户消息：** 在右侧添加用户头像框

**涉及文件：**
- `src/components/chat/ChatDetail.tsx` - 修改 showAvatar 逻辑，传递用户头像
- `src/components/chat/MessageBubble.tsx` - 为用户消息添加头像显示
