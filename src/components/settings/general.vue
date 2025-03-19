<script setup lang="ts">
import { inject, ref, type Ref } from 'vue';
import ThemeSelector from '../ThemeSelector.vue';

const autosaveDelay = inject<Ref<number>>('autosave-delay');
const undoLimit = inject<Ref<number>>('undo-limit');
</script>

<template>
  <div>
    <div>
      <label>Theme:</label>
      <br>
      <ThemeSelector />
    </div>

    <div class="row">
      <label for="autosave">Autosave in:</label>
      <br>
      <select id="autosave" v-model="autosaveDelay">
        <option :value="-1">Never</option>
        <option :value="1">1 Second</option>
        <option :value="5">5 Seconds</option>
        <option :value="15">15 Seconds</option>
        <option :value="30">30 Seconds</option>
        <option :value="60">1 Minute</option>
        <option :value="120">2 Minutes</option>
        <option :value="300">5 Minutes</option>
        <option :value="900">15 Minutes</option>
        <option :value="1800">30 Minutes</option>
        <option :value="3600">1 Hour</option>
        <option :value="7200">2 Hours</option>
        <option :value="10800">3 Hours</option>
      </select>
    </div>

    <div class="row">
      <label for="undo-limit">Undo limit:</label>
      <br>
      <select id="undo-limit" v-model="undoLimit">
        <option :value="1e200">Unlimited</option>
        <option v-for="x in [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]" :value="x">{{ x }}</option>
      </select>
    </div>
  </div>
</template>
