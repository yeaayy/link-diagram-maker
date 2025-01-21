<script setup lang="ts">
import { ConnectionView } from '@/model/ConnectionView';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { shallowRef, watchEffect, type ComponentInstance, watch } from 'vue';
import DashPreview from './DashPreview.vue';
import DeleteButton from './DeleteButton.vue';
import Dropdown from './Dropdown.vue';
import DropdownItem from './DropdownItem.vue';

const prop = defineProps<{
  connection: ConnectionView | null;
}>();

const size = shallowRef(null! as HTMLInputElement);
const selectDashButton = shallowRef(null! as ComponentInstance<typeof DashPreview>);
const dashDropdown = shallowRef(null! as ComponentInstance<typeof Dropdown>)

const currentDash = shallowRef([] as number[]);
const customDash = shallowRef(false as false | string);

const defaultPattern = [
  [],
  [0, 1.5],
  [1, 1.5],
  [2, 1.5],
  [2, 2.5],
];

watchEffect(() => {
  const dash = prop.connection?.dash || [];
  currentDash.value = dash;

  let isCustomPattern = true;
  for (const pattern of defaultPattern) {
    if (ConnectionView.isDashEqual(dash, pattern)) {
      isCustomPattern = false;
      break;
    }
  }

  if (isCustomPattern) {
    customDash.value = dash.join(' ');
  } else {
    customDash.value = false;
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

  currentDash.value = dashArray;
  prop.connection!.dash = dashArray;
})

function setDash(dash: number[]) {
  prop.connection!.dash = dash;
  currentDash.value = dash;
  customDash.value = false;
}

function changeSize(amount: number) {
  size.value.value = (parseInt(size.value.value) + amount).toString();
  onSizeChanged();
}

function onSizeChanged() {
  prop.connection!.size = parseInt(size.value.value);
}

function onColorChanged(e: Event) {
  const target = e.target as HTMLInputElement;
  prop.connection!.color = target.value.substring(1);
}

function onDelete() {
  prop.connection!.destroy();
}
</script>

<template>
  <div v-if="connection" class="connection-editor">
    <DeleteButton @click="onDelete" />

    <div class="row">
      <label for="color">Color:</label>
      <br>
      <input type="color" id="color" :value="'#' + connection.color" @change="onColorChanged" />
    </div>

    <div class="row">
      <label for="dash">Line Dash:</label>
      <br>
      <DashPreview ref="selectDashButton" :dash="currentDash" :width="150" cap="round" @click.stop="dashDropdown.toggle()" />
      <Dropdown ref="dashDropdown" :relative="selectDashButton?.$el">
        <DropdownItem v-for="pattern in defaultPattern" @click="setDash(pattern)">
          <DashPreview :dash="pattern" :width="150" cap="round"/>
        </DropdownItem>
        <DropdownItem @click="customDash = currentDash.join(' ')">Custom</DropdownItem>
      </Dropdown>
      <div v-if="customDash !== false">
        <label for="customDash">Custom Pattern:</label>
        <br>
        <input id="customDash" type="text" v-model="customDash" maxlength="10" placeholder="Dash pattern (E.g: 0 4 2 2)">
      </div>
    </div>

    <div class="row">
      <label for="size">Size:</label>
      <div id="size">
        <input ref="size" type="number" id="size" min="0" :value="connection.size" @change="onSizeChanged" />
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
