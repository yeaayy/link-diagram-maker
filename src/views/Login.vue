<script setup lang="ts">
import MyInput from '@/components/MyInput.vue';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { useUserData } from '@/userdata';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useVuelidate } from '@vuelidate/core';
import { email, helpers, required } from '@vuelidate/validators';
import { AxiosError } from 'axios';
import { computed, reactive, ref, watch, watchEffect } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const loading = useLoading();
const router = useRouter();

const http = useHttp();
const userData = useUserData();
const data = reactive({
  email: '',
  password: '',
});

watchEffect(() => {
  if (userData.value !== null) {
    router.push({ name: 'my-boards' });
  }
});

const extern = ref<Partial<typeof data>>({});
const v = useVuelidate(computed(() => {
  return {
    email: {
      required: helpers.withMessage('Username can\'t be empty', required),
      email,
    },
    password: {
      required: helpers.withMessage('Password can\'t be empty', required),
    },
  };
}), data, { $externalResults: extern });

function clear() {
  v.value.$clearExternalResults();
}

async function login(e: Event) {
  e.preventDefault();
  const result = await v.value.$validate();
  if (!result) return false;
  clear();

  http.auth.login(data.email, data.password).then(({ data: result }) => {
    if (result.success) {
      userData.value = {
        email: data.email,
        name: result.name,
      };
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

function loginWithGoogle() {
  location.href = './oauth/google.php';
}
</script>

<template>
  <div class="login" v-title="'Login'">
    <h3>LOGIN</h3>
    <form @submit="login">
      <div class="row">
        <MyInput type="email" name="email" label="Email" :validate="v.email" v-model="data.email" @input="clear" required/>
      </div>

      <div class="row">
        <MyInput type="password" name="password" label="Password" :validate="v.password" v-model="data.password" @input="clear" required />
      </div>

      <button type="submit" class="row">Login</button>

      <div class="or">
        <div class="line"></div>
        <div class="text">or</div>
        <div class="line"></div>
      </div>

      <div class="row">
        <div class="w-google" @click="loginWithGoogle()">
          <FontAwesomeIcon :icon="faGoogle" />
          Login with Google
        </div>
      </div>
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

.or {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.5rem;
  &>.text {
    margin-left: 0.25rem;
    margin-right: 0.25rem;
  }
  &>.line {
    height: 1px;
    flex-grow: 1;
    background-color: #888;
  }
}

.w-google {
  background-color: #db4a39;
  color: white;
  padding: 0.5rem 0px;
  border-radius: 0.25rem;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:hover {
    background-color: #e47f74;
  }

  &>svg {
    padding: 0.5rem;
  }
}
</style>

<style>
#app {
  display: flex;
}
</style>
