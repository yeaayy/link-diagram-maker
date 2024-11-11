<script setup lang="ts">
import { useConfirm } from '@/confirm';
import { useHttp } from '@/http';
import { useUserData } from '@/userdata';
import { faFileAlt, faSignOut, faSignOutAlt, faUser, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef, type ComponentInstance, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';
import ThemeSelector from './ThemeSelector.vue';

const menuButton = shallowRef(null! as HTMLElement);
const menuDropdown = shallowRef(null! as ComponentInstance<typeof Dropdown>);
const userData = useUserData();
const router = useRouter();
const confirm = useConfirm();
const http = useHttp();

function openMyDiagram() {
  router.push({ name: 'my-boards' });
}

function openProfile() {
  router.push({ name: 'profile' });
}

watchEffect(() => {
  if (userData.value.username === null) {
    router.push({ name: 'login' });
  }
});

async function confirmLogout() {
  const confirmed = await confirm({
    icon: faSignOutAlt,
    title: 'Log Out',
    body: 'Are you sure you want to log out?',
  });
  if (!confirmed) return;

  const { data } = await http.auth.logout();
  if (data.success) {
    userData.value.username = null;
  }
}
</script>

<template>
  <div class="navbar">
    <ThemeSelector />
    <div ref="menuButton" class="menu" @click="menuDropdown.toggle()">
      <FontAwesomeIcon class="user" :icon="faUserCircle" />
      <div>{{ userData.username }}</div>
    </div>

    <Dropdown ref="menuDropdown" :relative="menuButton">
      <DropdownItem @click="openMyDiagram">
        <FontAwesomeIcon :icon="faFileAlt" />
        My Diagrams
      </DropdownItem>

      <DropdownItem @click="openProfile">
        <FontAwesomeIcon :icon="faUser" />
        Profile
      </DropdownItem>

      <DropdownItem @click="confirmLogout">
        <FontAwesomeIcon :icon="faSignOut" />
        Log out
      </DropdownItem>
    </Dropdown>
  </div>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: end;
}

.user {
  font-size: 1.5rem;
  margin-right: 0.25rem;
  display: block;
}

.menu {
  margin-left: 0.25rem;
  padding: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 0.25rem;

  &:hover {
    box-shadow: 0px 0px 0.125rem var(--black);
    background-color: #bfdbfe;
  }
}
</style>
