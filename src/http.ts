import axios, { AxiosError } from "axios";
import { inject, type InjectionKey } from "vue";
import type { ConnectionSnapshotAction, NoteSnapshotAction } from "./snapshot/Snapshot";
import TypedEventListener from "./utils/TypedEventListener";

type DispatchAction = {
  success: boolean;
}

type BoardUpdateData = {
  id: string;
  note: NoteSnapshotAction[];
  conn: ConnectionSnapshotAction[];
}

export type BoardAccessResponse = {
  public: 'no' | 'ro' | 'rw';
  others: {
    name: string;
    username: string;
    write: boolean;
  }[];
}

export type BoardData = {
  name: string,
  editable: boolean,
  full_access: boolean,
  notes: {
    id: string,
    x: string,
    y: string,
    text: string,
    img: null | {path: string, id: string},
  }[],
  conns: {
    note_1: string,
    note_2: string,
    pos_1: string,
    pos_2: string,
    color: string,
    size: string,
    dash: string,
  }[],
};

export type UserData = {
  name: string;
  username: string;
  email_login: boolean;
}

export type UserDataResponse = {
  login: true;
  emails: string[];
} & UserData

export type GetUserResponse = { login: true } & UserDataResponse | { login: false };

export class HttpClient {
  private instance;
  public readonly forbiden = new TypedEventListener<AxiosError>();

  constructor() {
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
          this.forbiden.emit(error);
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
          owner: string;
          write_access: boolean | null;
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
      return this.instance.get<BoardData>('board/get.php', {
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
    },

    getAccess: (boardId: string) => {
      return this.instance.get<BoardAccessResponse>('board/get_access.php', {
        params: { id: boardId },
      });
    },

    findUser: (boardId: string, query: string) => {
      return this.instance.post<DispatchAction & {
        result: {
          name: string;
          username: string;
        }[];
      }>('board/find.php', {
        id: boardId,
        q: query,
      });
    },

    setAccess: (boardId: string, username: string, write: boolean) => {
      return this.instance.post<DispatchAction>('board/set_access.php', {
        id: boardId,
        username,
        write,
      });
    },

    removeAccess: (boardId: string, username: string) => {
      return this.instance.post<DispatchAction>('board/remove_access.php', {
        id: boardId,
        username,
      });
    },

    setPublicAccess: (boardId: string, access: 'no' | 'ro' | 'rw') => {
      return this.instance.post<DispatchAction>('board/set_public_access.php', {
        id: boardId,
        access,
      })
    }
  }

  readonly auth = {
    login: (auth: string, password: string) => {
      return this.instance.post<DispatchAction>('login.php', { auth, password });
    },

    logout: () => {
      return this.instance.post<DispatchAction>('logout.php');
    },

    register: (name: string, username: string, password: string) => {
      return this.instance.post('user/register.php', { name, username, password });
    },

    getUser: () => {
      return this.instance.get<GetUserResponse>('user.php');
    },

    updateUserdata: (data: Partial<UserData>) => {
      return this.instance.post<DispatchAction>('user/update.php', data);
    },

    setPassword: (oldPassword: string, newPassword: string) => {
      return this.instance.post<DispatchAction>('change_password.php', {
        old_password: oldPassword,
        new_password: newPassword,
      });
    },

    deleteAccount: (password: string) => {
      return this.instance.post<DispatchAction & {
        token: string;
      }>('delete_account.php', { password });
    },

    confirmDeleteAccount: (token: string) => {
      return this.instance.post<DispatchAction>('confirm_delete_account.php', { token });
    },

    getName: () => {
      return this.instance.get<{ name: string | null }>('user/get_name.php');
    },

    removeEmail: (email: string) => {
      return this.instance.post<DispatchAction>('user/remove_email.php', { email });
    },
  }

  readonly img = {
    upload: (boardId: string, file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return this.instance.post<{
        success: true;
        id: string;
        path: string;
        name: string;
      } | {
        success: false;
      }>('img/upload.php', formData, {
        params: {
          id: boardId,
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    delete: (boardId: string, id: any) => {
      return this.instance.post<DispatchAction>('img/delete.php', {
        id: boardId,
        img: id,
      });
    },

    get: (boardId: string) => {
      return this.instance.get<DispatchAction & {
        result: {
          id: any;
          name: string;
          path: string;
          hash: string;
        }[],
      }>('img/get.php', {
        params: { id: boardId },
      });
    }
  }

}

export const httpKey = Symbol() as InjectionKey<HttpClient>;

export function useHttp() {
  return inject(httpKey)!;
}
