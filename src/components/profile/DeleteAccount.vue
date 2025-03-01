<script setup lang="ts">
import { useAuthManager } from '@/AuthManager';
import { useAlert } from '@/alert';
import { useConfirm } from '@/confirm';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { faInfoCircle, faTrash, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import useVuelidate from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';
import { AxiosError } from 'axios';
import { computed, reactive, ref } from 'vue';
import MyButton from '../MyButton.vue';
import MyInput from '../MyInput.vue';

const http = useHttp();
const auth = useAuthManager();
const alert = useAlert();
const confirm = useConfirm();
const loading = useLoading();

const data = reactive({
  password: '',
});

const extern = ref<Partial<typeof data>>({});
const v = useVuelidate(computed(() => {
  return {
    password: {
      required: helpers.withMessage('Password is required.', required),
    },
  };
}), data, { $externalResults: extern });

function clearExtern() {
  v.value.$clearExternalResults();
}

async function deleteAccount(e: Event) {
  e.preventDefault();
  const result = await v.value.$validate();
  if (!result) return false;
  v.value.$clearExternalResults();

  loading();
  try {
    const { data: response } = await http.auth.deleteAccount(data.password);
    loading(false);
    if (!response.success) return;
    data.password = '';
    v.value.$reset();

    const result = await confirm({
      icon: faWarning,
      title: 'Delete Account',
      body: `This action can\'t be undone, are you sure you want to delete this account?'`,
    });
    if (!result) return;
    confirmDeleteAccount(response.token);
  } catch(e: unknown) {
    if (e instanceof AxiosError) {
      if (e.response?.data.error) {
        extern.value = e.response?.data.error;
      }
    }
    loading(false);
  }
}

async function confirmDeleteAccount(token: string) {
  loading();
  try {
    const { data: response } = await http.auth.confirmDeleteAccount(token);
    loading(false);
    if (response.success) {
      alert({
        icon: faInfoCircle,
        title: 'Success',
        body: 'Your account has been deleted.',
        local: false,
      });
      auth.invalidate();
      return;
    }
  } catch(e: unknown) {}
  alert({
    icon: faInfoCircle,
    body: 'Failed to delete account, please try again later.',
  })
  loading(false);
}
</script>

<template>
  <form @submit="deleteAccount">
    <div class="row">
      <MyInput
      type="password"
      name="password"
      label="Your password"
      :validate="v.password"
      v-model="data.password"
      @input="clearExtern"
      required />
    </div>

    <div class="row">
      <MyButton color="red">
        <FontAwesomeIcon :icon="faTrash" />
        Delete Account
      </MyButton>
    </div>
  </form>
</template>
