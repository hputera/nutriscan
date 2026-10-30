import {NextResponse} from "next/server";
import {storageReady} from "@/lib/storage";
export async function GET(){return NextResponse.json({gemini:Boolean(process.env.GEMINI_API_KEY),database:Boolean(process.env.DATABASE_URL),photos:storageReady(),accessCodeRequired:Boolean(process.env.PROTOTYPE_ACCESS_CODE)},{headers:{"Cache-Control":"no-store"}});}
