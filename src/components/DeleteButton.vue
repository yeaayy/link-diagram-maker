<script setup lang="ts">
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
</script>

<template>
  <div class="delete">
    <FontAwesomeIcon :icon="faTrash" />
    Delete
  </div>
</template>

<style scoped>
.delete {
  display: block;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: white;
  background-color: red;
  width: 100%;
  box-shadow: none;
  border: none;
  text-align: center;
  cursor: pointer;

  &:hover {
    background-color: #ff6666;
  }
}
</style>
