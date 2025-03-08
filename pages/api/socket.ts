import { NextApiRequest } from "next"
import { NextApiResponseServerIO } from "@/lib/types-server"
import SocketHandler from "./socketio"

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Pass to socket handler
  return SocketHandler(req, res);
}

// Configure to prevent response body parsing
export const config = {
  api: {
    bodyParser: false,
  },
}
