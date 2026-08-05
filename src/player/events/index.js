import { Events } from "kazagumo";
import createOnPlayerStart from "./onPlayerStart.js";
import createOnPlayerEmpty from "./onPlayerEmpty.js";
import createOnPlayerClosed from "./onPlayerClosed.js";
import createOnPlayerDestroy from "./onPlayerDestroy.js";
import createOnPlayerException from "./onPlayerException.js";
import createOnPlayerStuck from "./onPlayerStuck.js";
import createOnPlayerResolveError from "./onPlayerResolveError.js";
import registerNodeEvents from "./nodeEvents.js";

/**
 * Single wiring point for every audio lifecycle listener.
 * @param {import("../../client/Bot.js").default} client
 * @param {import("kazagumo").Kazagumo} kazagumo
 * @returns {void}
 */
export default function registerPlayerEvents(client, kazagumo) {
  kazagumo.on(Events.PlayerStart, createOnPlayerStart(client));
  kazagumo.on(Events.PlayerEmpty, createOnPlayerEmpty(client));
  kazagumo.on(Events.PlayerClosed, createOnPlayerClosed(client));
  kazagumo.on(Events.PlayerDestroy, createOnPlayerDestroy(client));
  kazagumo.on(Events.PlayerException, createOnPlayerException(client));
  kazagumo.on(Events.PlayerStuck, createOnPlayerStuck(client));
  kazagumo.on(Events.PlayerResolveError, createOnPlayerResolveError(client));

  registerNodeEvents(client, kazagumo.shoukaku);
}
