import { ref } from "vue";
import type { HttpClient } from "./http";
import sleep from "./utils/sleep";

const userData = ref({
  username: null as (null | string),
});

let http: HttpClient;
let fetched = false;

async function fetch() {
  if (fetched) return;
  fetched = true;
  
  while (true) {
    try {
      const { data } = await http.auth.getUser();
      userData.value.username = data.username;
      break;
    } catch(e: unknown) {
      await sleep(5000);
    }
  }
}

export function initUserData(httpClient: HttpClient) {
  http = httpClient;
}

export function useUserData() {
  fetch();
  return userData;
}
