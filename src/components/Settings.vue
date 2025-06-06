<script setup lang="ts">
import { faGear, faKeyboard, faUser, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ref, type ComponentInstance } from 'vue';
import ModalDialog from './ModalDialog.vue';
import ProfileView from './profile/view.vue';
import SettingsGeneral from './settings/general.vue';
import SettingsShortcut from './settings/shortcut.vue';
import TabContainer from './tab/container.vue';
import TabItem from './tab/item.vue';

const dialog = ref(null! as ComponentInstance<typeof ModalDialog>);

const tabOpen = ref(null! as string);
</script>

<template>
  <div id="settings-button" @click="dialog.show()">
    <FontAwesomeIcon :icon="faGear" />
  </div>

  <ModalDialog id="settings-dialog" ref="dialog">
    <template #title>
      <h3>
        Settings
      </h3>
      <FontAwesomeIcon class="close" :icon="faX" @click="dialog.hide()" title="close" />
    </template>
    <TabContainer default="general" v-model="tabOpen">
      <div class="tabs">
        <TabItem name="general" v-slot="props">
          <div v-bind="props">
            <FontAwesomeIcon :icon="faGear" />
            General
          </div>
        </TabItem>
        <TabItem name="profile" v-slot="props">
          <div v-bind="props">
            <FontAwesomeIcon :icon="faUser" />
            Profile
          </div>
        </TabItem>
        <TabItem name="shortcut" v-slot="props">
          <div v-bind="props">
            <FontAwesomeIcon :icon="faKeyboard" />
            Shortcut
          </div>
        </TabItem>
      </div>
    </TabContainer>

    <div class="content">
      <ProfileView v-if="tabOpen === 'profile'" />
      <SettingsGeneral v-else-if="tabOpen === 'general'" />
      <SettingsShortcut v-else />
    </div>
  </ModalDialog>
</template>

<style scoped>
#settings-button {
  width: 2rem;
  font-size: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:hover {
    background-color: var(--hover-color);
  }
}

.tabs {
  display: flex;

  > * {
    padding: 0.5rem;
    border-bottom: 1px solid var(--black);
    white-space: nowrap;
    cursor: pointer;
  }

  > *:hover {
    background-color: var(--hover-color);
  }
}

h3 {
  line-height: 1;
  margin-block: initial;
}

.close {
  margin-left: auto;
  cursor: pointer;

  &:hover {
    background-color: var(--hover-color);
  }
}

.content {
  flex: 1;
  padding: 1rem;
  overflow: auto;
}

@media (max-width: 59.99rem) {
.tabs {
  overflow-x: scroll;

  > * {
    flex: 1 1;
    text-align: center;
  }

  > *:not(:first-child) {
    border-left: 1px solid var(--black);
  }

  .active {
    border-bottom: 0.35rem solid var(--active-color);
  }
}
}

@media (min-width: 60rem) {
.tabs {
  border-right: 1px solid var(--black);
  flex-direction: column;

  > * {
    border-left: 0.5rem solid transparent;
  }

  > .active {
    border-left-color: var(--active-color);
  }
}
}
</style>

<style>
#settings-dialog > .modal {
  height: calc(100% - 1rem);
  display: flex;
  flex-direction: column;

  > .body {
    padding: 0px;
    min-height: 0;
    flex: 1 1;
    display: flex;
    flex-direction: column;
  }
}

@media (min-width: 21rem) {
  #settings-dialog {
    --modal-width: calc(100% - 1rem);
  }
}

@media (min-width: 60rem) {
  #settings-dialog {
    --modal-width: 59rem;

    > .modal > .body {
      flex-direction: row;
    }
  }
}

</style>
