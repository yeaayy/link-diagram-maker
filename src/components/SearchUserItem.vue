<script setup lang="ts">
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

type UserData = {
  name: string;
  username: string;
};

const emit = defineEmits<{
  click: [UserData];
}>();

const prop = defineProps<UserData>();
</script>

<template>
  <div class="item" :title="`${name} (@${username})`" @click="$emit('click', { name, username })">
    <FontAwesomeIcon :icon="faUserCircle" class="user-icon fa-2xl" />
    <div class="mid">
      <div>{{ name }}</div>
      <div class="username">@{{ username }}</div>
    </div>
  </div>
</template>

<style scoped>
.item {
  padding: 0.5rem;
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    background-color: var(--hover-color);
  }
}

.user-icon {
  margin-right: 0.5rem;
}

.username {
  font-size: 0.75rem;
  color: #888;
}

.mid {
  overflow-x: hidden;

  * {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}
</style>
