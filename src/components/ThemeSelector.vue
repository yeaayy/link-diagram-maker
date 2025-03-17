<script setup lang="ts">
import { faCircleHalfStroke, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { inject, ref, type ComponentInstance, type Ref } from 'vue';
import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';

const dropdown = ref(null! as ComponentInstance<typeof Dropdown>);
const button = ref(null! as HTMLElement);
const data = {
  auto: {
    name: 'Auto',
    icon: faCircleHalfStroke,
  },
  light: {
    name: 'Light',
    icon: faSun,
  },
  dark: {
    name: 'Dark',
    icon: faMoon,
  },
};
const theme = inject('theme')! as Ref<keyof typeof data>;

function toggleDropdown() {
  dropdown.value.toggle();
}

function setTheme(newTheme: keyof typeof data) {
  theme.value = newTheme;
}
</script>

<template>
  <div v-bind="$attrs" ref="button" id="theme-selector" title="Select Theme" @click="toggleDropdown">
    <FontAwesomeIcon class="fa-xl" :icon="data[theme].icon" />
    <span>{{ data[theme].name }}</span>
  </div>

  <Dropdown ref="dropdown" :relative="button">
    <DropdownItem v-for="(o, id) in data" @click="setTheme(id)">
      <FontAwesomeIcon :icon="o.icon" />
      {{ o.name }}
    </DropdownItem>
  </Dropdown>
</template>

<style scoped>
#theme-selector {
  width: min-content;
  white-space: nowrap;
  padding: 0.5rem;
  text-align: center;
  cursor: pointer;
  display: flex;
  align-items: center;
  border: 1px solid var(--black);
  border-radius: 0.25rem;

  > span {
    margin-left: 0.5rem;
  }

  &:hover {
    background-color: var(--hover-color);
  }
}
</style>
