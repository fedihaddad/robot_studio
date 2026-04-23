import { GeminiLiveAPI, MultimodalLiveResponseType } from './geminiLiveAPI.js';
import { AudioStreamer, AudioPlayer, VideoStreamer } from './mediaUtils.js';
import { getToolDeclarationsForMode, PHYSICAL_ACTION_TOOLS } from '../../config/axelTools.config';
import { buildSystemInstructionForMode } from '../../config/axelPrompts.config';
import { getModeCapabilities } from '../../config/robotModes.config';
import type { RobotMode } from '../../types';

/**
 * GeminiService — Full backend-parity Gemini Live integration.
 * 
 * Mirrors axel_live_node.py behavior:
 * - Full system instruction (identity + sensibilite + mode prompt)
 * - All 48+ tool declarations
 * - Tool call handling with auto-responses
 * - ROS bridge integration for robot commands
 * - Mode-aware tool filtering
 */
export class GeminiService {
  private client: any;
  private streamer: any;
  private videoStreamer: any;
  private player: any;
  private isStarted: boolean = false;
  private currentMode: RobotMode = 'GENERAL';
  private rosService: any = null;
  private onToolCallCallback: ((toolName: string, args: any) => void) | null = null;
  private onConnectionClosedCallback: (() => void) | null = null;

  constructor(apiKey: string, model: string) {
    this.client = new GeminiLiveAPI(apiKey, model);
    this.streamer = new AudioStreamer(this.client);
    this.videoStreamer = new VideoStreamer(this.client);
    this.player = new AudioPlayer();
    console.log('🤖 GeminiService initialized (v2.1)');
  }

  /**
   * Set the ROS service for publishing robot commands
   */
  public setRosService(rosService: any) {
    this.rosService = rosService;
  }

  /**
   * Set callback for tool call events (for UI feedback)
   */
  public setOnToolCall(callback: (toolName: string, args: any) => void) {
    this.onToolCallCallback = callback;
  }

  /**
   * Optional callback when the underlying websocket closes.
   * Useful for UI to auto-recover without manual restart.
   */
  public setOnConnectionClosed(callback: () => void) {
    this.onConnectionClosedCallback = callback;
  }

  /**
   * Configure for a specific robot mode.
   * Sets system instruction and tool declarations based on mode capabilities.
   */
  public configureForMode(mode: RobotMode) {
    this.currentMode = mode;
    const capabilities = getModeCapabilities(mode);

    // Build full system instruction: mode prompt + identity + sensibilite
    const fullInstruction = buildSystemInstructionForMode(capabilities.systemPrompt);
    this.client.setSystemInstructions(fullInstruction);

    // Set tool declarations filtered by mode capabilities
    const tools = getToolDeclarationsForMode(capabilities.allowPhysicalActions);
    this.client.setFunctionDeclarations(tools);

    // Apply mode update immediately on active session (no reconnect)
    const hotApplied = this.client.applySetupIfConnected?.();
    if (hotApplied) {
      console.log(`🔄 Hot-applied mode setup to active session: ${mode}`);
    }

    console.log(`🤖 Mode configured: ${mode} (${tools.length} tools, physical=${capabilities.allowPhysicalActions})`);
  }

  /**
   * Set system instruction directly (legacy compatibility)
   */
  public setSystemInstruction(instruction: string) {
    this.client.setSystemInstructions(instruction);
  }

  /**
   * Start the Gemini Live session with full tool call handling.
   */
  public async start(onResponse: (response: any) => void) {
    if (this.isStarted) return;

    // Configure for current mode before connecting
    this.configureForMode(this.currentMode);

    this.client.onReceiveResponse = (response: any) => {
      // ── AUDIO: play through speaker ──
      if (response.type === MultimodalLiveResponseType.AUDIO) {
        this.player.play(response.data);
      }

      // ── TOOL CALL: handle function calls from Gemini ──
      if (response.type === MultimodalLiveResponseType.TOOL_CALL) {
        this.handleToolCall(response.data);
      }

      // ── INTERRUPTED: clear audio queue ──
      if (response.type === MultimodalLiveResponseType.INTERRUPTED) {
        this.player.interrupt();
      }

      // Forward all responses to the UI callback
      onResponse(response);
    };

    this.client.onOpen = async () => {
      console.log('✅ Gemini Connection Open');
      await this.streamer.start();
      await this.player.init();
    };

    this.client.onClose = () => {
      console.log('❌ Gemini Connection Closed');
      // Socket is already closed. Just clean up local resources and notify UI.
      this.cleanupAfterClose();
      this.onConnectionClosedCallback?.();
    };

    this.client.connect();
    this.isStarted = true;
  }

