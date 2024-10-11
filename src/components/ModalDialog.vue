<script setup lang="ts">
import { ref } from 'vue';

const prop = withDefaults(defineProps<{
  show?: boolean;
}>(), {
  show: false,
});

const show = ref(prop.show);

defineExpose({
  show() {
    show.value = true;
  },
  hide() {
    show.value = false;
  },
  toggle() {
    show.value = !show.value;
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition>
      <div class="backdrop" v-if="show">
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
  position: absolute;
  left: 0px;
  top: 0px;
  right: 0px;
  bottom: 0px;
  display: flex;
  background-color: #00000080;
  z-index: 999;
  --modal-width: 25%;
  --modal-bg: white;
  --modal-border: 1px solid black;
  --modal-title-size: 1.5rem;
  --modal-rounded-radius: 0.5rem;
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
