<script setup lang="ts">
import keyboard from '@/utils/keyboard';
import { onBeforeUnmount, onMounted, ref } from 'vue';

const prop = withDefaults(defineProps<{
  show?: boolean;
  cancelable?: boolean;
}>(), {
  show: false,
  cancelable: true,
});

const emit = defineEmits<{
  cancel: [],
  close: [],
}>()
const show = ref(prop.show);

function cancel() {
  if (!prop.cancelable) return;
  show.value = false;
  emit('cancel');
}

defineExpose({
  show() {
    show.value = true;
  },
  hide() {
    show.value = false;
    emit('close');
  },
  toggle() {
    show.value = !show.value;
    if (!show.value) {
      emit('close');
    }
  },
  isShowing() {
    return show.value;
  },
})

onMounted(() => {
  keyboard.addShortcut('escape', cancel);
});

onBeforeUnmount(() => {
  keyboard.removeShortcut('escape', cancel);
})
</script>

<template>
  <Teleport to="body" v-if="show">
    <Transition>
      <div class="backdrop" @click.self.stop="cancel" v-bind="$attrs">
        <div class="modal">
          <div class="title">
            <slot name="title"></slot>
          </div>
          <div class="body">
            <slot name="default"></slot>
          </div>
          <div class="footer" v-if="$slots.footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  left: 0px;
  top: 0px;
  right: 0px;
  bottom: 0px;
  display: flex;
  background-color: #00000080;
  overflow-y: auto;
  z-index: 99;
  --modal-width: calc(100% - 1rem);
  --modal-bg: var(--white);
  --modal-border: 1px solid var(--black);
  --modal-title-size: 1.5rem;
  --modal-rounded-radius: 0.5rem;
}

@media (min-width: 21rem) {
  .backdrop {
  --modal-width: 20rem;
  }
}

.modal {
  margin: auto;
  border-radius: var(--modal-rounded-radius);
  width: var(--modal-width);
  border: var(--modal-border);
  background-color: var(--modal-bg);

  &>.title,
  &>.body {
    padding: 0.5rem;
  }

  &>.title {
    border-bottom: var(--modal-border);
    font-size: var(--modal-title-size);
    display: flex;
  }

  &>.footer {
    border-top: var(--modal-border);
    display: flex;

    &>*{
      padding: 0.5rem;
      flex: 1 1;
      text-align: center;
    }

    &>:not(:first-child) {
      border-left: var(--modal-border);
    }

    &>:first-child {
      border-bottom-left-radius: var(--modal-rounded-radius);
    }

    &>:last-child {
      border-bottom-right-radius: var(--modal-rounded-radius);
    }
  }
}

.v-enter-active {
  animation: fade-in 200ms;
}

.v-leave-active {
  animation: fade-out 200ms;
}
</style>
