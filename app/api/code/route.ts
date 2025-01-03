import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkApiLimit, increaseApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

// Initialize GoogleGenerativeAI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const instructionMessage = {
  role: "system",
  content:
    "You are a code generator. You must answer only in markdown code snippets. Use code comments for explanation. And now give me solution for with explanation of the code as well: ",
};

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { messages } = body;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!genAI.apiKey) {
      return NextResponse.json(
        { error: "Gemini API Key not configured" },
        { status: 500 }
      );
    }
    const freeTrial = await checkApiLimit();
    const isPro = checkSubscription();

    if (!freeTrial && !isPro) {
      return new NextResponse("Free Trial has expired.", { status: 403 });
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages are required and should be an array" },
        { status: 400 }
      );
    }
    const prompt = [instructionMessage, ...messages]
      .map((msg: { content: string }) => msg.content)
      .join("\n");

    if (!isPro) {
      await increaseApiLimit();
    }
    const result = await model.generateContent(prompt);

    return NextResponse.json({
      role: "model",
      content: result.response.text(),
    });
  } catch (error: any) {
    console.error("[Conversation_Error]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
