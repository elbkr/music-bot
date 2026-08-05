import { notify } from "./support.js";
import Emojis from "../../domain/constants/Emojis.js";

/**
 * Kazagumo `playerEmpty` listener factory — fires when the queue is exhausted.
 * @param {import("../../client/Bot.js").default} client
 * @returns {(player: import("kazagumo").KazagumoPlayer) => void}
 */
export default function createOnPlayerEmpty(client) {
  return (player) => {
    notify(client, player, `${client.emoteService.get(Emojis.QUEUE)} Queue ended!`);
  };
}
