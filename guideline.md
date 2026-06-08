# guideline.md

# NexTalk Frontend Guideline

## 1. Project Overview

Frontend cho ứng dụng chat realtime tương tự Discord hoặc Zalo.

Frontend chịu trách nhiệm:

* Authentication
* User Profile
* Friend Management
* Private Chat
* Group Chat
* Notification
* Online Presence
* File Upload
* Voice/Video Call (Future)

---

# 2. Tech Stack

## Core

* React 19
* Vite
* TypeScript

---

## UI

* TailwindCSS
* Shadcn UI

---

## Routing

* React Router DOM

---

## State Management

* Zustand

---

## API

* Axios

---

## Realtime

* SockJS
* STOMPJS

---

## Form

* React Hook Form
* Zod

---

## Data Fetching

* TanStack Query (React Query)

---

# 3. Folder Structure

```text
src

├── api
├── assets
├── components
│   ├── common
│   ├── chat
│   ├── friend
│   ├── group
│   └── notification
│
├── hooks
├── layouts
├── pages
├── routes
├── services
├── store
├── types
├── websocket
├── utils
└── constants
```

---

# 4. Layout Structure

## Public Layout

```text
/login
/register
/verify-email
```

---

## Protected Layout

```text
/chat
/friends
/groups
/settings
/profile
```

---

# 5. Design Principles

## Responsive

Hỗ trợ:

```text
Mobile

Tablet

Desktop
```

---

## Theme

Hỗ trợ:

```text
Light

Dark
```

---

## UI Style

Tham khảo:

* Discord
* Slack
* Messenger

---

# PHASE 1

# AUTHENTICATION

## Goal

Cho phép người dùng đăng ký và đăng nhập.

---

## Pages

### Login Page

Fields:

```text
Email

Password
```

---

### Register Page

Fields:

```text
Username

Email

Password

Confirm Password
```

---

### Verify Email Page

Hiển thị:

```text
Email verified

Verification failed
```

---

## APIs

```http
POST /api/auth/register

POST /api/auth/login

POST /api/auth/refresh

POST /api/auth/logout
```

---

## Store

### Auth Store

```text
user

accessToken

isAuthenticated
```

---

## Deliverables

✅ Login

✅ Register

✅ Logout

✅ Protected Routes

✅ Refresh Token Flow

---

# PHASE 2

# USER PROFILE

## Goal

Quản lý hồ sơ người dùng.

---

## Pages

### Profile Page

Thông tin:

```text
Avatar

Username

Email

Bio
```

---

### Edit Profile Modal

Cho phép cập nhật:

```text
Avatar

Username

Bio
```

---

## APIs

```http
GET /api/users/me

PUT /api/users/profile
```

---

## Deliverables

✅ View Profile

✅ Update Profile

✅ Upload Avatar

---

# PHASE 3

# FRIEND SYSTEM

## Goal

Quản lý bạn bè.

---

## Pages

### Friend List

Hiển thị:

```text
Avatar

Username

Online Status
```

---

### Friend Requests

Tabs:

```text
Pending

Received

Accepted
```

---

### Add Friend

Search User

Send Request

---

## APIs

```http
POST /api/friends/request

PUT /api/friends/accept

PUT /api/friends/reject

DELETE /api/friends/remove

GET /api/friends
```

---

## Deliverables

✅ Friend List

✅ Friend Requests

✅ Add Friend

---

# PHASE 4

# PRIVATE CHAT

## Goal

Chat realtime 1-1.

---

## Layout

```text
Sidebar
    ↓
Conversation List

Main Area
    ↓
Chat Messages

Bottom
    ↓
Message Input
```

---

## Components

### ChatSidebar

Danh sách cuộc trò chuyện.

---

### ChatWindow

Hiển thị tin nhắn.

---

### MessageBubble

Hiển thị:

```text
Text

Time

Avatar
```

---

### MessageInput

Gửi:

```text
Text Message
```

---

## WebSocket

Kết nối:

```text
/ws
```

---

## Deliverables

✅ Chat Realtime

✅ Message History

✅ Auto Scroll

✅ Typing Input

---

# PHASE 5

# GROUP CHAT

## Goal

Chat nhóm.

---

## Pages

### Group List

Danh sách nhóm.

---

### Create Group Modal

Thông tin:

```text
Group Name

Members
```

---

### Group Chat

Giao diện tương tự private chat.

---

## Deliverables

✅ Create Group

✅ Add Members

✅ Group Chat

---

# PHASE 6

# MESSAGE STATUS

## Goal

Hiển thị trạng thái tin nhắn.

---

## Status

```text
✓ Sent

✓✓ Delivered

✓✓ Seen
```

---

## Deliverables

✅ Seen Status

✅ Delivered Status

---

# PHASE 7

# FILE UPLOAD

## Goal

Gửi ảnh và file.

---

## Components

### FilePicker

### ImagePreview

### UploadProgress

---

## Supported

```text
Image

Video

PDF

ZIP
```

---

## Deliverables

✅ Upload Image

✅ Upload Video

✅ Upload File

---

# PHASE 8

# NOTIFICATION

## Goal

Thông báo realtime.

---

## Components

### Notification Bell

Hiển thị số lượng chưa đọc.

---

### Notification Panel

Danh sách thông báo.

---

## Deliverables

✅ Notification List

✅ Realtime Notification

---

# PHASE 9

# ONLINE PRESENCE

## Goal

Hiển thị trạng thái người dùng.

---

## Status

```text
Online

Offline

Away
```

---

## UI

Avatar:

```text
Green Dot

Gray Dot

Yellow Dot
```

---

## Deliverables

✅ Online Indicator

✅ Last Seen

---

# PHASE 10

# ADVANCED CHAT FEATURES

## Message Actions

* Reply Message
* Edit Message
* Delete Message
* Recall Message
* Pin Message

---

## Reactions

* Like
* Love
* Laugh
* Angry

---

## Search

* Search User
* Search Message
* Search Group

---

## Deliverables

✅ Message Actions

✅ Reactions

✅ Search

---

# PHASE 11

# VOICE & VIDEO CALL

## Goal

Tương tự Discord.

---

## Features

### Voice Call

* Join
* Leave
* Mute
* Unmute

---

### Video Call

* Camera On
* Camera Off

---

### Screen Sharing

* Share Screen
* Stop Sharing

---

## Technologies

* Agora
  hoặc
* WebRTC

---

## Deliverables

✅ Voice Call

✅ Video Call

✅ Screen Share

---

# State Management Rules

## Zustand Stores

```text
authStore

userStore

friendStore

chatStore

groupStore

notificationStore
```

---

# API Rules

Không gọi API trực tiếp trong component.

Luôn sử dụng:

```text
services
```

Ví dụ:

```text
authService

chatService

friendService
```

---

# Coding Standards

## Naming

Components:

```text
PascalCase
```

Ví dụ:

```text
ChatSidebar.tsx

MessageBubble.tsx
```

---

Hooks:

```text
useSomething
```

Ví dụ:

```text
useAuth

useWebSocket
```

---

# Definition Of Done

Một phase hoàn thành khi:

✓ Responsive

✓ Dark Mode hoạt động

✓ Validation đầy đủ

✓ API tích hợp hoàn chỉnh

✓ Không còn lỗi ESLint

✓ Không còn lỗi TypeScript

✓ Loading State đầy đủ

✓ Error Handling đầy đủ
