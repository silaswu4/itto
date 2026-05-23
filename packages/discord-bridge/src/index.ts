/**
 * OPTIONAL DIY voice bridge. Not wired up by default — Hermes' Discord plugin
 * is the primary path. See README.md in this package before touching this.
 *
 * Intentionally a no-op stub so the workspace type-checks without pulling in
 * discord.js / Deepgram / ElevenLabs until we commit to the DIY path.
 */

export interface VoiceBridge {
  /** Join the configured voice channel and start receiving audio. */
  connect(): Promise<void>;
  /** Speak text in the call (streaming TTS). */
  say(text: string): Promise<void>;
  /** Register a handler for transcribed player speech. */
  onTranscript(handler: (text: string, speakerId: string) => void): void;
  disconnect(): Promise<void>;
}

export function createVoiceBridge(): VoiceBridge {
  throw new Error(
    "discord-bridge is a stub. Use Hermes' Discord plugin, or implement this per packages/discord-bridge/README.md.",
  );
}
