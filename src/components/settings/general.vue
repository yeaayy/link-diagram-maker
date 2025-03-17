<script setup lang="ts">
import Dropdown from '../Dropdown.vue';
import DropdownItem from '../DropdownItem.vue';
import ThemeSelector from '../ThemeSelector.vue';


</script>

<template>
  <div>
    <div>
      <label>Theme:</label>
      <br>
      <ThemeSelector />
    </div>

    <div class="row">
      <label for="">Autosave in:</label>
      <br>
      <select>
        <option value="">Never</option>
        <option value="">1 Second</option>
        <option value="">5 Seconds</option>
        <option value="">15 Seconds</option>
        <option value="">30 Seconds</option>
        <option value="">1 Minute</option>
        <option value="">2 Minutes</option>
        <option value="">5 Minutes</option>
        <option value="">15 Minutes</option>
        <option value="">30 Minutes</option>
        <option value="">1 Hour</option>
        <option value="">2 Hours</option>
        <option value="">3 Hours</option>
      </select>
    </div>
  </div>
</template>
