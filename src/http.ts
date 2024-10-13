import axios, { AxiosError } from "axios";
import { inject, type InjectionKey } from "vue";
import type { Router } from "vue-router";
import type { ConnectionSnapshot, NoteSnapshot } from "./snapshot/Snapshot";
import type { AlertDialogData } from "./alert";
import { faCircleInfo, faInfo } from "@fortawesome/free-solid-svg-icons";

type DispatchAction = {
  success: boolean;
}

type BoardUpdateData = {
  id: string;
  note: NoteSnapshot[];
  conn: ConnectionSnapshot[];
}

export class HttpClient {
  private instance;

  constructor(
    private readonly router: Router,
    private readonly alert: (bodyOrTitle: string | AlertDialogData) => Promise<void>,
  ) {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE,
      headers: {
        "Content-type": "application/json",
      },
    });

    this.instance.interceptors.response.use(response => {
      return response;
    }, (error) => {
      if (error instanceof AxiosError) {
        if (error.status === 401) {
          if (this.router.currentRoute.value.name !== 'login') {
            this.alert({
              icon: faCircleInfo,
              title: 'Session expired',
              body: 'Your session has been expired, please login to continue.',
              local: false,
            });
            this.router.push({ name: 'login' });
          }
        }
      }
      return Promise.reject(error);
    });
  }

  readonly board = {
    create: () => {
      return this.instance.post<DispatchAction & {
        id: string;
      }>('board/create.php');
    },

    getAll: () => {
      return this.instance.get<DispatchAction & {
        result: {
          id: string;
          name: string;
        }[];
      }>('board/all.php');
    },

    delete: (id: string) => {
      return this.instance.post<DispatchAction>('board/delete.php', { id });
    },

    copy: (id: string) => {
      return this.instance.post<DispatchAction & {
        id: string;
        name: string;
      }>('board/duplicate.php', { id });
    },

    get: (id: string) => {
      return this.instance.get<{
        name: string,
        editable: boolean,
        notes: {
          id: string,
          x: string,
          y: string,
          text: string,
          img: null | string,
        }[],
        conns: {
          note_1: string,
          note_2: string,
          pos_1: string,
          pos_2: string,
          color: string,
          size: string,
        }[],
      }>('board/get.php', {
        params: { id }
      });
    },

    update: (data: BoardUpdateData) => {
      return this.instance.post('board/update.php', data);
    },

    rename: (boardId: string, newName: string) => {
      return this.instance.post<DispatchAction>('board/rename.php', {
        name: newName,
        id: boardId,
      })
    }
  }

  readonly auth = {
    login: (username: string, password: string) => {
      return this.instance.post<DispatchAction>('login.php', { username, password });
    },

    register: (username: string, password: string) => {
      return this.instance.post<DispatchAction>('register.php', { username, password });
    },
  }

  readonly img = {
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return this.instance.post<{
        id: string;
        path: string;
        name: string;
      }>('img/upload.php', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    delete: (id: any) => {
      return this.instance.post<DispatchAction>('img/delete.php', {
        img: id,
      });
    },

    get: () => {
      return this.instance.get<DispatchAction & {
        result: {
          id: any;
          name: string;
          path: string;
          hash: string;
        }[],
      }>('img/get.php');
    }
  }

}

export const httpKey = Symbol() as InjectionKey<HttpClient>;

export function useHttp() {
  return inject(httpKey)!;
}
