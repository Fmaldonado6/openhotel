import {
  container,
  ContainerComponent,
  DisplayObjectEvent,
  Event as KeyEvent,
  global,
  HorizontalAlign,
  isDesktop,
} from "@tu/tulip";
import { System } from "system";
import { Event, SystemEvent } from "shared/enums";
import { inputComponent } from "shared/components";
import { MAX_MESSAGES_HISTORY, STORAGE_KEY } from "shared/consts";
import { __ } from "shared/utils";

type Mutable = {
  setInputWidth: (width: number) => void;
};

export const chatInputComponent: ContainerComponent<{}, Mutable> = (props) => {
  const $container = container<{}, Mutable>(props);

  let $focused = true;
  let $typing = false;
  let $typingTimeout: number;

  let $history: string[] = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]",
  );
  let $historyIndex = -1;

  const setTyping = (text: string) => {
    if (text.startsWith("/")) return;
    if (!$typing) {
      System.proxy.emit(Event.TYPING_START, {});
    }

    $typing = true;
    clearTimeout($typingTimeout);
    $typingTimeout = setTimeout(() => {
      $typing = false;
      System.proxy.emit(Event.TYPING_END, {});
    }, 800);
  };

  const $input = inputComponent({
    placeholder: __("Click here or press 'c' to write a message"),
    horizontalAlign: HorizontalAlign.LEFT,
    width: 10,
    maxLength: 128,

    onTextChange: (_, postText) => {
      setTyping(postText);
      return true;
    },
  });
  if (isDesktop()) $input.focus();

  const setInputWidth = (width: number) => {
    $input.setSize({ width, height: 14 });
  };

  $container.add($input);

  const $sendMessage = () => {
    const message = $input.getValue().trim();
    $input.clear();
    if (!message.length) return;
    $historyIndex = -1;

    $history.unshift(message);
    if ($history.length > MAX_MESSAGES_HISTORY) $history.pop();

    localStorage.setItem(STORAGE_KEY, JSON.stringify($history));

    System.proxy.emit(Event.MESSAGE, {
      message,
    });
  };

  const removeOnKeyUp = global.events.on(
    KeyEvent.KEY_UP,
    ({ key }: KeyboardEvent) => {
      if (key.toLowerCase() === "c") return $input.focus();
      if (!$focused) return;

      if (key === "ArrowUp" && $history.length > 0) {
        $historyIndex = Math.min($history.length - 1, $historyIndex + 1);
        $input.setValue($history[$historyIndex]);
        return;
      }
      if (key === "ArrowDown" && $history.length > 0) {
        $historyIndex = Math.max(-1, $historyIndex - 1);
        if ($historyIndex >= 0) {
          $input.setValue($history[$historyIndex]);
        } else {
          $input.clear();
        }
        return;
      }

      if (key === "Enter") return $sendMessage();
    },
    $container,
  );

  const onRemoveChatInputAppendText = System.events.on(
    SystemEvent.CHAT_INPUT_APPEND_TEXT,
    (text: string) => {
      $input.setValue($input.getValue() + text);
    },
  );

  $input.on(DisplayObjectEvent.CONTEXT_ENTER, () => ($focused = true));
  $input.on(DisplayObjectEvent.CONTEXT_LEAVE, () => ($focused = false));

  $container.on(DisplayObjectEvent.DESTROYED, () => {
    removeOnKeyUp();
    onRemoveChatInputAppendText();
  });

  return $container.getComponent(chatInputComponent, {
    setInputWidth,
  });
};
