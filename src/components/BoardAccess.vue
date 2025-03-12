<script setup lang="ts">
import { useHttp } from '@/http';
import { useLoading } from '@/loading';
import { faCopy, faGlobeAsia, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ref, shallowRef, type ComponentInstance } from 'vue';
import FloatRelative from './FloatRelative.vue';
import ModalDialog from './ModalDialog.vue';
import MyButton from './MyButton.vue';
import SearchUserItem from './SearchUserItem.vue';
import SelectAccessLevel from './SelectAccessLevel.vue';
import SelectUserAccess from './SelectUserAccess.vue';
import copyText from '@/utils/copy-text';
import { useRouter } from 'vue-router';

const prop = defineProps<{
  boardId: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

type UserData = {
  name: string;
  username: string;
}

type UserAccessData = UserData & { write: boolean }

const dialog = shallowRef(null as ComponentInstance<typeof ModalDialog> | null);
const router = useRouter();
const loading = useLoading();
const http = useHttp();
const publicAccess = ref(null as null | boolean);
const usersAccess = ref([] as UserAccessData[]);

const searchResult = shallowRef(null as null | UserData[]);
const showSearchResult = ref(false);
const searchInput = shallowRef(null! as HTMLInputElement);

loading();
http.board.getAccess(prop.boardId)
.then(({ data }) => {
  switch (data.public) {
    case 'no':
      publicAccess.value = null;
      break;
    case 'ro':
      publicAccess.value = false;
      break;
    case 'rw':
      publicAccess.value = true;
      break;
  }
  usersAccess.value = data.others;
}).catch(() => emit('close'))
.finally(() => loading(false));

async function search() {
  const query = searchInput.value.value;
  if (query.length < 3) {
    searchResult.value = null;
    return;
  }
  try {
    const { data } = await http.board.findUser(prop.boardId, query);
    if (data.success) {
      searchResult.value = data.result;
    }
  } catch(e) {}
}

function hideSearchResult() {
  setTimeout(() => showSearchResult.value = false, 200);
}

async function setAccess(user: UserData, writeAccess: boolean) {
  try {
    const { data: result } = await http.board.setAccess(prop.boardId, user.username, writeAccess);
    if (result.success) {
      const existingUser = usersAccess.value.find(x => x.username === user.username);
      if (existingUser) {
        existingUser.write = writeAccess;
      } else {
        usersAccess.value.push({
          ...user,
          write: writeAccess,
        });
      }
      searchResult.value = null;
      searchInput.value.value = '';
    }
  } catch(e) {}
}

async function removeAccess(username: string) {
  try {
    const { data } = await http.board.removeAccess(prop.boardId, username);
    if (data.success) {
      const index = usersAccess.value.findIndex(x => x.username === username)
      if (index !== -1) {
        usersAccess.value.splice(index, 1);
      }
    }
  } catch(e) {}
}

async function setPublicAccess(access: boolean | null) {
  try {
    const { data } = await http.board.setPublicAccess(prop.boardId, access === null ? 'no' : access ? 'rw' : 'ro');
    if (data.success) {
      publicAccess.value = access;
    }
  } catch(e) {}
}

function copyLink() {
  const path = router.resolve({ name: 'board', params: { id: prop.boardId }}).fullPath;
  copyText(`${location.protocol}//${location.host}${path}`);
}
</script>

<template>
  <ModalDialog ref="dialog" @close="emit('close')" show>
    <input
      ref="searchInput"
      type="text"
      placeholder="Enter email or username to give access"
      @keydown.enter="searchResult?.length === 1 && setAccess(searchResult![0], true)"
      @input="search"
      @focus="showSearchResult = true"
      @blur="hideSearchResult"
    />

    <div class="public-access">
      <div>
        <FontAwesomeIcon :icon="faGlobeAsia" />
        General access
      </div>
      <SelectAccessLevel
        :allow-private="true"
        :value="publicAccess"
        @value-changed="setPublicAccess"
      />
    </div>

    <div v-if="usersAccess.length > 0">User with access:</div>
    <SelectUserAccess
      v-for="data of usersAccess"
      :key="data.username"
      :name="data.name"
      :username="data.username"
      :write-access="data.write"
      @write-access-changed="setAccess(data, data.write = $event === true)"
      @remove="removeAccess(data.username)"
    />

    <br>
    <MyButton @click="copyLink">
      <FontAwesomeIcon :icon="faCopy" />
      Copy Link
    </MyButton>

    <FloatRelative
      v-if="showSearchResult"
      style="overflow: hidden scroll;"
      :relative="searchInput"
      :fit-width="true"
    >
      <SearchUserItem
        v-for="data of searchResult"
        :name="data.name"
        :username="data.username"
        @click="setAccess(data, true)"
      />
    </FloatRelative>

    <template #title>
      Sharing Option
      <button id="close" @click="dialog!.hide()">
        <FontAwesomeIcon :icon="faX" />
      </button>
    </template>
  </ModalDialog>
</template>

<style scoped>
#close {
  background: none;
  border: none;
  color: var(--black);
  margin-left: auto;
  cursor: pointer;

  &:hover {
    background-color: var(--hover-color);
  }
}

.public-access {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

input {
  width: 100%;
}
</style>
