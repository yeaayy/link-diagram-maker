<script setup lang="ts">
import ChangePassword from '@/components/profile/ChangePassword.vue';
import DeleteAccount from '@/components/profile/DeleteAccount.vue';
import EditUser from '@/components/profile/EditUser.vue';
import EmailList from '@/components/profile/EmailList.vue';
import { faEnvelope, faLock, faUser, faUserSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
</script>

<template>
  <div>
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
  margin-bottom: 0rem;
  margin-top: 2rem;

  &:first-of-type {
    margin-top: 0;
  }
}

hr {
  margin-top: 0rem;
}
</style>