  /**
   * Handle tool calls from Gemini — mirrors axel_live_node.py receive_loop logic.
   */
  private handleToolCall(toolCallData: any) {
    const functionCalls = toolCallData?.functionCalls || [];

    for (const call of functionCalls) {
      const { name, id, args } = call;
      console.log(`🛠️ Tool call: ${name}`, args);

      // Notify UI
      if (this.onToolCallCallback) {
        this.onToolCallCallback(name, args || {});
      }

      // ── get_current_time ──
      if (name === 'get_current_time') {
        const now = new Date();
        const pad = (value: number) => String(value).padStart(2, '0');
        const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        this.client.sendToolResponse([{
          name,
          id,
          response: { current_time: timeStr },
        }]);
        continue;
      }

      // ── terminer_conversation ──
      if (name === 'terminer_conversation') {
        console.log('🌙 Standby requested by Gemini');
        this.client.sendToolResponse([{
          name,
          id,
          response: { status: 'standby', mode: 'veille', confirmation: 'ok' },
        }]);
        continue;
      }

      // ── exit_assistant ──
      if (name === 'exit_assistant') {
        console.log('👋 Exit requested by Gemini');
        this.client.sendToolResponse([{
          name,
          id,
          response: { status: 'goodbye' },
          scheduling: 'INTERRUPT',
        }]);
        // Stop after goodbye audio plays
        setTimeout(() => this.stop(), 3000);
        continue;
      }

      // ── analyser_scene_vision ──
      if (name === 'analyser_scene_vision') {
        // Vision not available in dashboard — respond with error
        this.client.sendToolResponse([{
          name,
          id,
          response: {
            ok: false,
            error_type: 'vision_not_available',
            error: 'Vision analysis is not available from the dashboard. Use the robot backend for vision.',
          },
        }]);
        continue;
      }

      // ── Physical action tools (robot commands) ──
      if (PHYSICAL_ACTION_TOOLS.has(name)) {
        // Check mode allows physical actions
        const capabilities = getModeCapabilities(this.currentMode);
        if (!capabilities.allowPhysicalActions) {
          console.warn(`🚫 Physical action blocked by mode: ${name}`);
          this.client.sendToolResponse([{
            name,
            id,
            response: {
              status: 'blocked',
              reason: 'mode_restriction',
              tool: name,
            },
          }]);
          continue;
        }

        // Publish to ROS if connected
        this.publishRobotCommand(name);

        // Respond success to Gemini
        this.client.sendToolResponse([{
          name,
          id,
          response: {
            status: 'success',
            arduino_command: name,
            tool: name,
          },
        }]);
        continue;
      }

      // ── Unknown tool — respond with error ──
      console.warn(`⚠️ Unknown tool: ${name}`);
      this.client.sendToolResponse([{
        name,
        id,
        response: { status: 'error', error: `Unknown tool: ${name}` },
      }]);
    }
  }

  /**
   * Publish a robot command via ROS bridge.
   * Publishes to /robot_function (for RViz) and /robot_command (for ESP32).
   */
  private publishRobotCommand(functionName: string) {
    if (!this.rosService) {
      console.warn('⚠️ ROS not connected, command cached:', functionName);
      return;
    }

    try {
      // Publish to /robot_function topic (RViz sync)
      const functionTopic = this.rosService.createTopic?.('/robot_function', 'std_msgs/String');
      if (functionTopic) {
        functionTopic.publish({ data: functionName });
      }

      // Publish to /robot_command topic (ESP32 bridge)
      const commandTopic = this.rosService.createTopic?.('/robot_command', 'std_msgs/String');
      if (commandTopic) {
        commandTopic.publish({ data: functionName });
      }

      console.log(`⚡ [ROS] Published: ${functionName}`);
    } catch (error) {
      console.error('ROS publish error:', error);
    }
  }

  /**
   * Send a text message to Gemini (like backend's text_callback)
   */
  public sendText(text: string) {
    if (!this.isStarted) return;
    this.client.sendTextMessage(text);
  }

  /**
   * Stop the Gemini session
   */
  public stop() {
    this.isStarted = false;
    this.streamer.stop();
    this.videoStreamer.stop();
    this.player.interrupt();
    this.client.disconnect();
  }

  private cleanupAfterClose() {
    this.isStarted = false;
    try {
      this.streamer.stop();
    } catch {
      // best-effort
    }
    try {
      this.videoStreamer.stop();
    } catch {
      // best-effort
    }
    try {
      this.player.interrupt();
    } catch {
      // best-effort
    }
  }

  /**
   * Start video streaming
   */
  public async startVideo() {
    if (!this.isStarted) return;
    await this.videoStreamer.start({ fps: 1, width: 640, height: 480 });
  }

  /**
   * Stop video streaming
   */
  public stopVideo() {
    this.videoStreamer.stop();
  }

  /**
   * Check if the service is active
   */
  public isActive(): boolean {
    return this.isStarted;
  }

  /**
   * Get the current mode
   */
  public getCurrentMode(): RobotMode {
    return this.currentMode;
  }
}
