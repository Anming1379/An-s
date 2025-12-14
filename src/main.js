// src/main.js
import { createApp } from 'vue'
// import { createPinia } from 'pinia'
import App from './App.vue'
import HeaderNav from './components/HeaderNav.vue';
import Footer from './components/Footer.vue';
import router from './router'
import './styles.css'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import { Jimp } from "jimp"
import CryptoJS from 'crypto-js'

const app = createApp(App)

app.use(router)

app.component('HeaderNav', HeaderNav)
app.component('Footer', Footer)

app.mount('#app')