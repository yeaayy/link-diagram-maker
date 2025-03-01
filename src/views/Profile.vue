<script setup lang="ts">
import Navbar from '@/components/Navbar.vue';
import ChangePassword from '@/components/profile/ChangePassword.vue';
import DeleteAccount from '@/components/profile/DeleteAccount.vue';
import EditUser from '@/components/profile/EditUser.vue';
import EmailList from '@/components/profile/EmailList.vue';
import { faEnvelope, faLock, faMailBulk, faUser, faUserSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
</script>

<template>
  <div class="app-content" v-title="'Profile'">
    <Navbar />

    <h3>
      <FontAwesomeIcon :icon="faUser" />
      PROFILE
    </h3>
    <hr>

    <EditUser />

    <h3>
      <FontAwesomeIcon :icon="faEnvelope" />
      E-Mail
    </h3>
    <hr>

    <EmailList />

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
