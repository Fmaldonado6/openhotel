import { parseArgs } from "deno/cli/parse_args.ts";
import { User } from "shared/types/user.types.ts";
import { log } from "shared/utils/log.utils.ts";

import { stopCommand } from "./stop.command.ts";
import { opCommand } from "./op.command.ts";
import { deopCommand } from "./deop.command.ts";
import { kickCommand } from "./kick.command.ts";
import { updateCommand } from "./update.command.ts";

const commandList = [
  stopCommand,
  opCommand,
  deopCommand,
  kickCommand,
  updateCommand,
];

export const executeCommand = ({
  message,
  user,
}: {
  message: string;
  user: User;
}) => {
  if (!message.startsWith("/")) return false;

  const { _ } = parseArgs(message.substring(1, message.length).split(" "));

  const foundCommand = commandList.find(({ command }) => _[0] === command);
  if (!foundCommand) return true;

  log(`Command /${foundCommand.command} executed by ${user.username}!`);
  _.shift();
  foundCommand.func({ user, args: _ });

  return true;
};
