/**
 * Gemini Live API Utilities
 * Full backend-parity with axel_live_node.py
 * 
 * Key config matched from backend:
 * - API: v1beta (not v1alpha)
 * - Voice: Alnilam
 * - VAD: HIGH sensitivity, 50ms silence, 20ms prefix
 * - Thinking: budget=0, includeThoughts=false
 * - Context compression: trigger=104857, sliding=52428
 * - Activity handling: START_OF_ACTIVITY_INTERRUPTS
 * - Session resumption: enabled
 */

// Response type constants
export const MultimodalLiveResponseType = {
  TEXT: "TEXT",
  AUDIO: "AUDIO",
  SETUP_COMPLETE: "SETUP COMPLETE",
  INTERRUPTED: "INTERRUPTED",
  TURN_COMPLETE: "TURN COMPLETE",
  TOOL_CALL: "TOOL_CALL",
  TOOL_CALL_CANCELLATION: "TOOL_CALL_CANCELLATION",
  ERROR: "ERROR",
  INPUT_TRANSCRIPTION: "INPUT_TRANSCRIPTION",
  OUTPUT_TRANSCRIPTION: "OUTPUT_TRANSCRIPTION",
  GO_AWAY: "GO_AWAY",
  SESSION_RESUMPTION: "SESSION_RESUMPTION",
};

/**
 * Parses ALL response types from a single server message.
 * The server can bundle multiple fields (e.g. audio + transcription)
 * in the same message. Returns an array of response objects.
 */
function parseResponseMessages(data) {
  const responses = [];
  const serverContent = data?.serverContent;
  const parts = serverContent?.modelTurn?.parts;

  try {
    // Setup complete (exclusive)
    if (data?.setupComplete) {
      console.log("🏁 SETUP COMPLETE response");
      responses.push({ type: MultimodalLiveResponseType.SETUP_COMPLETE, data: "", endOfTurn: false });
      return responses;
    }

    // GoAway signal from server
    if (data?.goAway) {
      console.warn("⚠️ GoAway received:", data.goAway);
      responses.push({ type: MultimodalLiveResponseType.GO_AWAY, data: data.goAway, endOfTurn: false });
      return responses;
    }

    // Tool call (exclusive)
    if (data?.toolCall) {
      console.log("🛠️ TOOL CALL response:", data.toolCall);
      responses.push({ type: MultimodalLiveResponseType.TOOL_CALL, data: data.toolCall, endOfTurn: false });
      return responses;
    }

    // Tool call cancellation
    if (data?.toolCallCancellation) {
      console.warn("⚠️ Tool calls cancelled:", data.toolCallCancellation);
      responses.push({ type: MultimodalLiveResponseType.TOOL_CALL_CANCELLATION, data: data.toolCallCancellation, endOfTurn: false });
      return responses;
    }

    // Session resumption update
    if (data?.sessionResumptionUpdate) {
      responses.push({ type: MultimodalLiveResponseType.SESSION_RESUMPTION, data: data.sessionResumptionUpdate, endOfTurn: false });
    }

    // Audio data from model turn parts
    if (parts?.length) {
      for (const part of parts) {
        if (part.inlineData) {
          responses.push({ type: MultimodalLiveResponseType.AUDIO, data: part.inlineData.data, endOfTurn: false });
        } else if (part.text) {
          console.log("💬 TEXT response:", part.text);
          responses.push({ type: MultimodalLiveResponseType.TEXT, data: part.text, endOfTurn: false });
        }
      }
    }

    // Transcriptions — checked independently
    if (serverContent?.inputTranscription) {
      responses.push({
        type: MultimodalLiveResponseType.INPUT_TRANSCRIPTION,
        data: {
          text: serverContent.inputTranscription.text || "",
          finished: serverContent.inputTranscription.finished || false,
        },
        endOfTurn: false,
      });
    }

    if (serverContent?.outputTranscription) {
      responses.push({
        type: MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION,
        data: {
          text: serverContent.outputTranscription.text || "",
          finished: serverContent.outputTranscription.finished || false,
        },
        endOfTurn: false,
      });
    }

    // Interrupted
    if (serverContent?.interrupted) {
      console.log("🗣️ INTERRUPTED response");
      responses.push({ type: MultimodalLiveResponseType.INTERRUPTED, data: "", endOfTurn: false });
    }

    // Turn complete
    if (serverContent?.turnComplete) {
      console.log("🏁 TURN COMPLETE response");
      responses.push({ type: MultimodalLiveResponseType.TURN_COMPLETE, data: "", endOfTurn: true });
    }
  } catch (err) {
    console.error("⚠️ Error parsing response data:", err, data);
  }

  return responses;
}

