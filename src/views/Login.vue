<script setup lang="ts">
import MyInput from '@/components/MyInput.vue';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';
import { AxiosError } from 'axios';
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const loading = useLoading();
const router = useRouter();

const http = useHttp();
const data = reactive({
  username: '',
  password: '',
});

const extern = ref<Partial<typeof data>>({});
const v = useVuelidate(computed(() => {
  return {
    username: {
      required: helpers.withMessage('Username can\'t be empty', required),
    },
    password: {
      required: helpers.withMessage('Password can\'t be empty', required),
    },
  };
}), data, { $externalResults: extern });

function clear() {
  v.value.$clearExternalResults();
}

async function register(e: Event) {
  e.preventDefault();
  const result = await v.value.$validate();
  if (!result) return false;
  clear();

  http.auth.login(data.username, data.password).then(({ data }) => {
    if (data.success) {
      router.push({ name: 'my-boards' });
    }
  }).catch(e => {
    if (e instanceof AxiosError) {
      if (e.status === 403) {
        extern.value = e.response?.data.error;
      }
    }
  }).finally(() => loading(false));
  return false;
}
</script>

<template>
  <div class="login">
    <h3>LOGIN</h3>
    <form @submit="register">
      <div class="row">
        <MyInput type="text" name="username" label="Username" :validate="v.username" v-model="data.username" @input="clear" required/>
      </div>

      <div class="row">
        <MyInput type="password" name="password" label="Password" :validate="v.password" v-model="data.password" @input="clear" required />
      </div>

      <div class="row">
        Don't have account? <RouterLink :to="{ name: 'register' }" class="text-blue-400 underline">Register</RouterLink>
      </div>

      <button type="submit" class="row">Login</button>
    </form>
  </div>
</template>

<style scoped>
.login {
  margin: auto;
}

h3 {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: bold;
  margin-bottom: 1rem; 
  text-align: center;
  width: 100%;
}

button {
  background-color: #059669;
  color: white;
  padding: 0.5rem;
  font-weight: bold;
  width: 100%;
  border: none;

  &:hover {
    background-color: #10b981;
  }
}
</style>

<style>
#app {
  display: flex;
}
</style>
