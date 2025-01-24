<script setup lang="ts">
import { ConnectionView } from '@/model/ConnectionView';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { computed, ref, shallowRef, watch, watchEffect, type ComponentInstance, type Ref } from 'vue';
import DashPreview from './DashPreview.vue';
import DeleteButton from './DeleteButton.vue';
import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';

const prop = defineProps<{
  connection: ConnectionView[];
  delete: () => void;
}>();

const size = shallowRef(null! as HTMLInputElement);
const selectDashButton = shallowRef(null! as ComponentInstance<typeof DashPreview>);
const dashDropdown = shallowRef(null! as ComponentInstance<typeof Dropdown>)
const customDash = shallowRef(false as false | string);

const multiSize = ref(false);
const multiColor = ref(false);
const multiDash = ref(false);

const defaultPattern = [
  [],
  [0, 1.5],
  [1, 1.5],
  [2, 1.5],
  [2, 2.5],
];

function set<K extends keyof ConnectionView>(name: K, value: ConnectionView[K], multiRef: Ref<boolean>) {
  for (const c of prop.connection) {
    c[name] = value;
  }
  if (multiRef.value) {
    multiRef.value = false;
  }
}

let currId: any = null;
const currSize = computed({
  get: () => prop.connection && multiSize.value ? 0 : prop.connection[0].size,
  set: (size) => set('size', size, multiSize),
});
const currColor = computed({
  get: () => prop.connection && multiColor.value ? '000000' : prop.connection[0].color,
  set: (color) => set('color', color, multiColor),
});
const currDash = computed({
  get: () => prop.connection && multiDash.value ? [] : prop.connection[0].dash,
  set: (dash: number[]) => set('dash', dash, multiDash),
});

function getConnectionId(conn: ConnectionView) {
  return conn.a.id * (conn.pa + 1) + conn.b.id * (conn.pb + 1) * 2;
}

watchEffect(() => {
  const len = prop.connection.length;
  const first = prop.connection[0];
  let mSize = false;
  let mColor = false;
  let mDash = false;
  let id = getConnectionId(first);
  for (let i = 1; i < len; i++) {
    const conn = prop.connection[i];
    mSize ||= first.size != conn.size;
    mColor ||= first.color != conn.color;
    mDash ||= !ConnectionView.isDashEqual(first.dash, conn.dash);
    id ^= getConnectionId(conn);
  }
  multiSize.value = mSize;
  multiColor.value = mColor;
  multiDash.value = mDash;

  // If list of selected connection stay the same that mean no need to re-set custom dash.
  if (id === currId) return;
  currId = id;

  if (mDash) {
    customDash.value = false;
  } else {
    const pattern = defaultPattern.find((pattern) => ConnectionView.isDashEqual(pattern, first.dash));
    if (pattern) {
      customDash.value = false;
    } else {
      customDash.value = first.dash.join(' ');
    }
  }
});

watch(customDash, (dash) => {
  if (dash === false) return;
  dash = dash.trim();
  let dashArray: number[];
  if (dash.length == 0) {
    dashArray = [];
  } else {
    dashArray = dash.split(' ').map(val => parseFloat(val));
  }

  currDash.value = dashArray;
})

function setDash(dash: number[]) {
  currDash.value = dash;
  customDash.value = false;
}

function changeSize(amount: number) {
  size.value.value = (parseInt(size.value.value) + amount).toString();
  onSizeChanged();
}

function onSizeChanged() {
  currSize.value = parseInt(size.value.value);
}

function onColorChanged(e: Event) {
  const target = e.target as HTMLInputElement;
  currColor.value = target.value.substring(1);
}

function onDelete() {
  prop.delete();
}
</script>

<template>
  <div v-if="connection" class="connection-editor">
    <DeleteButton @click="onDelete" />

    <div class="row">
      <label for="color">Color:</label>
      <span v-if="multiColor"> (multiple color)</span>
      <br>
      <input type="color" id="color" :value="'#' + currColor" @change="onColorChanged" />
    </div>

    <div class="row">
      <label for="dash">Line Dash:</label>
      <span v-if="multiDash"> (multiple pattern)</span>
      <br>
      <DashPreview ref="selectDashButton" :dash="currDash" :width="150" cap="round" @click.stop="dashDropdown.toggle()" />
      <Dropdown ref="dashDropdown" :relative="selectDashButton?.$el">
        <DropdownItem v-for="pattern in defaultPattern" @click="setDash(pattern)">
          <DashPreview :dash="pattern" :width="150" cap="round"/>
        </DropdownItem>
        <DropdownItem @click="customDash = currDash.join(' ')">Custom</DropdownItem>
      </Dropdown>
      <div v-if="customDash !== false">
        <label for="customDash">Custom Pattern:</label>
        <br>
        <input id="customDash" type="text" v-model="customDash" maxlength="10" placeholder="Dash pattern (E.g: 0 4 2 2)">
      </div>
    </div>

    <div class="row">
      <label for="size">Size:</label>
      <span v-if="multiSize"> (multiple size)</span>
      <div id="size">
        <input ref="size" type="number" id="size" min="0" :value="currSize" @change="onSizeChanged" />
        <FontAwesomeIcon @click="changeSize(-1)" class="minus" :icon="faMinus"/>
        <FontAwesomeIcon @click="changeSize(1)" class="plus" :icon="faPlus"/>
      </div>
    </div>
  </div>
</template>

<style>
.theme-light .connection-editor {
  --button-bg: #e6e6e6;
  --button-hover: lightblue;
}

.theme-dark .connection-editor {
  --button-bg: #242424;
  --button-hover: #33454b;
}
</style>

<style scoped>
.connection-editor {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  width: 25%;
  border: 1px solid var(--black);
  background-color: var(--white);
  z-index: 2;
}

input[type=number] {
  width: 3rem;
  text-align: center;
}

#size {
  display: flex;
  align-items: center;
}

.minus {
  margin-left: 0.25rem;
  border-right: 1px solid var(--white);
  padding: 0.25rem 0.5rem;
  border-top-left-radius: 0.25rem;
  border-bottom-left-radius: 0.25rem;
  background-color: var(--button-bg);

  &:hover {
    background-color: var(--button-hover);
  }
}

.plus {
  padding: 0.25rem 0.5rem;
  border-top-right-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
  background-color: var(--button-bg);

  &:hover {
    background-color: var(--button-hover);
  }
}
</style>
