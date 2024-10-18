<script setup lang="ts">
import Navbar from '@/components/Navbar.vue';
import AccountSettings from '@/components/profile/AccountSettings.vue';
import DeleteAccount from '@/components/profile/DeleteAccount.vue';
import PasswordSettings from '@/components/profile/PasswordSettings.vue';

</script>

<template>
  <div class="app-content" v-title="'Profile'">
    <Navbar />

    <div class="flex">
      <AccountSettings />
      <PasswordSettings />
      <DeleteAccount />
    </div>
  </div>
</template>

<style scoped>
.flex {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  justify-items: start;
}
</style>
