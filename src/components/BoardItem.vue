<script setup lang="ts">
import { useRouter } from 'vue-router';


const router = useRouter();
const prop = defineProps<{
  name: string,
  id: string,
}>();

function open() {
  router.push({
    name: 'board',
    params: {
      id: prop.id,
    },
  })
}
</script>

<template>
  <div class="item border-t border-black p-1 hover:bg-blue-300" @click="open">
    {{ name }}
  </div>
</template>

<style scoped>
.item {
  border-top: 1px solid black;
  padding: 0.25rem;

  &:hover {
    background-color: #93c5fd;
  }
}
</style>
