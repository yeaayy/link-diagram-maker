<script setup lang="ts">
import { faCircleHalfStroke, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { inject, ref, type ComponentInstance, type Ref } from 'vue';
import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';

const dropdown = ref(null! as ComponentInstance<typeof Dropdown>);
const button = ref(null! as HTMLElement);
const theme = inject('theme')! as Ref<string>;

function toggleDropdown() {
  dropdown.value.toggle();
}

function setTheme(newTheme: string) {
  theme.value = newTheme;
}
</script>

<template>
  <div v-bind="$attrs" ref="button" id="theme-selector" title="Select Theme" @click="toggleDropdown">
    <FontAwesomeIcon :icon="
      theme === 'auto' ? faCircleHalfStroke
      : theme === 'light' ? faSun
      : faMoon" />
  </div>

  <Dropdown ref="dropdown" :relative="button">
      <DropdownItem @click="setTheme('auto')">
        <FontAwesomeIcon :icon="faCircleHalfStroke" />
        Auto
      </DropdownItem>
      <DropdownItem @click="setTheme('light')">
        <FontAwesomeIcon :icon="faSun" />
        Light Mode
      </DropdownItem>
      <DropdownItem @click="setTheme('dark')">
        <FontAwesomeIcon :icon="faMoon" />
        Dark Mode
      </DropdownItem>
    </Dropdown>
</template>

<style scoped>
#theme-selector {
  width: 2rem;
  font-size: 1.5rem;
  padding: 0.25rem;
  text-align: center;
  cursor: pointer;

  &:hover {
    background-color: var(--hover-color);
  }
}
</style>
