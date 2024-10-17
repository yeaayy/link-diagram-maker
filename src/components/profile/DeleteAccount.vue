<script setup lang="ts">
import { useAlert } from '@/alert';
import { useConfirm } from '@/confirm';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { useUserData } from '@/userdata';
import { faInfoCircle, faUserSlash, faWarning } from '@fortawesome/free-solid-svg-icons';
import useVuelidate from '@vuelidate/core';
import { email, helpers, required } from '@vuelidate/validators';
import { AxiosError } from 'axios';
import { computed, reactive, ref } from 'vue';
import MyInput from '../MyInput.vue';
import Card from '../Card.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import MyButton from '../MyButton.vue';

const http = useHttp();
const alert = useAlert();
const confirm = useConfirm();
const loading = useLoading();
const userData = useUserData();

const data = reactive({
  email: '',
});

const extern = ref<Partial<typeof data>>({});
const v = useVuelidate(computed(() => {
  return {
    email: {
      required: helpers.withMessage('Email is required', required),
      email: helpers.withMessage('Email is not valid', email),
    }
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
    const { data: response } = await http.auth.deleteAccount(data.email);
    loading(false);
    if (!response.success) return;
    data.email = '';
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
      userData.value = null;
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
  <Card>
    <template #title>
      <FontAwesomeIcon :icon="faUserSlash" />
      DELETE ACCOUNT
    </template>
    <form @submit="deleteAccount">
      <div class="row">
        <MyInput
        type="email"
        name="email"
        label="Your email"
        :validate="v.email"
        v-model="data.email"
        @input="clearExtern" />
      </div>

      <div class="row text-right">
        <MyButton color="red" type="submit">
          <FontAwesomeIcon :icon="faUserSlash" />
          Delete Account
        </MyButton>
      </div>
    </form>
  </Card>
</template>
