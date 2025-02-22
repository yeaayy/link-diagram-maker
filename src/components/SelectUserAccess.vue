<script setup lang="ts">
import { faUserCircle, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import SelectAccessLevel from './SelectAccessLevel.vue';

const prop = defineProps<{
  name: string;
  username: string;
  writeAccess: boolean | null;
}>();

const emit = defineEmits<{
  remove: [];
  writeAccessChanged: [boolean | null];
}>();
</script>

<template>
  <div class="item">
    <FontAwesomeIcon :icon="faX" class="close" @click="$emit('remove')" />
    <FontAwesomeIcon :icon="faUserCircle" class="fa-2xl" />
    <div class="mid">
      <div :title="name">{{ name }}</div>
      <div :title="username" class="username">@{{ username }}</div>
    </div>
    <SelectAccessLevel :value="writeAccess" @value-changed="$emit('writeAccessChanged', $event)" />
  </div>
</template>

<style scoped>
.item {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0.25rem 0px;
  border-top: 1px solid var(--black);
}

.mid {
  flex: 1;
  margin-left: 0.5rem;
  overflow: hidden;

  * {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}

.username {
  font-size: 0.75rem;
  color: #888;
}

.close {
  padding: 0.5rem;
  width: 1rem;
  height: auto;
  aspect-ratio: 1;

  &:hover {
    background-color: #93c5fd;
  }
}
</style>
