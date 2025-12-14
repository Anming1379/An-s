<script setup></script>

<template>
  <main class="main">
    <div class="container">
      <!-- 头像与标题 -->
      <div class="profile" id="home">
        <img
          src="/avatar.jpg"
          alt="AnmingCat 的头像"
          class="profile-image"
          loading="lazy"
        />
        <div class="profile-content">
          <h1>AnmingCat</h1>
          <p class="description">An ordinary Artist.</p>
        <div class="profile-actions">
          <RouterLink to="/note" class="btn btn-primary">查看笔记</RouterLink>
          <RouterLink to="/contact" class="btn btn-secondary">和桉一起玩</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>