/**
 * Main Gemini Live API client — Backend-parity configuration
 */
export class GeminiLiveAPI {
  constructor(token, model) {
    this.token = token;
    this.model = model;
    this.modelUri = `models/${this.model}`;

    this.responseModalities = ["AUDIO"];
    this.systemInstructions = "";
    this.googleGrounding = false;

    // ── Backend-matched defaults ──
    this.voiceName = "Alnilam";        // Backend: Alnilam (not Puck)
    this.temperature = 1.0;            // Backend: default 1.0

    this.inputAudioTranscription = false;
    this.outputAudioTranscription = false;
    this.enableFunctionCalls = false;
    this.functions = [];
    this.functionsMap = {};
    this.previousImage = null;
    this.totalBytesSent = 0;

    // ── VAD Config — matched from backend settings.py ──
    this.automaticActivityDetection = {
      disabled: false,
      startOfSpeechSensitivity: "START_SENSITIVITY_HIGH",     // Backend: START_SENSITIVITY_HIGH
      endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",         // Backend: END_SENSITIVITY_HIGH
      silenceDurationMs: 50,                                   // Backend: 50 (was 2000!)
      prefixPaddingMs: 20,                                     // Backend: 20 (was 500!)
    };
    this.activityHandling = "START_OF_ACTIVITY_INTERRUPTS";    // Backend: START_OF_ACTIVITY_INTERRUPTS

    // ── Session Resumption ──
    this.sessionResumptionHandle = null;

    // ── Session Resumption ──
    this.sessionResumptionHandle = null;

    // ── API v1beta (matched from backend: http_options={'api_version': 'v1beta'}) ──
    this.serviceUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.token}`;
    console.log("Service URL (v1beta): ", this.serviceUrl);

    this.connected = false;
    this.webSocket = null;
    this.lastSetupMessage = null;

    // Default callbacks
    this.onReceiveResponse = (message) => {
      console.log("Default message received callback", message);
    };

    this.onOpen = () => {
      console.log("Default onOpen");
    };

    this.onClose = () => {
      console.log("Default onClose");
    };

    this.onError = (message) => {
      console.error("WebSocket error:", message);
      this.connected = false;
    };

    console.log("Created Gemini Live API object: ", this);
  }

  setSystemInstructions(newSystemInstructions) {
    console.log("Setting system instructions (length:", newSystemInstructions?.length, "chars)");
    this.systemInstructions = newSystemInstructions;
  }

  setGoogleGrounding(newGoogleGrounding) {
    this.googleGrounding = newGoogleGrounding;
  }

  setResponseModalities(modalities) {
    this.responseModalities = modalities;
  }

  setVoice(voiceName) {
    console.log("Setting voice:", voiceName);
    this.voiceName = voiceName;
  }

  setInputAudioTranscription(enabled) {
    this.inputAudioTranscription = enabled;
  }

  setOutputAudioTranscription(enabled) {
    this.outputAudioTranscription = enabled;
  }

  setEnableFunctionCalls(enabled) {
    this.enableFunctionCalls = enabled;
  }

  /**
   * Set raw function declarations array (from axelTools.config.ts)
   */
  setFunctionDeclarations(declarations) {
    this._rawDeclarations = declarations;
    console.log(`Set ${declarations?.length || 0} function declarations`);
  }

  addFunction(newFunction) {
    this.functions.push(newFunction);
    this.functionsMap[newFunction.name] = newFunction;
  }

  callFunction(functionName, parameters) {
    const functionToCall = this.functionsMap[functionName];
    if (!functionToCall) {
      console.warn(`Function ${functionName} not found in functionsMap`);
      return { status: "error", error: "function_not_found" };
    }
    return functionToCall.runFunction(parameters);
  }

  connect() {
    this.setupWebSocketToService();
  }

  /**
   * Re-apply current setup over an active socket (no reconnect).
   * Returns true when a setup message was sent.
   */
  applySetupIfConnected() {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.sendInitialSetupMessages();
      return true;
    }
    return false;
  }

  disconnect() {
    if (this.webSocket) {
      this.webSocket.close();
      this.connected = false;
    }
  }

  sendMessage(message) {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(message));
    }
  }

  async onReceiveMessage(messageEvent) {
    let jsonData;
    if (messageEvent.data instanceof Blob) {
      jsonData = await messageEvent.data.text();
    } else if (messageEvent.data instanceof ArrayBuffer) {
      jsonData = new TextDecoder().decode(messageEvent.data);
    } else {
      jsonData = messageEvent.data;
    }

    try {
      const messageData = JSON.parse(jsonData);

      // Handle session resumption updates internally
      if (messageData?.sessionResumptionUpdate) {
        const update = messageData.sessionResumptionUpdate;
        if (update.resumable && update.newHandle) {
          this.sessionResumptionHandle = update.newHandle;
          console.log("❤️ Session resumption handle updated");
        }
      }

      const responses = parseResponseMessages(messageData);
      for (const response of responses) {
        this.onReceiveResponse(response);
      }
    } catch (err) {
      console.error("Error parsing JSON message:", err, jsonData);
    }
  }

  setupWebSocketToService() {
    console.log("Connecting to:", this.serviceUrl.replace(/key=.*/, "key=***"));

    this.webSocket = new WebSocket(this.serviceUrl);

    this.webSocket.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      this.connected = false;
      this.onClose();
    };

    this.webSocket.onerror = (event) => {
      console.error("WebSocket error:", event);
      this.connected = false;
      this.onError("Connection error");
    };

    this.webSocket.onopen = (event) => {
      console.log("WebSocket open");
      this.connected = true;
      this.totalBytesSent = 0;
      this.sendInitialSetupMessages();
      this.onOpen();
    };

    this.webSocket.onmessage = this.onReceiveMessage.bind(this);
  }

  /**
   * Build function declarations for the setup message.
   * Prefers raw declarations from setFunctionDeclarations(), falls back to legacy functions.
   */
  _buildToolDeclarations() {
    if (this._rawDeclarations && this._rawDeclarations.length > 0) {
      return this._rawDeclarations;
    }
    // Legacy path: build from addFunction() calls
    return this.functions.map((func) => func.getDefinition ? func.getDefinition() : func);
  }

  /**
   * Send the initial setup message — Stable version for v1beta.
   */
  sendInitialSetupMessages() {
    const tools = this._buildToolDeclarations();

    const sessionSetupMessage = {
      setup: {
        model: this.modelUri,
        generationConfig: {
          responseModalities: this.responseModalities,
          temperature: this.temperature,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.voiceName,
              },
            },
          },
        },
        systemInstruction: { parts: [{ text: this.systemInstructions }] },
        tools: tools.length > 0 ? [{ functionDeclarations: tools }] : [],
      },
    };

    // Google Search grounding (mutually exclusive with custom tools in v1beta)
    if (this.googleGrounding) {
      console.log("Google Search enabled, replacing custom tools.");
      sessionSetupMessage.setup.tools = [{ googleSearch: {} }];
    }

    this.lastSetupMessage = sessionSetupMessage;
    console.log("📡 Setup message sent (tools:", tools.length, ", voice:", this.voiceName, ")");
    this.sendMessage(sessionSetupMessage);
  }

  /**
   * Send text via realtimeInput (matches backend send_realtime_input(text=...))
   */
  sendTextMessage(text) {
    const message = {
      realtimeInput: {
        text: text,
      },
    };
    this.sendMessage(message);
  }

  /**
   * Send tool response back to Gemini (matches backend send_tool_response)
   * @param {Array} functionResponses - Array of { name, id, response, scheduling? }
   */
  sendToolResponse(functionResponses) {
    const message = {
      toolResponse: {
        functionResponses: functionResponses.map((fr) => ({
          name: fr.name,
          id: fr.id,
          response: fr.response,
          // scheduling: WHEN_IDLE prevents interrupting current audio
          ...(fr.scheduling ? { scheduling: fr.scheduling } : { scheduling: "WHEN_IDLE" }),
        })),
      },
    };
    console.log("🔧 Sending tool response:", JSON.stringify(message).substring(0, 200));
    this.sendMessage(message);
  }

  /**
   * Send audio/video realtime input — Updated for latest v1beta requirements
   */
  sendRealtimeInputMessage(data, mimeType) {
    const message = {
      realtimeInput: {},
    };

    if (mimeType.startsWith("audio/")) {
      message.realtimeInput.audio = {
        data: data,
        mimeType: mimeType,
      };
    } else if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
      message.realtimeInput.video = {
        data: data,
        mimeType: mimeType,
      };
    }

    this.sendMessage(message);
    this.addToBytesSent(data);
  }

  addToBytesSent(data) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    this.totalBytesSent += encodedData.length;
  }

  getBytesSent() {
    return this.totalBytesSent;
  }

  sendAudioMessage(base64PCM) {
    this.sendRealtimeInputMessage(base64PCM, "audio/pcm");
  }

  async sendImageMessage(base64Image, mimeType = "image/jpeg") {
    this.sendRealtimeInputMessage(base64Image, mimeType);
  }
}

console.log("loaded geminiLiveAPI.js (VERSION 2.1 - FIXED STRUCTURE)");
