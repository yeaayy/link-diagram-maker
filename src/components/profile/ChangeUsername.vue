<script setup lang="ts">
import { useAuthManager } from '@/AuthManager';
import { useAlert } from '@/alert';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import useVuelidate from '@vuelidate/core';
import { helpers, maxLength, minLength } from '@vuelidate/validators';
import { AxiosError } from 'axios';
import { computed, reactive, ref, watchEffect } from 'vue';
import MyInput from '../MyInput.vue';

const user = useAuthManager().getUser();
const http = useHttp();
const alert = useAlert();
const loading = useLoading();

const data = reactive({
  username: '',
});

watchEffect(() => {
  if (user.value) {
    data.username = user.value.username;
  }
})

const extern = ref<Partial<typeof data>>({});
const v = useVuelidate(computed(() => {
  return {
    username: {
      minLength: helpers.withMessage('Username must be at least 3 characters', minLength(3)),
      maxLength: helpers.withMessage('Username must be not have more than 40 characters', maxLength(40)),
    },
  };
}), data, { $externalResults: extern });

async function changeUsername(e: Event) {
  e.preventDefault();
  const result = await v.value.$validate();
  if (!result) return false;
  v.value.$clearExternalResults();

  loading();
  try {
    const { data: response } = await http.auth.setUsername(data.username);
    if (response.success) {
      alert({
        icon: faInfoCircle,
        title: 'Username changed',
        body: `Username changed to "${data.username}"`,
      });
      user.value!.username = data.username;
    }
  } catch(e: unknown) {
    if (e instanceof AxiosError) {
      if (e.response?.data.error) {
        extern.value = e.response?.data.error;
      }
    }
  }
  loading(false);
  return false;
}
</script>

<template>
  <form @submit="changeUsername">
    <div class="row">
      <MyInput
        type="text"
        name="username"
        label="Username"
        :validate="v.username"
        v-model="data.username"
        max-length="40"
        required />
    </div>

    <div class="row">
      <button type="submit">Change Username</button>
    </div>
  </form>

</template>
