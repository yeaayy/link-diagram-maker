<script setup lang="ts">
import { useAlert } from '@/alert';
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { useUserData } from '@/userdata';
import { faInfoCircle, faSave, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import useVuelidate from '@vuelidate/core';
import { helpers, maxLength, minLength } from '@vuelidate/validators';
import { AxiosError } from 'axios';
import { computed, reactive, ref } from 'vue';
import Card from '../Card.vue';
import MyButton from '../MyButton.vue';
import MyInput from '../MyInput.vue';

const userData = useUserData();
const http = useHttp();
const alert = useAlert();
const loading = useLoading();

const data = reactive({
  name: userData.value?.name,
});

const extern = ref<Partial<typeof data>>({});
const v = useVuelidate(computed(() => {
  return {
    name: {
      minLength: helpers.withMessage('Name must be at least 3 characters', minLength(3)),
      maxLength: helpers.withMessage('Name must be not have more than 255 characters', maxLength(255)),
    },
  };
}), data, { $externalResults: extern });

async function changeName(e: Event) {
  e.preventDefault();
  const result = await v.value.$validate();
  if (!result) return false;
  v.value.$clearExternalResults();

  loading();
  try {
    const { data: response } = await http.auth.setName(data.name!);
    if (response.success) {
      alert({
        icon: faInfoCircle,
        title: 'Name changed',
        body: `Name changed to "${data.name}"`,
      });
      userData.value!.name = data.name!;
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
  <Card>
    <template #title>
      <FontAwesomeIcon :icon="faUser" />
      ACCOUNT
    </template>

    <form @submit="changeName">
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

      <div class="row text-right">
        <MyButton type="submit" color="green">
          <FontAwesomeIcon :icon="faSave" />
          Save
        </MyButton>
      </div>
    </form>
  </Card>

</template>
