import type { DirectiveBinding } from "vue";

type TitleTransformer = (title: string | null) => string;

type TitleStack = {
  el: any;
  title: string;
}

export default function createTitleDirective(
  transform: TitleTransformer | null = null,
) {
  const stack = [] as TitleStack[];

  function t(title: string | null): string {
    return transform ? transform(title) : (title ?? '');
  }

  return {
    mounted(el: any, binding: DirectiveBinding<string>) {
      const item: TitleStack = {
        el,
        title: t(binding.value),
      };
      stack.push(item);
      document.title = item.title;
    },

    updated(el: any, binding: DirectiveBinding<string>) {
      const item = stack.find(i => i.el === el);
      if (item) {
        item.title = t(binding.value);
      }
      if (item === stack[stack.length - 1]) {
        document.title = item.title;
      }
    },

    beforeUnmount(el: any, binding: DirectiveBinding<string>) {
      const index = stack.findIndex(i => i.el === el);
      stack.splice(index, 1);
      if (stack.length === 0) {
        document.title = t(null)
      } else if (index === stack.length) {
        document.title = stack[index - 1].title;
      }
    },
  }
}
