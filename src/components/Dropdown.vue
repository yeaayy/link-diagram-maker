<script setup lang="ts">
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { onMounted, ref, shallowRef, watch, type ShallowRef, provide } from 'vue';

const open = ref(false);
const dropdownButton = shallowRef(null! as HTMLElement);
const dropdownList: ShallowRef<HTMLElement | null> = shallowRef(null);

provide('close-dropdown', () => {
  open.value = false;
})

watch(dropdownList, list => {
  if (!list) return;
  const bbox = dropdownButton.value.getBoundingClientRect();
  console.log('bbox', bbox.bottom, bbox.right)
  list.style.top = bbox.bottom + 'px';
  list.style.right = window.innerWidth - bbox.right + 'px';
});

function toggleMenu(e: Event) {
  e.stopPropagation();
  open.value = !open.value;
}
</script>

<template>
  <div ref="dropdownButton" class="dropdown" @click="toggleMenu" v-bind="$attrs">
    <FontAwesomeIcon class="fa-xl" :icon="faEllipsisV" />

    <Teleport to="body" v-if="open">
      <div class="overlay" @click="open = false"></div>
      <div ref="dropdownList" class="dropdown-list">
        <slot></slot>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.dropdown {
  position: absolute;
  text-align: center;
  padding: 0.25rem;
  width: 2rem;
  height: 2rem;

  &:hover:not(:has(.dropdown-item:hover)) {
    background-color: lightblue;
  }
}

.dropdown-list {
  position: absolute;
  right: 0px;
  z-index: 99;
  background-color: white;
  box-shadow: 0px 0px 0.5rem black;

  &>* {
    text-wrap: nowrap;
  }

  &>*:not(:first-child) {
    border-top: 1px solid gray;
  }
}

.overlay {
  position: absolute;
  z-index: 50;
  left: 0px;
  top: 0px;
  right: 0px;
  bottom: 0px;
}
</style>
