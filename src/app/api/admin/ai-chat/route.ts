import { NextRequest } from "next/server";
import { handleAIChat } from "@/lib/ai/chatbot-runtime";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET=(request:NextRequest)=>handleAIChat(request,"admin","GET");
export const POST=(request:NextRequest)=>handleAIChat(request,"admin","POST");
export const PATCH=(request:NextRequest)=>handleAIChat(request,"admin","PATCH");
export const DELETE=(request:NextRequest)=>handleAIChat(request,"admin","DELETE");
