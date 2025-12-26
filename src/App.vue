<template>
  <v-app>
    <v-app-bar app density="compact">
      <v-btn icon @click="$router.push('/')" :ripple="false" class="logo-btn" size="small">
        <v-img :src="logo" width="32"></v-img>
      </v-btn>
      <v-toolbar-title class="text-h6">Minesweeper</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn variant="text" to="/" size="small">Play</v-btn>
      <v-btn variant="text" to="/about" size="small">About</v-btn>
    </v-app-bar>
    <v-main>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import logo from './assets/logo.png'
</script>

<style scoped>
.logo-btn {
  background-color: transparent !important;
}
.logo-btn:hover {
  background-color: transparent !important;
}
.logo-btn::before {
  display: none !important;
}
.logo-btn.v-btn--active {
  background-color: transparent !important;
  opacity: 1 !important;
}
.logo-btn.v-btn--active::before {
  opacity: 0 !important;
}
</style>
