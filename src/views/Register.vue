<script setup lang="ts">
import { useAuthManager } from '@/AuthManager';
import MyInput from '@/components/MyInput.vue';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { useVuelidate } from '@vuelidate/core';
import { helpers, maxLength, minLength, required, sameAs } from '@vuelidate/validators';
import { AxiosError } from 'axios';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const loading = useLoading();

const http = useHttp();
const authManager = useAuthManager();
const router = useRouter();
const data = reactive({
  name: '',
  username: '',
  password: '',
  confirmPassword: '',
});

authManager.redirectIntended();

const extern = ref<Partial<typeof data>>({});
const v = useVuelidate(computed(() => {
  return {
    name: {
      required: helpers.withMessage('Please enter your name', required),
    },
    username: {
      required: helpers.withMessage('Please enter your username', required),
      minLength: helpers.withMessage('Username must be at least 3 characters', minLength(3)),
      maxLength: helpers.withMessage('Username must be not have more than 40 characters', maxLength(40)),
    },
    password: {
      required: helpers.withMessage('Password can\'t be empty', required),
      minLength: helpers.withMessage('Password must be at least 8 characters', minLength(8)),
    },
    confirmPassword: {
      required: helpers.withMessage('Confirm password can\'t be empty', required),
      sameAs: helpers.withMessage('Confirm password doesn\'t match', sameAs(data.password)),
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
  http.auth.register(data.name, data.username, data.password).then(() => {
    authManager.refresh();
  }).catch(e => {
    if (e instanceof AxiosError) {
      if (e.status === 400) {
        extern.value = e.response?.data.error;
      }
    }
  }).finally(() => loading(false));
  return false;
}

async function init() {
  try {
    const { data: result } = await http.auth.getName();
    if (result.name) {
      data.name = result.name;
    } else {
      router.push({ name: 'login' });
    }
  } catch (e) {}
}

onMounted(init);
</script>

<template>
  <div class="register" v-title="'Register'">
    <h3>REGISTER</h3>
    <form @submit="register">
      <div class="row">
        <MyInput type="text" name="name" label="Name" :validate="v.name" v-model="data.name" @input="clear" required/>
      </div>

      <div class="row">
        <MyInput type="text" name="username" label="Username" :validate="v.username" v-model="data.username" @input="clear" required/>
      </div>

      <div class="row">
        <MyInput type="password" name="password" label="Password" :validate="v.password" v-model="data.password" @input="clear" required />
      </div>

      <div class="row">
        <MyInput type="password" name="confirmPassword" label="Confirm password" :validate="v.confirmPassword" v-model="data.confirmPassword" @input="clear" required />
      </div>

      <button type="submit" class="row">Register</button>
    </form>
  </div>
</template>

<style scoped>
.register {
  margin: auto;
  min-width: 20rem;
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
