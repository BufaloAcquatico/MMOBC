/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { API_Character } from "./apiCharacter";
import { API_Connector, MessageEvent } from "./apiConnector";
import { BC_Server_ChatRoomMessage } from "./logicEvent";

type CommandCallback = (
    sender: API_Character,
    msg: BC_Server_ChatRoomMessage,
    args: string[],
) => void;

const SLASH_BOT_PREFIX = "ChatRoomBot ";

export class CommandParser {
    private commands = new Map<string, CommandCallback>();

    public constructor(private conn: API_Connector) {
        conn.on("Message", this.onMessage);
    }

    public register(cmd: string, cb: CommandCallback) {
        this.commands.set(cmd, cb);
    }

    private onMessage = (ev: MessageEvent) => {
        // trim any leading or trailing parentheses from the message
        const msg = ev.message.Content.replace(/^\(+/, "").replace(/\)+$/, "");

        if (
            ["Whisper", "Chat"].includes(ev.message.Type) &&
            msg.startsWith("!") &&
            msg.length > 1
        ) {
            const cmdString = msg.substring(1);

            this.processCmdString(ev, cmdString);
        } else if (
            ev.message.Type === "Hidden" &&
            ev.message.Content.startsWith(SLASH_BOT_PREFIX)
        ) {
            const cmdString = msg
                .substring(SLASH_BOT_PREFIX.length)
                .trimStart();
            this.processCmdString(ev, cmdString);
        }
    };

    private processCmdString(ev: MessageEvent, cmdString: string): void {
        const parts = cmdString.toLowerCase().split(" ");
        const cmd = parts.shift();
        const cb = this.commands.get(cmd);
        if (cb) {
            try {
                cb(ev.sender, ev.message, parts);
            } catch (e) {
                console.log("Command handler threw exception", e);
            }
        }
    }
}
