<script setup lang="ts">
import Navbar from '@/components/Navbar.vue';
import ChangePassword from '@/components/profile/ChangePassword.vue';
import ChangeUsername from '@/components/profile/ChangeUsername.vue';
import DeleteAccount from '@/components/profile/DeleteAccount.vue';
import { faLock, faUser, faUserSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
</script>

<template>
  <div class="app-content" v-title="'Profile'">
    <Navbar />

    <h3>
      <FontAwesomeIcon :icon="faUser" />
      CHANGE USERNAME
    </h3>
    <hr>

    <ChangeUsername />

    <h3 class="mt">
      <FontAwesomeIcon :icon="faLock" />
      CHANGE PASSWORD
    </h3>
    <hr>

    <ChangePassword />

    <h3>
      <FontAwesomeIcon :icon="faUserSlash" />
      DELETE ACCOUNT
    </h3>
    <hr>

    <DeleteAccount />

  </div>
</template>

<style scoped>
h3 {
  margin-top: 2rem;
  margin-bottom: 0rem;
}

hr {
  margin-top: 0rem;
}
</style>
