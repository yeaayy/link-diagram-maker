<script setup lang="ts">
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
</script>

<template>
  <button class="delete">
      <FontAwesomeIcon :icon="faTrash" />
      Delete
    </button>
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

  &:hover {
    background-color: #ff6666;
  }
}
</style>
