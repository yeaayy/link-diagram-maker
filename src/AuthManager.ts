import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { inject, ref, watchEffect, type InjectionKey } from "vue";
import type { Router } from "vue-router";
import type { Alert } from "./alert";
import type { HttpClient } from "./http";
import sleep from "./utils/sleep";

type User = {
  name: string;
  username: string;
  emailLogin: boolean;
  emails: string[];
};

export class AuthManager {
  private readonly user = ref(undefined as undefined | null | User);
  private fetching = false;
  private showAlert = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private alert: Alert,
  ) {
    // 
  }

  async refresh() {
    while (true) {
      try {
        const { data } = await this.http.auth.getUser();
        if (data.login) {
          this.user.value = {
            name: data.name,
            username: data.username,
            emailLogin: data.email_login,
            emails: data.emails,
          };
        } else {
          this.user.value = null;
        }
        break;
      } catch(e: unknown) {
        await sleep(5000);
      }
    }
  }

  getUser() {
    if (this.fetching) {
      return this.user;
    }
    this.fetching = true;
    this.refresh();
    return this.user;
  }

  getUserCache() {
    return this.user;
  }

  redirectIntended() {
    watchEffect(() => {
      const user = this.getUser().value;
      if (user) {
        this.router.push({ name: 'my-boards' });
      }
    });
  }

  protect() {
    watchEffect(() => {
      const user = this.getUser().value;
      if (user === null) {
        if (this.showAlert) {
          this.alert({
            icon: faCircleInfo,
            title: 'Session expired',
            body: 'Your session has been expired, please login to continue.',
            local: false,
          });
          this.showAlert = true;
        }
        this.router.push({ name: 'login' });
      }
    });
  }

  invalidate() {
    this.showAlert = false;
    this.user.value = null;
  }
}

export const authManagerKey = Symbol() as InjectionKey<AuthManager>;
export function useAuthManager() {
  return inject(authManagerKey)!;
}
