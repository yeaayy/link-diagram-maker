<script setup lang="ts">
import { useAuthManager } from '@/AuthManager';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { faEnvelope, faPlus, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ref, shallowRef, type ComponentInstance } from 'vue';
import ConfirmDialog from '../ConfirmDialog.vue';
import MyButton from '../MyButton.vue';

const user = useAuthManager().getUser();
const http = useHttp();
const loading = useLoading();
const confirm = shallowRef(null! as ComponentInstance<typeof ConfirmDialog>);
const toDelete = ref(null as null | string);

async function removeEmail(email: string) {
  loading();
  try {
    const { data } = await http.auth.removeEmail(email);
    if (data.success && user.value) {
      user.value.emails = user.value.emails.filter(x => x !== email);
    }
  } catch(e) {}
  loading(false);
}

async function confirmRemoveEmail(email: string) {
  toDelete.value = email;
  const result = await confirm.value.show();
  if (result) {
    await removeEmail(email);
  }
}

function addEmail() {
  location.href = './oauth/google.php';
}
</script>

<template>
  <div class="row">
    <MyButton color="green" @click="addEmail">
      <FontAwesomeIcon :icon="faPlus" />
      Add E-Mail
    </MyButton>
  </div>

  <div class="row">
    <div class="email" v-for="email of user?.emails">
      <FontAwesomeIcon class="icon" :icon="faEnvelope" />
      <div>
        {{ email }}
      </div>
      <FontAwesomeIcon
        class="remove"
        :icon="faX"
        v-if="user && user.emails.length > 1"
        @click="confirmRemoveEmail(email)"
      />
    </div>
  </div>

  <ConfirmDialog ref="confirm" title="Confirm Delete E-Mail">
    Are you sure want to remove {{ toDelete }}?
  </ConfirmDialog>
</template>

<style scoped>
.email {
  display: flex;
  border-bottom: 1px solid var(--black);
  align-items: center;

  &:first-of-type {
    border-top: 1px solid var(--black);
  }
}

.icon {
  padding: 0.5rem;
}

.remove {
  padding: 0.5rem;
  margin-left: auto;
  cursor: pointer;

  &:hover {
    background-color: var(--hover-color);
  }
}
</style>
