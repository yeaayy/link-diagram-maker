<script setup lang="ts">
import { useAlert } from '@/alert';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { faInfoCircle, faLock, faSave } from '@fortawesome/free-solid-svg-icons';
import useVuelidate from '@vuelidate/core';
import { helpers, minLength, required, sameAs } from '@vuelidate/validators';
import { AxiosError } from 'axios';
import { computed, reactive, ref } from 'vue';
import MyInput from '../MyInput.vue';
import Card from '../Card.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import MyButton from '../MyButton.vue';

const http = useHttp();
const alert = useAlert();
const loading = useLoading();

const data = reactive({
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
});

const extern = ref<Partial<typeof data>>({});
const v = useVuelidate(computed(() => {
  return {
    newPassword: {
      required: helpers.withMessage('New password is required.', required),
      minLength: helpers.withMessage('New password must be at least 8 characters.', minLength(8)),
    },
    confirmNewPassword: {
      required: helpers.withMessage('Confirm password is required.', required),
      sameAs: helpers.withMessage('Confirm password doesn\'t match.', sameAs(data.newPassword)),
    },
  };
}), data, { $externalResults: extern });

async function changePassword(e: Event) {
  e.preventDefault();
  const result = await v.value.$validate();
  if (!result) return false;
  v.value.$clearExternalResults();

  loading();
  try {
    const { data: response } = await http.auth.setPassword(data.oldPassword, data.newPassword);
    if (response.success) {
      alert({
        icon: faInfoCircle,
        title: 'Password changed',
        body: `Your password has been successfuly changed.`,
      });
      data.oldPassword = '';
      data.newPassword = '';
      data.confirmNewPassword = '';
      v.value.$reset();
    }
  } catch(e: unknown) {
    if (e instanceof AxiosError) {
      if (e.response?.data.error) {
        const error = e.response?.data.error;
        extern.value = {
          oldPassword: error.old_password,
          newPassword: error.new_password,
        };
      }
    }
  }
  loading(false);
}

function clearExtern() {
  v.value.$clearExternalResults();
}
</script>

<template>
  <Card>
    <template #title>
      <FontAwesomeIcon :icon="faLock" />
      CHANGE PASSWORD
    </template>
    <form @submit="changePassword">
      <div class="row">
        <MyInput
          type="password"
          name="old_password"
          label="Old password"
          :validate="v.oldPassword"
          v-model="data.oldPassword"
          @input="clearExtern" />
      </div>

      <div class="row">
        <MyInput
          type="password"
          name="new_password"
          label="New password"
          :validate="v.newPassword"
          v-model="data.newPassword"
          @input="clearExtern"
          required />
      </div>

      <div class="row">
        <MyInput
          type="password"
          name="confirm_new_password"
          label="Confirm new password"
          :validate="v.confirmNewPassword"
          v-model="data.confirmNewPassword"
          @input="clearExtern"
          required />
      </div>

      <div class="row text-right">
        <MyButton color="green">
          <FontAwesomeIcon :icon="faSave" />
          Change Password
        </MyButton>
      </div>
    </form>
  </Card>
</template>
