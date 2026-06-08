import { connectDB } from "@/lib/db";
import { employeeRepository } from "@/repositories/employee.repository";
import { chatWithTools } from "@/modules/agents/shared/ai-client";
import { buildAssistantTools, buildAdminAssistantTools } from "./tools";
import { buildAssistantSystemPrompt, ASSISTANT_SUGGESTED_PROMPTS, type AssistantMode } from "./prompts";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const ONBOARDING_WINDOW_DAYS = 14;

export interface AssistantChatTurn {
  role: "user" | "assistant";
  content: string;
}

export class AssistantAgentService {
  /**
   * Chooses the assistant's persona for an employee: anyone who joined within
   * the last two weeks gets the warmer "onboarding" framing; everyone else
   * gets the steady-state "support" framing. Both share the same tool registry
   * and data — this is presentation-layer orchestration, not two separate bots.
   */
  private resolveMode(joiningDate?: Date | string | null): AssistantMode {
    if (!joiningDate) return "support";
    const joined = new Date(joiningDate);
    const daysSinceJoining = (Date.now() - joined.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceJoining <= ONBOARDING_WINDOW_DAYS ? "onboarding" : "support";
  }

  /**
   * Admins authenticate via `ADMIN_EMAILS` and have no `Employee` profile —
   * they get a policy-only persona instead of a 404. Everyone else gets the
   * full employee-scoped experience (onboarding or steady-state support).
   */
  async chat(userId: string, history: AssistantChatTurn[]) {
    await connectDB();

    const employee = await employeeRepository.findByUserId(userId);

    const mode: AssistantMode = employee ? this.resolveMode(employee.joiningDate) : "admin";
    const system = employee
      ? buildAssistantSystemPrompt(mode, employee.fullName, employee.designation, employee.department)
      : buildAssistantSystemPrompt(mode, "System Administrator");
    const tools = employee ? buildAssistantTools(employee) : buildAdminAssistantTools();

    const messages: ChatCompletionMessageParam[] = history.map(turn => ({
      role: turn.role,
      content: turn.content,
    }));

    const reply = await chatWithTools({ system, messages, tools });

    return {
      mode,
      reply,
      suggestedPrompts: ASSISTANT_SUGGESTED_PROMPTS[mode],
    };
  }

  getSuggestedPrompts(mode: AssistantMode) {
    return ASSISTANT_SUGGESTED_PROMPTS[mode];
  }
}

export const assistantAgentService = new AssistantAgentService();
