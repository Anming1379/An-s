// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Note from '@/views/Note.vue'
import Alambda from '@/views/Alambda.vue'
import Contact from '@/views/Contact.vue'
import NotFound from '@/views/NotFound.vue'
import Book from '@/views/tool/Book.vue'
import Image from '@/views/tool/Image.vue'
import Qr from '@/views/tool/QR.vue'

const routes = [
  {
    path: '/',
    component: Home,
    meta: { 
      headerTip: '桉的网页!你要陪桉一起玩嘛～',
      footerTip: '桉的个人网页, 放些桉的东西'
    }
  },
  {
    path: '/note',
    component: Note,
    meta: { 
      headerTip: '桉的笔记本',
      footerTip: '桉的个人网页，分享艺术作品、技术笔记和生活点滴。'
    }
  },
  {
    path: '/alambda',
    component: Alambda,
    meta: { 
      headerTip: '有很多乱七八糟的好玩的~',
      footerTip: '桉的个人网页, 在这里发点好玩的'
    }
  },
  {
    path: '/contact',
    component: Contact,
    meta: { 
      headerTip: '找桉一起玩!',
      footerTip: '你要找桉一起玩嘛?'
    }
  },
  // 嵌套路由：所有工具页面
  {
    path: '/tool/',
      children: [
      {
        path: '',
        redirect: '/tool/book'
      },
      {
        path: 'book',
        component: Book,
        meta: { title: '答案之书' }
      },
      {
        path: 'image',
        component: Image,
        meta: { title: '图片隐写' }
      },
      {
        path: 'qr',
        component: Qr,
        meta: { title: '二维码生成器' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    component: NotFound,
    meta: {
      headerTip: '哎？好像...迷路了......',
      footerTip: '这里是桉的个人网页哦'
    }
  }
]

export default createRouter({ history: createWebHistory(), routes })
