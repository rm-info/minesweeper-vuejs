<template>
  <v-app>
    <v-app-bar app>
      <v-btn icon disabled>
        <v-img :src="logo" width="40"></v-img>
      </v-btn>
      <v-toolbar-title>
        <v-btn variant="text" size="large" to="/">Play</v-btn>
        <v-btn variant="text" size="large" to="/about">About</v-btn>
      </v-toolbar-title>
      <v-spacer></v-spacer>
    </v-app-bar>
    <v-main>
      <h1 class="text-h3 text-center pt-3">Minesweeper</h1>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script setup>
import logo from './assets/logo.png'
</script>
