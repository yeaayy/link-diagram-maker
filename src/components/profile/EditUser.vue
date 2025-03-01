<script setup lang="ts">
import { useAlert } from '@/alert';
import { useAuthManager } from '@/AuthManager';
import { useHttp, type UserData } from '@/http';
import { useLoading } from '@/loading';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import useVuelidate from '@vuelidate/core';
import { helpers, maxLength, minLength, required } from '@vuelidate/validators';
import { AxiosError } from 'axios';
import { computed, reactive, ref, watchEffect } from 'vue';
import MyButton from '../MyButton.vue';
import MyInput from '../MyInput.vue';

const user = useAuthManager().getUser();
const http = useHttp();
const alert = useAlert();
const loading = useLoading();

const data = reactive({
  username: '',
  name: '',
  emailLogin: false,
});

watchEffect(() => {
  if (user.value) {
    data.username = user.value.username;
    data.name = user.value.name;
    data.emailLogin = user.value.emailLogin;
  }
})

const extern = ref<Partial<{ [K in keyof typeof data]: string }>>({});
const v = useVuelidate(computed(() => {
  return {
    username: {
      minLength: helpers.withMessage('Username must be at least 3 characters', minLength(3)),
      maxLength: helpers.withMessage('Username must be not have more than 40 characters', maxLength(40)),
    },
    name: {
      required: helpers.withMessage('Please enter your name', required),
    },
    emailLogin: [required],
  };
}), data, { $externalResults: extern });

async function changeUsername(e: Event) {
  e.preventDefault();
  const result = await v.value.$validate();
  if (!result) return false;
  v.value.$clearExternalResults();

  loading();
  try {
    const req = {} as Partial<UserData>;
    if (user.value?.username !== data.username) req.username = data.username;
    if (user.value?.name !== data.name) req.name = data.name;
    if (user.value?.emailLogin !== data.emailLogin) req.email_login = data.emailLogin;

    const { data: response } = await http.auth.updateUserdata(req);
    if (response.success) {
      user.value!.name = data.name;
      user.value!.username = data.username;
      user.value!.emailLogin = data.emailLogin;
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

function isChanged() {
  return user.value?.username === data.username &&
    user.value?.name === data.name &&
    user.value?.emailLogin === data.emailLogin;
}
</script>

<template>
  <form @submit="changeUsername">
    <div class="row">
      <MyInput
        type="text"
        name="name"
        label="Name"
        :validate="v.name"
        v-model="data.name"
        max-length="40"
        required />
    </div>

    <div class="row">
      <MyInput
        type="text"
        name="username"
        label="Username"
        :validate="v.username"
        v-model="data.username"
        @input="v.$clearExternalResults()"
        max-length="40"
        required />
    </div>

    <div class="row">
      <input id="email_login" type="checkbox" v-model="data.emailLogin" />
      <label for="email_login">Allow login using email-password</label>
    </div>

    <div class="row">
      <MyButton color="blue" :disabled="isChanged()">
        <FontAwesomeIcon :icon="faSave" />
        Save
      </MyButton>
    </div>
  </form>

</template>
