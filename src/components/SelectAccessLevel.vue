<script setup lang="ts">
import { faEye, faLock, faPencil } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef, type ComponentInstance } from 'vue';
import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';
import MyButton from './MyButton.vue';

const prop = withDefaults(defineProps<{
  allowPrivate?: boolean;
  value?: boolean | null;
}>(), {
  allowPrivate: false,
  value: null,
});

const emit = defineEmits<{
  valueChanged: [boolean | null];
}>();

const button = shallowRef(null! as ComponentInstance<typeof MyButton>);
const dropdown = shallowRef(null! as ComponentInstance<typeof Dropdown>);
</script>

<template>
  <MyButton ref="button" v-bind="$attrs" class="button" @click="dropdown.toggle()" color="blue">
    <FontAwesomeIcon :icon="value === null ? faLock : value ? faPencil : faEye" />
    {{ value === null ? 'Private' : value ? 'Edit' : 'View' }}
  </MyButton>

  <Dropdown ref="dropdown" :relative="button?.$el">
    <DropdownItem @click="$emit('valueChanged', null)" v-if="allowPrivate">
      <FontAwesomeIcon :icon="faLock" />
      Private
    </DropdownItem>
    <DropdownItem @click="$emit('valueChanged', false)">
      <FontAwesomeIcon :icon="faEye" />
      View
    </DropdownItem>
    <DropdownItem @click="$emit('valueChanged', true)">
      <FontAwesomeIcon :icon="faPencil" />
      Edit
    </DropdownItem>
  </Dropdown>
</template>
