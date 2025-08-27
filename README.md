
---
# Geofence Field Log (React Native + Expo)

[![React Native](https://img.shields.io/badge/React%20Native-blue.svg)](https://reactnative.dev/)  
[![Expo](https://img.shields.io/badge/Expo-SDK%20-000.svg)](https://expo.dev/)  
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

This branch contains the **Field Log mobile app**, built with **React Native** and **Expo**.  
It enables users to log data and interact with geofences in real time.

---

##  Features
- Mobile-friendly geofence logging  
- Real-time interaction with backend APIs  
- Map functionality (optimized for iOS devices)  
- QR-code-based Expo Go testing  

---

##  Installation & Setup

### Clone the Repository
```bash
git clone https://github.com/Dbee123/Geofence.git
cd Geofence
git checkout fieldlog
```


### Install Dependencies
```bash
npm install
```

### Backend Connectivity (Important!)

Since the app runs on a mobile device, it cannot directly access localhost:8000 from your machine.
You may need to tunnel your backend URL/port using a tool such as Cloudflare Tunnel, ngrok, or similar.

Example with Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://127.0.0.1:8000
```

After tunneling, update the API configuration file:

```bash
// fieldlog/config/api.jsx
export const BASE_URL = "https://your-tunnel-url.trycloudflare.com";
```


### Start the App
```bash
npx expo start
```

Scan the QR code using the Expo Go App on your mobile device.

 Note: For the best development experience, use an iOS device, as map features are fully supported there.

 Authentication

Use the credentials created from the Backend (main branch).

Login to access geofence functionality.
