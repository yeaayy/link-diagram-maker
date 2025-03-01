<script setup lang="ts">
import { useAuthManager } from '@/AuthManager';
import MyInput from '@/components/MyInput.vue';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { useVuelidate } from '@vuelidate/core';
import { helpers, required } from '@vuelidate/validators';
import { AxiosError } from 'axios';
import { computed, reactive, ref } from 'vue';

const loading = useLoading();

const http = useHttp();
const authManager = useAuthManager();
const data = reactive({
  auth: '',
  password: '',
});

authManager.redirectIntended();

const extern = ref<Partial<typeof data>>({});
const v = useVuelidate(computed(() => {
  return {
    auth: {
      required: helpers.withMessage('Please enter your username or email here', required),
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

  loading(true);
  http.auth.login(data.auth, data.password).then(() => {
    authManager.refresh();
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
    <form @submit="register">
      <div class="row">
        <MyInput type="text" name="auth" label="Username or email" :validate="v.auth" v-model="data.auth" @input="clear" required/>
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
