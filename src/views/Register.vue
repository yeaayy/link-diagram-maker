<script setup lang="ts">
import MyInput from '@/components/MyInput.vue';
import http from '@/http';
import { useLoading } from '@/loading';
import { useVuelidate } from '@vuelidate/core';
import { helpers, minLength, required, sameAs } from '@vuelidate/validators';
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const loading = useLoading();
const router = useRouter();

const data = reactive({
  username: '',
  password: '',
  confirmPassword: '',
});

const extern = ref<Partial<typeof data>>({});
const v = useVuelidate(computed(() => {
  return {
    username: {
      minLength: helpers.withMessage('Password must be at least 3 character', minLength(3)),
    },
    password: {
      minLength: helpers.withMessage('Password must be at least 8 character', minLength(8)),
    },
    confirmPassword: {
      sameAs: helpers.withMessage('Confimation password doesn\'t match', sameAs(data.password)),
    },
  };
}), data, { $externalResults: extern });

async function register(e: Event) {
  e.preventDefault();
  const result = await v.value.$validate();
  if (!result) return false;
  v.value.$clearExternalResults();

  http.post('/register.php', {
    username: data.username,
    password: data.password,
  }).then(({ data }) => {
    if (data.error) {
      extern.value = data.error;
    } else {
      router.push({ name: 'my-boards' });
    }
  }).finally(() => loading(false));
  return false;
}
</script>

<template>
  <div class="register m-auto">
    <h3>REGISTER</h3>
    <form @submit="register">
      <div class="row">
        <MyInput type="text" name="username" label="Username" :validate="v.username" v-model="data.username" required/>
      </div>

      <div class="row">
        <MyInput type="password" name="password" label="Password" :validate="v.password" v-model="data.password" required />
      </div>

      <div class="row">
        <MyInput type="password" name="confirmPassword" label="Confirm Password" :validate="v.confirmPassword" v-model="data.confirmPassword" required />
      </div>

      <div class="row">
        Already have account? <RouterLink :to="{ name: 'login' }">login</RouterLink>
      </div>

      <button type="submit">Register</button>
    </form>
  </div>
</template>

<style scoped>
.register {
  margin: auto;
}

h3 {
  font-size: 1.25rem;
  line-height: 1.75rem;
  width: 100%;
  font-weight: bold;
  margin-bottom: 1rem; 
  text-align: center;
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
